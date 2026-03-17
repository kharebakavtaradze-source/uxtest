import React, { useRef, useState, useEffect, useCallback } from 'react';

export default function ZoneEditor({ imageUrl, zones, onChange, readonly = false }) {
  const wrapRef = useRef(null);
  const imgRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [liveRect, setLiveRect] = useState(null);
  const [pendingName, setPendingName] = useState('');
  const [addMode, setAddMode] = useState(false);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const update = () => setImgSize({ w: img.clientWidth, h: img.clientHeight });
    img.addEventListener('load', update);
    if (img.complete) update();
    const ro = new ResizeObserver(update);
    ro.observe(img);
    return () => { img.removeEventListener('load', update); ro.disconnect(); };
  }, [imageUrl]);

  const getPos = useCallback((e) => {
    const rect = wrapRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / imgSize.w)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / imgSize.h))
    };
  }, [imgSize]);

  const handleMouseDown = (e) => {
    if (!addMode || readonly) return;
    e.preventDefault();
    const pos = getPos(e);
    setDrawStart(pos);
    setDrawing(true);
    setLiveRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
  };

  const handleMouseMove = (e) => {
    if (!drawing || !drawStart) return;
    const pos = getPos(e);
    setLiveRect({
      x: Math.min(drawStart.x, pos.x),
      y: Math.min(drawStart.y, pos.y),
      w: Math.abs(pos.x - drawStart.x),
      h: Math.abs(pos.y - drawStart.y)
    });
  };

  const handleMouseUp = (e) => {
    if (!drawing) return;
    const pos = getPos(e);
    const zone = {
      id: Date.now().toString(),
      name: pendingName || 'Target zone',
      x: Math.min(drawStart.x, pos.x),
      y: Math.min(drawStart.y, pos.y),
      w: Math.abs(pos.x - drawStart.x),
      h: Math.abs(pos.y - drawStart.y)
    };
    if (zone.w > 0.02 && zone.h > 0.02) {
      onChange([...zones, zone]);
      setPendingName('');
      setAddMode(false);
    }
    setDrawing(false);
    setDrawStart(null);
    setLiveRect(null);
  };

  const removeZone = (id) => onChange(zones.filter(z => z.id !== id));

  return (
    <div>
      {!readonly && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
          <input
            className="input" style={{ flex: 1 }}
            placeholder="Zone name (e.g. Open Account button)"
            value={pendingName}
            onChange={e => setPendingName(e.target.value)}
          />
          <button
            className={`btn ${addMode ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setAddMode(a => !a)}
          >
            {addMode ? '✏️ Drawing... (drag on image)' : '+ Add zone'}
          </button>
        </div>
      )}

      <div
        ref={wrapRef}
        style={{
          position: 'relative', display: 'inline-block', width: '100%',
          cursor: addMode ? 'crosshair' : 'default',
          borderRadius: 8, overflow: 'hidden',
          border: '1px solid var(--border2)',
          userSelect: 'none'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { if (drawing) { setDrawing(false); setLiveRect(null); } }}
      >
        <img ref={imgRef} src={imageUrl} alt="Screen" style={{ display: 'block', width: '100%', maxHeight: 480, objectFit: 'contain' }} />

        {/* Existing zones */}
        {zones.map(z => (
          <div key={z.id} style={{
            position: 'absolute',
            left: z.x * imgSize.w, top: z.y * imgSize.h,
            width: z.w * imgSize.w, height: z.h * imgSize.h,
            border: '2px solid #6c63ff',
            background: 'rgba(108,99,255,0.12)',
            borderRadius: 4, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start'
          }}>
            <span style={{
              background: '#6c63ff', color: 'white', fontSize: 11, fontWeight: 600,
              padding: '2px 7px', borderRadius: '0 0 4px 0', maxWidth: '100%',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>{z.name}</span>
            {!readonly && (
              <button onClick={() => removeZone(z.id)} style={{
                position: 'absolute', top: -8, right: -8, width: 18, height: 18,
                background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%',
                fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}>×</button>
            )}
          </div>
        ))}

        {/* Live drawing rect */}
        {liveRect && (
          <div style={{
            position: 'absolute',
            left: liveRect.x * imgSize.w, top: liveRect.y * imgSize.h,
            width: liveRect.w * imgSize.w, height: liveRect.h * imgSize.h,
            border: '2px dashed #6c63ff', background: 'rgba(108,99,255,0.08)',
            pointerEvents: 'none', borderRadius: 4
          }} />
        )}
      </div>

      {zones.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {zones.map(z => (
            <span key={z.id} className="badge badge-purple">{z.name}</span>
          ))}
        </div>
      )}
    </div>
  );
}
