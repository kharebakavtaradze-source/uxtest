import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Dashboard() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => { fetchTests(); }, []);

  async function fetchTests() {
    try {
      const { data } = await axios.get('/api/tests');
      setTests(data);
    } catch { toast('Failed to load tests', 'error'); }
    finally { setLoading(false); }
  }

  async function deleteTest(id, e) {
    e.preventDefault();
    if (!confirm('Delete this test and all its sessions?')) return;
    await axios.delete(`/api/tests/${id}`);
    toast('Test deleted');
    fetchTests();
  }

  return (
    <div className="page">
      <Navbar />
      <div className="container" style={{ padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 600, marginBottom: 4 }}>Your tests</h1>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>Create usability tests and collect click data from real users.</p>
          </div>
          <Link to="/create" className="btn btn-primary btn-lg">+ New Test</Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : tests.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>No tests yet</h2>
            <p style={{ color: 'var(--text2)', marginBottom: 24 }}>Upload your design screens and start collecting click data.</p>
            <Link to="/create" className="btn btn-primary">Create your first test</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
            {tests.map(test => <TestCard key={test.id} test={test} onDelete={deleteTest} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function TestCard({ test, onDelete }) {
  const thumb = test.screens?.[0]?.url;
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', transition: 'border-color 0.15s' }}>
      <div style={{ height: 160, background: 'var(--bg3)', overflow: 'hidden', position: 'relative' }}>
        {thumb ? (
          <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text3)', fontSize: 32 }}>📱</div>
        )}
        <div style={{ position: 'absolute', bottom: 10, left: 12 }}>
          <span className="badge badge-purple">{test.screens?.length || 0} screen{test.screens?.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
          <div>
            <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 3 }}>{test.title}</h3>
            <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.4 }}>{test.description || 'No description'}</p>
          </div>
          <span className="badge badge-green" style={{ flexShrink: 0, marginTop: 2 }}>Active</span>
        </div>
        <div style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 14 }}>
          Created {new Date(test.created_at).toLocaleDateString()}
          &nbsp;·&nbsp; ID: <span className="mono">{test.id}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to={`/results/${test.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>📊 Results</Link>
          <Link to={`/test/${test.id}`} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>▶ Run Test</Link>
          <button onClick={e => onDelete(test.id, e)} className="btn btn-ghost btn-sm">🗑</button>
        </div>
      </div>
    </div>
  );
}
