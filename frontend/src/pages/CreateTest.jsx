import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar.jsx';
import ZoneEditor from '../components/ZoneEditor.jsx';
import { useToast } from '../components/Toast.jsx';

export default function CreateTest() {
  const navigate = useNavigate();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [introText, setIntroText] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [notifyAfter, setNotifyAfter] = useState('');
  const [screens, setScreens] = useState([]);
  const [saving, setSaving] = useState(false);
  const [activeScreen, setActiveScreen] = useState(0);

  function handleFiles(e) {
    const files = Array.from(e.target.files);
    const newScreens = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      task: '',
      zones: []
    }));
    setScreens(s => [...s, ...newScreens]);
  }

  function updateScreen(i, key, val) {
    setScreens(s => s.map((sc, idx) => idx === i ? { ...sc, [key]: val } : sc));
  }

  function removeScreen(i) {
    setScreens(s => s.filter((_, idx) => idx !== i));
    if (activeScreen >= i && activeScreen > 0) setActiveScreen(activeScreen - 1);
  }

  function moveScreen(i, dir) {
    const arr = [...screens];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setScreens(arr);
    setActiveScreen(j);
  }

  async function handleSubmit() {
    if (!title.trim()) { toast('Please enter a test title', 'error'); return; }
    if (screens.length === 0) { toast('Add at least one screen', 'error'); return; }
    const hasTask = screens.every(s => s.task.trim());
    if (!hasTask) { toast('Every screen needs a task description', 'error'); return; }
    const hasZone = screens.every(s => s.zones.length > 0);
    if (!hasZone) { toast('Every screen needs at least one target zone', 'error'); return; }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('intro_text', introText);
      formData.append('webhook_url', webhookUrl);
      formData.append('notify_after', notifyAfter || '0');
      screens.forEach(s => formData.append('screens', s.file));
      formData.append('screens_meta', JSON.stringify(screens.map(s => ({ task: s.task, zones: s.zones }))));

      const { data } = await axios.post('/api/tests', formData);
      toast('Test created!');
      navigate(`/results/${data.id}`);
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to create test', 'error');
    } finally {
      setSaving(false);
    }
  }

  const current = screens[activeScreen];

  return (
    <div className="page">
      <Navbar />
      <div className="container" style={{ padding: '36px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Create a new test</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>Upload your design screens, define tasks, and draw target zones.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Left: metadata & screens list */}
          <div>
            <div className="card" style={{ marginBottom: 18 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Test details</h2>
              <div style={{ marginBottom: 12 }}>
                <label className="label">Title *</label>
                <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Onboarding flow test" />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label className="label">Description</label>
                <textarea className="textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="What are you testing and why?" />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label className="label">Custom intro text (optional)</label>
                <textarea className="textarea" style={{ minHeight: 64 }} value={introText} onChange={e => setIntroText(e.target.value)} placeholder="Additional instructions shown to testers before they start..." />
              </div>

              <details style={{ marginTop: 4 }}>
                <summary style={{ fontSize: 13, color: 'var(--text2)', cursor: 'pointer', userSelect: 'none' }}>⚙️ Webhook / notification (optional)</summary>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label className="label">Webhook URL</label>
                    <input className="input" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://hooks.example.com/..." />
                    <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>We'll POST JSON to this URL when the threshold is reached.</p>
                  </div>
                  <div>
                    <label className="label">Notify after N sessions</label>
                    <input className="input" type="number" min="0" value={notifyAfter} onChange={e => setNotifyAfter(e.target.value)} placeholder="e.g. 10" />
                  </div>
                </div>
              </details>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600 }}>Screens ({screens.length})</h2>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                  + Upload
                  <input type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: 'none' }} />
                </label>
              </div>

              {screens.length === 0 ? (
                <label style={{
                  display: 'block', border: '2px dashed var(--border2)', borderRadius: 10,
                  padding: '36px 24px', textAlign: 'center', cursor: 'pointer',
                  color: 'var(--text3)', fontSize: 14, transition: 'border-color 0.15s'
                }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📤</div>
                  Click to upload PNG/JPG screens<br />
                  <span style={{ fontSize: 12 }}>Up to 10MB each</span>
                  <input type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: 'none' }} />
                </label>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {screens.map((sc, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveScreen(i)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                        borderRadius: 8, cursor: 'pointer', border: '1px solid',
                        borderColor: activeScreen === i ? 'var(--accent)' : 'var(--border)',
                        background: activeScreen === i ? 'rgba(108,99,255,0.08)' : 'var(--bg3)'
                      }}
                    >
                      <img src={sc.preview} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 2 }}>Screen {i + 1}</div>
                        <div style={{ fontSize: 12, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {sc.task || <span style={{ color: 'var(--text3)' }}>No task yet</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        {sc.zones.length > 0 && <span className="badge badge-green">{sc.zones.length}z</span>}
                        <button onClick={e => { e.stopPropagation(); moveScreen(i, -1); }} className="btn btn-ghost btn-sm" style={{ padding: '4px 6px' }}>↑</button>
                        <button onClick={e => { e.stopPropagation(); moveScreen(i, 1); }} className="btn btn-ghost btn-sm" style={{ padding: '4px 6px' }}>↓</button>
                        <button onClick={e => { e.stopPropagation(); removeScreen(i); }} className="btn btn-ghost btn-sm" style={{ padding: '4px 6px', color: 'var(--red)' }}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: screen editor */}
          <div>
            {current ? (
              <div className="card">
                <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
                  Screen {activeScreen + 1} — Edit task & zones
                </h2>
                <div style={{ marginBottom: 16 }}>
                  <label className="label">Task for tester *</label>
                  <input
                    className="input"
                    value={current.task}
                    onChange={e => updateScreen(activeScreen, 'task', e.target.value)}
                    placeholder='e.g. "Find where to open a new account"'
                  />
                  <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 5 }}>
                    This is shown to the tester as an instruction.
                  </p>
                </div>

                <div>
                  <label className="label">Target zones *</label>
                  <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>
                    Draw rectangles over the correct click targets on the screen.
                  </p>
                  <ZoneEditor
                    imageUrl={current.preview}
                    zones={current.zones}
                    onChange={zones => updateScreen(activeScreen, 'zones', zones)}
                  />
                </div>
              </div>
            ) : (
              <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: 'var(--text3)', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 36 }}>←</div>
                <p>Upload screens and select one to edit</p>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button onClick={() => navigate('/')} className="btn btn-ghost">Cancel</button>
          <button onClick={handleSubmit} className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Saving...</> : '🚀 Create & get link'}
          </button>
        </div>
      </div>
    </div>
  );
}
