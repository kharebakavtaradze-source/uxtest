import React, { useRef, useState, useEffect, useCallback } from 'react';

export default function ZoneEditor({ imageUrl, zones, onChange, readonly = false }) {
  const wrapRef = useRef(null);
  const imgRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [liveRect, setLiveRect] = useState(null);
  const [pendingName, setPendingName] = useState('');
  const [addMode, setAddMode] = useState(false);
  const [imgRect, setImgRect] = useState({ x: 0, y: 0, w: 0, h: 0 });

  function computeImgRect(img) {
    const iw = img.clientWidth, ih = img.clientHeight;
    if (!iw || !ih || !img.naturalWidth) return { x: 0, y: 0, w: iw, h: ih };
    const nRatio = img.naturalWidth / img.naturalHeight;
    const eRatio = iw / ih;
    let rw, rh, rx, ry;
    if (nRatio > eRatio) {
      rw = iw; rh = iw / nRatio; rx = 0; ry = (ih - rh) / 2;
    } else {
      rh = ih; rw = ih * nRatio; rx = (iw - rw) / 2; ry = 0;
    }
    return { x: rx, y: ry, w: rw, h: rh };
  }

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const update = () => setImgRect(computeImgRect(img));
    img.addEventListener('load', update);
    if (img.complete) update();
    const ro = new ResizeObserver(update);
    ro.observe(img);
    return () => { img.removeEventListener('load', update); ro.disconnect(); };
  }, [imageUrl]);

  const getEventPos = useCallback((clientX, clientY) => {
    const rect = wrapRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (clientX - rect.left - imgRect.x) / imgRect.w)),
      y: Math.max(0, Math.min(1, (clientY - rect.top - imgRect.y) / imgRect.h))
    };
  }, [imgRect]);

  const startDraw = (clientX, clientY) => {
    if (!addMode || readonly) return;
    const pos = getEventPos(clientX, clientY);
    setDrawStart(pos);
    setDrawing(true);
    setLiveRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
  };

  const moveDraw = (clientX, clientY) => {
    if (!drawing || !drawStart) return;
    const pos = getEventPos(clientX, clientY);
    setLiveRect({
      x: Math.min(drawStart.x, pos.x),
      y: Math.min(drawStart.y, pos.y),
      w: Math.abs(pos.x - drawStart.x),
      h: Math.abs(pos.y - drawStart.y)
    });
  };

  const endDraw = (clientX, clientY) => {
    if (!drawing) return;
    const pos = getEventPos(clientX, clientY);
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

  // Mouse handlers
  const handleMouseDown = (e) => { e.preventDefault(); startDraw(e.clientX, e.clientY); };
  const handleMouseMove = (e) => { moveDraw(e.clientX, e.clientY); };
  const handleMouseUp = (e) => { endDraw(e.clientX, e.clientY); };

  // Touch handlers
  const handleTouchStart = (e) => {
    if (!addMode || readonly) return;
    e.preventDefault();
    startDraw(e.touches[0].clientX, e.touches[0].clientY);
  };
  const handleTouchMove = (e) => {
    if (!drawing) return;
    e.preventDefault();
    moveDraw(e.touches[0].clientX, e.touches[0].clientY);
  };
  const handleTouchEnd = (e) => {
    if (!drawing) return;
    e.preventDefault();
    endDraw(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
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
          userSelect: 'none', touchAction: addMode ? 'none' : 'auto'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { if (drawing) { setDrawing(false); setLiveRect(null); } }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img ref={imgRef} src={imageUrl} alt="Screen" style={{ display: 'block', width: '100%', maxHeight: 480, objectFit: 'contain' }} />

        {/* Existing zones */}
        {zones.map(z => (
          <div key={z.id} style={{
            position: 'absolute',
            left: imgRect.x + z.x * imgRect.w,
            top: imgRect.y + z.y * imgRect.h,
            width: z.w * imgRect.w,
            height: z.h * imgRect.h,
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
            left: imgRect.x + liveRect.x * imgRect.w,
            top: imgRect.y + liveRect.y * imgRect.h,
            width: liveRect.w * imgRect.w,
            height: liveRect.h * imgRect.h,
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
