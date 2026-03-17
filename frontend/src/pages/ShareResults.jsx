import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Heatmap from '../components/Heatmap.jsx';

export default function ShareResults() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeScreen, setActiveScreen] = useState(0);
  const [activeTab, setActiveTab] = useState('heatmap');

  useEffect(() => {
    axios.get(`/api/tests/${id}/analytics`)
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  if (!data) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <p style={{ color: 'var(--text2)' }}>Results not found.</p>
    </div>
  );

  const { test, analytics, sessions } = data;
  const screenAnalytics = analytics?.per_screen?.[activeScreen];
  const screenData = test.screens[activeScreen];

  return (
    <div className="page">
      {/* Simple read-only header */}
      <nav style={{ background: 'rgba(14,14,17,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 16, height: 60 }}>
          <span style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>U</span>
          <span style={{ fontWeight: 600, fontSize: 16 }}>UXTest</span>
          <span style={{ fontSize: 13, color: 'var(--text3)', marginLeft: 4 }}>/ {test.title}</span>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--bg3)', border: '1px solid var(--border)', padding: '3px 10px', borderRadius: 99 }}>Read-only view</span>
          </div>
        </div>
      </nav>

      <div className="container" style={{ padding: '32px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>{test.title}</h1>
          {test.description && <p style={{ color: 'var(--text2)', fontSize: 14 }}>{test.description}</p>}
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
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>No data has been collected for this test yet.</p>
          </div>
        )}

        {analytics && (
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
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

            <div>
              {screenAnalytics && (
                <>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                    {['heatmap', 'firstclick', 'sessions'].map(t => (
                      <button key={t} onClick={() => setActiveTab(t)} className={`btn btn-sm ${activeTab === t ? 'btn-secondary' : 'btn-ghost'}`}>
                        {t === 'heatmap' ? '🔥 Heatmap' : t === 'firstclick' ? '👆 First click' : '📋 Sessions'}
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

                  <div style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>🎯</span>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(168,158,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Task shown to testers</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#e8e6ff' }}>{screenData.task}</div>
                    </div>
                  </div>

                  {activeTab === 'heatmap' && (
                    <div className="card">
                      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Click heatmap — Screen {activeScreen + 1}</h2>
                      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
                        <span style={{ color: 'var(--green)' }}>■</span> Correct target &nbsp;
                        <span style={{ color: 'var(--red)' }}>■</span> Missed click
                      </p>
                      <Heatmap imageUrl={screenData.url} clicks={screenAnalytics.heatmap_clicks} zones={screenData.zones} />
                    </div>
                  )}

                  {activeTab === 'firstclick' && (
                    <div className="card">
                      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>First-click analysis — Screen {activeScreen + 1}</h2>
                      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
                        Where each tester clicked first.&nbsp;
                        <strong style={{ color: 'var(--text)' }}>{screenAnalytics.first_clicks.length}</strong> first clicks recorded.
                      </p>
                      <Heatmap imageUrl={screenData.url} clicks={screenAnalytics.first_clicks} zones={screenData.zones} />
                    </div>
                  )}

                  {activeTab === 'sessions' && (
                    <div className="card">
                      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Sessions</h2>
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr><th>Tester</th><th>Date</th><th>Result</th><th>First zone hit</th><th>Time</th><th>Clicks</th><th>Misclicks</th></tr>
                          </thead>
                          <tbody>
                            {sessions.map(s => {
                              const sr = s.screen_results[activeScreen];
                              if (!sr) return null;
                              const firstHit = sr.clicks?.find(c => c.hit);
                              return (
                                <tr key={s.id}>
                                  <td style={{ color: 'var(--text)' }}>{s.tester_name || 'Anonymous'}</td>
                                  <td>{new Date(s.created_at).toLocaleDateString()}</td>
                                  <td><span className={`badge ${sr.success ? 'badge-green' : 'badge-red'}`}>{sr.success ? 'Success' : 'Miss'}</span></td>
                                  <td style={{ color: firstHit?.zone ? 'var(--green)' : 'var(--text3)', fontSize: 12 }}>{firstHit?.zone || (sr.success ? '—' : 'None')}</td>
                                  <td>{sr.time_to_success != null ? sr.time_to_success.toFixed(1) + 's' : '—'}</td>
                                  <td>{sr.total_clicks}</td>
                                  <td><span className={`badge ${sr.misclick_rate > 50 ? 'badge-red' : sr.misclick_rate > 20 ? 'badge-amber' : 'badge-green'}`}>{sr.misclick_rate}%</span></td>
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
