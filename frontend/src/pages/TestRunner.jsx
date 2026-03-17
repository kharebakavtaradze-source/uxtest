import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function TestRunner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('intro'); // intro | testing | done
  const [testerName, setTesterName] = useState('');
  const [testerEmail, setTesterEmail] = useState('');
  const [screenIdx, setScreenIdx] = useState(0);
  const [screensData, setScreensData] = useState([]);
  const [clicks, setClicks] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);
  const imgRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axios.get(`/api/tests/${id}`)
      .then(({ data }) => setTest(data))
      .catch(() => setError('Test not found'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (step !== 'testing') return;
    setClicks([]);
    setStartTime(null);
    setElapsed(0);
    setDone(false);
    clearInterval(timerRef.current);
  }, [screenIdx, step]);

  const startTimer = () => {
    const t0 = Date.now();
    setStartTime(t0);
    timerRef.current = setInterval(() => setElapsed(((Date.now() - t0) / 1000).toFixed(1)), 100);
  };

  const screen = test?.screens?.[screenIdx];
  const totalScreens = test?.screens?.length || 0;

  function handleInteraction(clientX, clientY) {
    if (done || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const iw = imgRef.current.clientWidth, ih = imgRef.current.clientHeight;
    const px = (clientX - rect.left) / iw;
    const py = (clientY - rect.top) / ih;
    if (px < 0 || px > 1 || py < 0 || py > 1) return;

    if (!startTime) startTimer();

    const t = startTime ? (Date.now() - startTime) / 1000 : 0;
    const hit = screen.zones.some(z => px >= z.x && px <= z.x + z.w && py >= z.y && py <= z.y + z.h);
    const newClick = { x: px, y: py, t: parseFloat(t.toFixed(2)), hit, n: clicks.length + 1 };
    const newClicks = [...clicks, newClick];
    setClicks(newClicks);

    if (hit) {
      clearInterval(timerRef.current);
      setDone(true);
      setTimeout(() => advanceScreen(newClicks), 900);
    }
  }

  function handleClick(e) {
    handleInteraction(e.clientX, e.clientY);
  }

  function handleTouchEnd(e) {
    e.preventDefault();
    const t = e.changedTouches[0];
    handleInteraction(t.clientX, t.clientY);
  }

  function advanceScreen(finalClicks) {
    const updated = [...screensData];
    updated[screenIdx] = { clicks: finalClicks };
    setScreensData(updated);
    if (screenIdx + 1 < totalScreens) {
      setScreenIdx(i => i + 1);
    } else {
      submitSession(updated);
    }
  }

  async function submitSession(data) {
    setSubmitting(true);
    try {
      await axios.post(`/api/tests/${id}/sessions`, {
        tester_name: testerName || 'Anonymous',
        tester_email: testerEmail,
        screens_data: data
      });
      setStep('done');
    } catch (err) {
      const msg = err.response?.data?.error;
      setError(msg || 'Failed to submit');
    } finally { setSubmitting(false); }
  }

  function skipScreen() {
    const updated = [...screensData];
    updated[screenIdx] = { clicks: clicks.length > 0 ? clicks : [{ x: 0, y: 0, t: 0, hit: false, n: 1, skipped: true }] };
    clearInterval(timerRef.current);
    setScreensData(updated);
    if (screenIdx + 1 < totalScreens) setScreenIdx(i => i + 1);
    else submitSession(updated);
  }

  if (loading) return <Center><div className="spinner" style={{ width: 36, height: 36 }} /></Center>;
  if (error) return <Center><div style={{ textAlign: 'center', maxWidth: 360 }}><p style={{ color: 'var(--text2)', marginBottom: 16 }}>{error}</p></div></Center>;

  if (test?.status === 'closed') return (
    <Center>
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Test closed</h2>
        <p style={{ color: 'var(--text2)' }}>This test is no longer accepting responses.</p>
      </div>
    </Center>
  );

  if (test?.status === 'paused') return (
    <Center>
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏸</div>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Test paused</h2>
        <p style={{ color: 'var(--text2)' }}>This test is temporarily paused. Please check back later.</p>
      </div>
    </Center>
  );

  // INTRO
  if (step === 'intro') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: 'var(--accent)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 16px' }}>🎯</div>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>{test.title}</h1>
          {test.description && <p style={{ color: 'var(--text2)', fontSize: 14 }}>{test.description}</p>}
        </div>
        <div className="card" style={{ marginBottom: 16 }}>
          {test.intro_text && (
            <div style={{ marginBottom: 16, padding: '12px 14px', background: 'var(--bg3)', borderRadius: 8, fontSize: 14, color: 'var(--text)', lineHeight: 1.6, borderLeft: '3px solid var(--accent)' }}>
              {test.intro_text}
            </div>
          )}
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.6 }}>
            You'll be shown <strong style={{ color: 'var(--text)' }}>{totalScreens} screen{totalScreens !== 1 ? 's' : ''}</strong>. For each one, read the task and click where you'd naturally go. There are no wrong answers — we're studying the design, not you.
          </p>
          <div style={{ marginBottom: 12 }}>
            <label className="label">Your name (optional)</label>
            <input className="input" value={testerName} onChange={e => setTesterName(e.target.value)} placeholder="Anonymous" />
          </div>
          <div>
            <label className="label">Email (optional)</label>
            <input className="input" type="email" value={testerEmail} onChange={e => setTesterEmail(e.target.value)} placeholder="you@example.com" />
          </div>
        </div>
        <button onClick={() => setStep('testing')} className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
          Start test →
        </button>
      </div>
    </div>
  );

  // DONE
  if (step === 'done') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 10 }}>All done, thank you!</h1>
        <p style={{ color: 'var(--text2)', marginBottom: 28 }}>Your responses have been saved and will help improve the design.</p>
      </div>
    </div>
  );

  // TESTING
  return (
    <div style={{ minHeight: '100vh', background: '#08080b', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ background: '#111116', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>U</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>
            Screen {screenIdx + 1} of {totalScreens}
          </div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>
            <span style={{ color: 'var(--text3)', marginRight: 6 }}>Task:</span>
            {screen?.task}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 100, height: 4, background: 'var(--bg4)', borderRadius: 2 }}>
            <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 2, width: `${(screenIdx / totalScreens) * 100}%`, transition: 'width 0.3s' }} />
          </div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: 'var(--text2)', minWidth: 44, textAlign: 'right' }}>
            {elapsed}s
          </div>
        </div>
      </div>

      {/* Screen + clicks */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflow: 'auto' }}>
        <div
          style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', cursor: done ? 'default' : 'crosshair', touchAction: 'none' }}
          onClick={handleClick}
          onTouchEnd={handleTouchEnd}
        >
          <img
            ref={imgRef}
            src={screen?.url}
            alt="Screen"
            style={{ display: 'block', maxWidth: '100%', maxHeight: 'calc(100vh - 160px)', borderRadius: 8 }}
          />
          {/* Click dots */}
          {clicks.map((c, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${c.x * 100}%`, top: `${c.y * 100}%`,
              transform: 'translate(-50%,-50%)',
              width: 24, height: 24, borderRadius: '50%',
              background: c.hit ? 'rgba(34,197,94,0.85)' : 'rgba(239,68,68,0.75)',
              border: '2px solid white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: 'white',
              pointerEvents: 'none', transition: 'all 0.1s',
              animation: 'popIn 0.2s ease'
            }}>{c.n}</div>
          ))}
          {done && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 8,
              background: 'rgba(34,197,94,0.12)',
              border: '2px solid rgba(34,197,94,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none'
            }}>
              <div style={{ background: 'rgba(34,197,94,0.9)', color: 'white', padding: '10px 20px', borderRadius: 99, fontWeight: 600, fontSize: 16 }}>
                ✓ Found it!
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '12px 24px', background: '#111116', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>{clicks.length} click{clicks.length !== 1 ? 's' : ''} so far</span>
        <button onClick={skipScreen} className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>
          Skip this screen →
        </button>
      </div>

      <style>{`@keyframes popIn { from { transform: translate(-50%,-50%) scale(0.4); opacity: 0.5; } to { transform: translate(-50%,-50%) scale(1); opacity: 1; } }`}</style>
    </div>
  );
}

function Center({ children }) {
  return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>{children}</div>;
}
