import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getDb } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(uploadsDir));

// TESTS
app.post('/api/tests', upload.array('screens'), async (req, res) => {
  try {
    const db = await getDb();
    const { title, description, screens_meta } = req.body;
    const id = uuidv4().slice(0, 8).toUpperCase();
    const screensMeta = JSON.parse(screens_meta || '[]');
    const screens = req.files.map((file, i) => ({
      id: uuidv4(), filename: file.filename,
      url: `/uploads/${file.filename}`,
      task: screensMeta[i]?.task || '', zones: screensMeta[i]?.zones || [], order: i
    }));
    const test = { id, title, description, screens, created_at: new Date().toISOString(), status: 'active' };
    db.data.tests.push(test);
    await db.write();
    res.json(test);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.get('/api/tests', async (req, res) => {
  const db = await getDb();
  res.json([...db.data.tests].reverse());
});

app.get('/api/tests/:id', async (req, res) => {
  const db = await getDb();
  const test = db.data.tests.find(t => t.id === req.params.id);
  if (!test) return res.status(404).json({ error: 'Test not found' });
  res.json(test);
});

app.put('/api/tests/:id', async (req, res) => {
  const db = await getDb();
  const idx = db.data.tests.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Test not found' });
  const { title, description, screens } = req.body;
  if (title) db.data.tests[idx].title = title;
  if (description !== undefined) db.data.tests[idx].description = description;
  if (screens) db.data.tests[idx].screens = screens;
  await db.write();
  res.json({ success: true });
});

app.delete('/api/tests/:id', async (req, res) => {
  const db = await getDb();
  db.data.tests = db.data.tests.filter(t => t.id !== req.params.id);
  db.data.sessions = db.data.sessions.filter(s => s.test_id !== req.params.id);
  await db.write();
  res.json({ success: true });
});

// SESSIONS
app.post('/api/tests/:id/sessions', async (req, res) => {
  try {
    const db = await getDb();
    const test = db.data.tests.find(t => t.id === req.params.id);
    if (!test) return res.status(404).json({ error: 'Test not found' });
    const { tester_name, tester_email, screens_data } = req.body;
    const screenResults = test.screens.map((screen, i) => {
      const sd = screens_data[i] || { clicks: [] };
      const successClick = sd.clicks.find(c => c.hit);
      return {
        screen_id: screen.id, screen_order: i, task: screen.task, clicks: sd.clicks,
        success: !!successClick, total_clicks: sd.clicks.length,
        time_to_first_click: sd.clicks[0] ? sd.clicks[0].t : null,
        time_to_success: successClick ? successClick.t : null,
        misclick_rate: sd.clicks.length > 0
          ? Math.round(sd.clicks.filter(c => !c.hit).length / sd.clicks.length * 100) : 0
      };
    });
    const overallSuccess = screenResults.every(r => r.success);
    const times = screenResults.filter(r => r.time_to_success !== null).map(r => r.time_to_success);
    const avgTime = times.length ? parseFloat((times.reduce((a,b)=>a+b,0)/times.length).toFixed(2)) : null;
    const session = {
      id: uuidv4(), test_id: req.params.id,
      tester_name: tester_name || 'Anonymous', tester_email: tester_email || '',
      screen_results: screenResults, overall_success: overallSuccess,
      avg_time_to_success: avgTime, created_at: new Date().toISOString()
    };
    db.data.sessions.push(session);
    await db.write();
    res.json({ session_id: session.id, overall_success: overallSuccess, avg_time: avgTime });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.get('/api/tests/:id/sessions', async (req, res) => {
  const db = await getDb();
  res.json(db.data.sessions.filter(s => s.test_id === req.params.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)));
});

// ANALYTICS
app.get('/api/tests/:id/analytics', async (req, res) => {
  const db = await getDb();
  const test = db.data.tests.find(t => t.id === req.params.id);
  if (!test) return res.status(404).json({ error: 'Not found' });
  const sessions = db.data.sessions.filter(s => s.test_id === req.params.id);
  if (sessions.length === 0) return res.json({ test, sessions: [], analytics: null });
  const analytics = {
    total_sessions: sessions.length,
    overall_success_rate: Math.round(sessions.filter(s => s.overall_success).length / sessions.length * 100),
    avg_time_to_success: parseFloat((sessions.filter(s=>s.avg_time_to_success!==null).reduce((a,s)=>a+(s.avg_time_to_success||0),0) / (sessions.filter(s=>s.avg_time_to_success!==null).length||1)).toFixed(2)),
    per_screen: test.screens.map((screen, si) => {
      const screenData = sessions.map(s => s.screen_results[si]).filter(Boolean);
      const allClicks = screenData.flatMap(sd => sd.clicks);
      const successful = screenData.filter(sd => sd.success);
      const times = successful.map(sd => sd.time_to_success).filter(t => t !== null);
      return {
        screen_id: screen.id, screen_order: si, task: screen.task,
        success_rate: screenData.length ? Math.round(successful.length / screenData.length * 100) : 0,
        avg_time: times.length ? parseFloat((times.reduce((a,b)=>a+b,0)/times.length).toFixed(2)) : null,
        avg_clicks: screenData.length ? parseFloat((screenData.reduce((a,sd)=>a+sd.total_clicks,0)/screenData.length).toFixed(1)) : 0,
        heatmap_clicks: allClicks,
        first_clicks: screenData.map(sd => sd.clicks[0]).filter(Boolean)
      };
    })
  };
  res.json({ test, sessions, analytics });
});

// EXPORT
app.get('/api/tests/:id/export', async (req, res) => {
  const db = await getDb();
  const test = db.data.tests.find(t => t.id === req.params.id);
  if (!test) return res.status(404).json({ error: 'Not found' });
  const sessions = db.data.sessions.filter(s => s.test_id === req.params.id);
  const rows = ['Session ID,Tester,Email,Date,Overall Success,Avg Time (s),Screens'];
  sessions.forEach(s => rows.push([s.id, s.tester_name, s.tester_email, new Date(s.created_at).toLocaleDateString(), s.overall_success ? 'Yes' : 'No', s.avg_time_to_success ?? '', s.screen_results.length].join(',')));
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=test-${req.params.id}-results.csv`);
  res.send(rows.join('\n'));
});

// serve built frontend in production
const frontendDist = path.join(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("/*", (req, res) => res.sendFile(path.join(frontendDist, "index.html")));
}

app.listen(PORT, () => console.log(`\n🎯 UXTest running on http://localhost:${PORT}\n`));
