import React, { useRef, useEffect, useState } from 'react';

export default function Heatmap({ imageUrl, clicks = [], zones = [] }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [renderedRect, setRenderedRect] = useState(null);

  function getRenderedRect(img) {
    const iw = img.clientWidth;
    const ih = img.clientHeight;
    if (!iw || !ih || !img.naturalWidth) return null;
    const naturalRatio = img.naturalWidth / img.naturalHeight;
    const elementRatio = iw / ih;
    let rw, rh, rx, ry;
    if (naturalRatio > elementRatio) {
      rw = iw; rh = iw / naturalRatio;
      rx = 0; ry = (ih - rh) / 2;
    } else {
      rh = ih; rw = ih * naturalRatio;
      rx = (iw - rw) / 2; ry = 0;
    }
    return { x: rx, y: ry, w: rw, h: rh };
  }

  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const draw = () => {
      const iw = img.clientWidth;
      const ih = img.clientHeight;
      canvas.width = iw;
      canvas.height = ih;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, iw, ih);

      const rect = getRenderedRect(img);
      if (!rect) return;
      setRenderedRect({ ...rect });

      const { x: rx, y: ry, w: rw, h: rh } = rect;

      clicks.forEach(c => {
        const gx = rx + c.x * rw;
        const gy = ry + c.y * rh;
        const r = 28;
        const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
        if (c.hit) {
          grad.addColorStop(0, 'rgba(34,197,94,0.55)');
          grad.addColorStop(1, 'rgba(34,197,94,0)');
        } else {
          grad.addColorStop(0, 'rgba(239,68,68,0.55)');
          grad.addColorStop(1, 'rgba(239,68,68,0)');
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(gx, gy, r, 0, Math.PI * 2);
        ctx.fill();
      });

      clicks.forEach((c, i) => {
        const gx = rx + c.x * rw;
        const gy = ry + c.y * rh;
        ctx.beginPath();
        ctx.arc(gx, gy, 10, 0, Math.PI * 2);
        ctx.fillStyle = c.hit ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)';
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px DM Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i + 1, gx, gy);
      });
    };

    if (img.complete) draw();
    img.onload = draw;
    const ro = new ResizeObserver(draw);
    ro.observe(img);
    return () => ro.disconnect();
  }, [clicks, zones]);

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Screen"
        style={{ display: 'block', width: '100%', maxHeight: 480, objectFit: 'contain' }}
      />
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} />
      {renderedRect && zones.map(z => (
        <div key={z.id} style={{
          position: 'absolute',
          left: renderedRect.x + z.x * renderedRect.w,
          top: renderedRect.y + z.y * renderedRect.h,
          width: z.w * renderedRect.w,
          height: z.h * renderedRect.h,
          border: '2px solid rgba(34,197,94,0.7)',
          background: 'rgba(34,197,94,0.08)',
          borderRadius: 3,
          pointerEvents: 'none'
        }}>
          <span style={{ position: 'absolute', top: -1, left: -1, background: 'rgba(34,197,94,0.85)', color: 'white', fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: '0 0 4px 0' }}>{z.name}</span>
        </div>
      ))}
    </div>
  );
}
