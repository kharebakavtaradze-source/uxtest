import React, { useRef, useEffect } from 'react';

export default function Heatmap({ imageUrl, clicks = [], zones = [], width, height }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

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

      clicks.forEach(c => {
        const gx = c.x * iw;
        const gy = c.y * ih;
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

      // Draw click numbers
      clicks.forEach((c, i) => {
        const gx = c.x * iw;
        const gy = c.y * ih;
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
      <img ref={imgRef} src={imageUrl} alt="Screen" style={{ display: 'block', width: '100%', maxHeight: 480, objectFit: 'contain' }} />
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} />
      {/* Zone overlays */}
      {zones.map(z => (
        <div key={z.id} style={{
          position: 'absolute',
          left: `${z.x * 100}%`, top: `${z.y * 100}%`,
          width: `${z.w * 100}%`, height: `${z.h * 100}%`,
          border: '2px solid rgba(34,197,94,0.7)',
          background: 'rgba(34,197,94,0.08)',
          borderRadius: 3, pointerEvents: 'none'
        }}>
          <span style={{ position: 'absolute', top: -1, left: -1, background: 'rgba(34,197,94,0.85)', color: 'white', fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: '0 0 4px 0' }}>{z.name}</span>
        </div>
      ))}
    </div>
  );
}
