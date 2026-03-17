import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar.jsx';
import ZoneEditor from '../components/ZoneEditor.jsx';
import { useToast } from '../components/Toast.jsx';

export default function EditTest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeScreen, setActiveScreen] = useState(0);
  const [screens, setScreens] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [introText, setIntroText] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [notifyAfter, setNotifyAfter] = useState('');

  useEffect(() => {
    axios.get(`/api/tests/${id}`)
      .then(({ data }) => {
        setTest(data);
        setTitle(data.title);
        setDescription(data.description || '');
        setIntroText(data.intro_text || '');
        setWebhookUrl(data.webhook_url || '');
        setNotifyAfter(data.notify_after ? String(data.notify_after) : '');
        setScreens(data.screens.map(s => ({ ...s, zones: s.zones || [] })));
      })
      .catch(() => toast('Failed to load test', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  function updateScreen(i, key, val) {
    setScreens(s => s.map((sc, idx) => idx === i ? { ...sc, [key]: val } : sc));
  }

  function moveScreen(i, dir) {
    const arr = [...screens];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setScreens(arr);
    setActiveScreen(j);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await axios.put(`/api/tests/${id}`, {
        title, description, screens,
        intro_text: introText,
        webhook_url: webhookUrl,
        notify_after: parseInt(notifyAfter) || 0
      });
      toast('Test updated!');
      navigate(`/results/${id}`);
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="page"><Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
    </div>
  );

  const current = screens[activeScreen];

  return (
    <div className="page">
      <Navbar />
      <div className="container" style={{ padding: '32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <Link to={`/results/${id}`} style={{ color: 'var(--text3)', fontSize: 13 }}>← Results</Link>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Edit test</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div className="card" style={{ marginBottom: 18 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Test details</h2>
              <div style={{ marginBottom: 12 }}>
                <label className="label">Title</label>
                <input className="input" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label className="label">Description</label>
                <textarea className="textarea" value={description} onChange={e => setDescription(e.target.value)} />
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
              <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Screens</h2>
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
                    <img src={sc.url} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 2 }}>Screen {i + 1}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {sc.task || <span style={{ color: 'var(--text3)' }}>No task</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      {sc.zones.length > 0 && <span className="badge badge-purple">{sc.zones.length}z</span>}
                      <button onClick={e => { e.stopPropagation(); moveScreen(i, -1); }} className="btn btn-ghost btn-sm" style={{ padding: '4px 6px' }}>↑</button>
                      <button onClick={e => { e.stopPropagation(); moveScreen(i, 1); }} className="btn btn-ghost btn-sm" style={{ padding: '4px 6px' }}>↓</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            {current ? (
              <div className="card">
                <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Screen {activeScreen + 1}</h2>
                <div style={{ marginBottom: 16 }}>
                  <label className="label">Task</label>
                  <input
                    className="input"
                    value={current.task}
                    onChange={e => updateScreen(activeScreen, 'task', e.target.value)}
                    placeholder='e.g. "Find where to open an account"'
                  />
                </div>
                <div>
                  <label className="label">Target zones</label>
                  <ZoneEditor
                    imageUrl={current.url}
                    zones={current.zones}
                    onChange={zones => updateScreen(activeScreen, 'zones', zones)}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Link to={`/results/${id}`} className="btn btn-ghost">Cancel</Link>
          <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
            {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
