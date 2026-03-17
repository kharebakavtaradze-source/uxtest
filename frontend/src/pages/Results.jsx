import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar.jsx';
import Heatmap from '../components/Heatmap.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Results() {
  const { id } = useParams();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeScreen, setActiveScreen] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const testUrl = `${window.location.origin}/test/${id}`;

  useEffect(() => { fetchData(); }, [id]);

  async function fetchData() {
    try {
      const { data } = await axios.get(`/api/tests/${id}/analytics`);
      setData(data);
    } catch { toast('Failed to load results', 'error'); }
    finally { setLoading(false); }
  }

  function copyLink() {
    navigator.clipboard.writeText(testUrl);
    toast('Link copied to clipboard!');
  }

  async function exportCSV() {
    window.open(`/api/tests/${id}/export`, '_blank');
  }

  if (loading) return (
    <div className="page"><Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
    </div>
  );

  if (!data) return <div className="page"><Navbar /><div className="container" style={{ paddingTop: 40 }}><p>Test not found.</p></div></div>;

  const { test, analytics, sessions } = data;
  const screenAnalytics = analytics?.per_screen?.[activeScreen];
  const screenData = test.screens[activeScreen];

  return (
    <div className="page">
      <Navbar />
      <div className="container" style={{ padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <Link to="/" style={{ color: 'var(--text3)', fontSize: 13 }}>← Dashboard</Link>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>{test.title}</h1>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>{test.description}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={copyLink} className="btn btn-secondary btn-sm">🔗 Copy test link</button>
            <button onClick={exportCSV} className="btn btn-secondary btn-sm">⬇ Export CSV</button>
            <Link to={`/test/${id}`} className="btn btn-primary btn-sm" target="_blank">▶ Open test</Link>
          </div>
        </div>

        {/* Share link box */}
        <div style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Share with testers:</span>
          <span className="mono" style={{ fontSize: 13, color: '#a89eff', flex: 1, wordBreak: 'break-all' }}>{testUrl}</span>
          <button onClick={copyLink} className="btn btn-sm" style={{ background: 'rgba(108,99,255,0.2)', color: '#a89eff', border: '1px solid rgba(108,99,255,0.3)', flexShrink: 0 }}>Copy</button>
        </div>

        {/* Summary metrics */}
        {analytics ? (
          <div className="metric-grid" style={{ marginBottom: 28 }}>
            <div className="metric-card">
              <div className="metric-label">Total sessions</div>
              <div className="metric-value">{analytics.total_sessions}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Overall success rate</div>
              <div className="metric-value" style={{ color: analytics.overall_success_rate > 70 ? 'var(--green)' : analytics.overall_success_rate > 40 ? 'var(--amber)' : 'var(--red)' }}>
                {analytics.overall_success_rate}%
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Avg time to success</div>
              <div className="metric-value">{analytics.avg_time_to_success}s</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Screens</div>
              <div className="metric-value">{test.screens.length}</div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '40px 24px', marginBottom: 28 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>No sessions yet</h2>
            <p style={{ color: 'var(--text2)', marginBottom: 20, fontSize: 14 }}>Share the link above with your testers to start collecting data.</p>
            <Link to={`/test/${id}`} className="btn btn-primary" target="_blank">Try the test yourself →</Link>
          </div>
        )}

        {analytics && (
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
            {/* Screen list */}
            <div>
              <div className="card" style={{ padding: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, padding: '0 4px' }}>Screens</div>
                {test.screens.map((sc, i) => {
                  const sa = analytics.per_screen[i];
                  return (
                    <div
                      key={i}
                      onClick={() => setActiveScreen(i)}
                      style={{
                        padding: '9px 10px', borderRadius: 8, cursor: 'pointer',
                        background: activeScreen === i ? 'rgba(108,99,255,0.12)' : 'transparent',
                        border: '1px solid', borderColor: activeScreen === i ? 'rgba(108,99,255,0.3)' : 'transparent',
                        marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8
                      }}
                    >
                      <img src={sc.url} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>Screen {i + 1}</div>
                        <div style={{ fontSize: 11, color: sa?.success_rate > 70 ? 'var(--green)' : sa?.success_rate > 40 ? 'var(--amber)' : 'var(--red)' }}>
                          {sa?.success_rate ?? 0}% success
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Screen analytics */}
            <div>
              {screenAnalytics && (
                <>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                    {['heatmap', 'sessions'].map(t => (
                      <button key={t} onClick={() => setActiveTab(t)} className={`btn btn-sm ${activeTab === t ? 'btn-secondary' : 'btn-ghost'}`}>
                        {t === 'heatmap' ? '🔥 Heatmap' : '📋 Sessions'}
                      </button>
                    ))}
                  </div>

                  <div className="metric-grid" style={{ marginBottom: 16, gridTemplateColumns: 'repeat(4,1fr)' }}>
                    <div className="metric-card">
                      <div className="metric-label">Success rate</div>
                      <div className="metric-value" style={{ fontSize: 20, color: screenAnalytics.success_rate > 70 ? 'var(--green)' : 'var(--amber)' }}>{screenAnalytics.success_rate}%</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-label">Avg time</div>
                      <div className="metric-value" style={{ fontSize: 20 }}>{screenAnalytics.avg_time != null ? screenAnalytics.avg_time + 's' : '—'}</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-label">Avg clicks</div>
                      <div className="metric-value" style={{ fontSize: 20 }}>{screenAnalytics.avg_clicks}</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-label">Total clicks</div>
                      <div className="metric-value" style={{ fontSize: 20 }}>{screenAnalytics.heatmap_clicks.length}</div>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 13, color: 'var(--text2)' }}>
                    <strong style={{ color: 'var(--text)' }}>Task: </strong>{screenData.task}
                  </div>

                  {activeTab === 'heatmap' && (
                    <div className="card">
                      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Click heatmap — Screen {activeScreen + 1}</h2>
                      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
                        <span style={{ color: 'var(--green)' }}>■</span> Correct target &nbsp;
                        <span style={{ color: 'var(--red)' }}>■</span> Missed click
                      </p>
                      <Heatmap
                        imageUrl={screenData.url}
                        clicks={screenAnalytics.heatmap_clicks}
                        zones={screenData.zones}
                      />
                    </div>
                  )}

                  {activeTab === 'sessions' && (
                    <div className="card">
                      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Sessions</h2>
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Tester</th>
                              <th>Date</th>
                              <th>Result</th>
                              <th>Time</th>
                              <th>Clicks</th>
                              <th>Misclicks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sessions.map(s => {
                              const sr = s.screen_results[activeScreen];
                              if (!sr) return null;
                              return (
                                <tr key={s.id}>
                                  <td style={{ color: 'var(--text)' }}>{s.tester_name || 'Anonymous'}</td>
                                  <td>{new Date(s.created_at).toLocaleDateString()}</td>
                                  <td>
                                    <span className={`badge ${sr.success ? 'badge-green' : 'badge-red'}`}>
                                      {sr.success ? 'Success' : 'Miss'}
                                    </span>
                                  </td>
                                  <td>{sr.time_to_success != null ? sr.time_to_success.toFixed(1) + 's' : '—'}</td>
                                  <td>{sr.total_clicks}</td>
                                  <td>
                                    <span className={`badge ${sr.misclick_rate > 50 ? 'badge-red' : sr.misclick_rate > 20 ? 'badge-amber' : 'badge-green'}`}>
                                      {sr.misclick_rate}%
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
