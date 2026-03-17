import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const loc = useLocation();
  return (
    <nav style={{
      background: 'rgba(14,14,17,0.85)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 32, height: 60 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 16 }}>
          <span style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>U</span>
          UXTest
        </Link>
        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
          <NavLink to="/" label="Dashboard" active={loc.pathname === '/'} />
          <NavLink to="/create" label="New Test" active={loc.pathname === '/create'} />
        </div>
        <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>v1.1</span>
      </div>
    </nav>
  );
}

function NavLink({ to, label, active }) {
  return (
    <Link to={to} style={{
      padding: '6px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500,
      color: active ? 'var(--text)' : 'var(--text2)',
      background: active ? 'var(--bg3)' : 'transparent',
      transition: 'all 0.15s'
    }}>{label}</Link>
  );
}
