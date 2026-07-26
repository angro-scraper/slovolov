import { useEffect, useRef, useState } from 'react';

export type TracePoint = { x: number; y: number };

export function evaluateTrace(points: TracePoint[], width: number, height: number, guideHitRatio = 1) {
  if (points.length < 24 || width <= 0 || height <= 0) {
    return { success: false, coverageX: 0, coverageY: 0, pathRatio: 0, guideHitRatio };
  }
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const coverageX = (Math.max(...xs) - Math.min(...xs)) / width;
  const coverageY = (Math.max(...ys) - Math.min(...ys)) / height;
  const pathLength = points.slice(1).reduce((total, point, index) => {
    const previous = points[index];
    return total + Math.hypot(point.x - previous.x, point.y - previous.y);
  }, 0);
  const pathRatio = pathLength / Math.min(width, height);
  return {
    success: coverageX >= 0.14 && coverageY >= 0.28 && pathRatio >= 0.55 && guideHitRatio >= 0.56,
    coverageX,
    coverageY,
    pathRatio,
    guideHitRatio
  };
}

function measureGuideHitRatio(letter: string, points: TracePoint[], width: number, height: number) {
  if (!points.length || width <= 0 || height <= 0) return 0;
  try {
    const mask = document.createElement('canvas');
    mask.width = Math.max(1, Math.round(width));
    mask.height = Math.max(1, Math.round(height));
    const context = mask.getContext('2d', { willReadFrequently: true });
    if (!context) return 1;
    const fontSize = Math.min(width * 0.64, height * 0.74);
    context.font = `900 ${fontSize}px "Segoe UI Rounded", "Arial Rounded MT Bold", sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#000';
    context.fillText(letter, width / 2, height / 2);
    const pixels = context.getImageData(0, 0, mask.width, mask.height).data;
    const radius = Math.max(8, Math.round(Math.min(width, height) * 0.035));
    const sampled = points.filter((_, index) => index % 2 === 0);
    const hits = sampled.filter((point) => {
      const centerX = Math.round(point.x);
      const centerY = Math.round(point.y);
      for (let y = centerY - radius; y <= centerY + radius; y += 3) {
        for (let x = centerX - radius; x <= centerX + radius; x += 3) {
          if (x < 0 || y < 0 || x >= mask.width || y >= mask.height) continue;
          if (pixels[(y * mask.width + x) * 4 + 3] > 0) return true;
        }
      }
      return false;
    }).length;
    return sampled.length ? hits / sampled.length : 0;
  } catch {
    return 1;
  }
}

export function TracePad({
  letter,
  onComplete,
  onAttempt,
  difficulty = 'standard'
}: {
  letter: string;
  onComplete: () => void;
  onAttempt?: (success: boolean) => void;
  difficulty?: 'easy' | 'standard' | 'challenge';
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<TracePoint[]>([]);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const bounds = canvas.getBoundingClientRect();
    canvas.width = bounds.width * ratio;
    canvas.height = bounds.height * ratio;
    const context = canvas.getContext('2d');
    context?.scale(ratio, ratio);
    if (context) {
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = '#4f46e5';
      context.lineWidth = 18;
    }
    pointsRef.current = [];
  }, [letter]);

  const position = (event: React.PointerEvent<HTMLCanvasElement>): TracePoint => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  };

  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = position(event);
    pointsRef.current = [...pointsRef.current, point];
    setDrawing(true);
  };

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    event.preventDefault();
    const next = position(event);
    const previous = pointsRef.current.at(-1);
    const context = event.currentTarget.getContext('2d');
    if (context && previous) {
      context.beginPath();
      context.moveTo(previous.x, previous.y);
      context.lineTo(next.x, next.y);
      context.stroke();
    }
    pointsRef.current = [...pointsRef.current, next];
  };

  const stop = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    setDrawing(false);
    const bounds = event.currentTarget.getBoundingClientRect();
    const currentPoints = pointsRef.current;
    const guideHitRatio = measureGuideHitRatio(letter, currentPoints, bounds.width, bounds.height);
    const adjustedGuideHit = guideHitRatio / ({ easy: 0.82, standard: 1, challenge: 1.14 }[difficulty]);
    const result = evaluateTrace(currentPoints, bounds.width, bounds.height, adjustedGuideHit);
    onAttempt?.(result.success);
    if (result.success) onComplete();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    pointsRef.current = [];
  };

  return (
    <div className="trace-wrap">
      <div className="guide-letter" data-testid="guide-letter" aria-hidden="true">{letter}</div>
      <div className="guide-line guide-line-top" />
      <div className="guide-line guide-line-base" />
      <canvas
        ref={canvasRef}
        aria-label={`Platno za pisanje slova ${letter}`}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={stop}
        onPointerCancel={stop}
      />
      <button className="small-button clear-button" onClick={clear}>Obriši</button>
    </div>
  );
}
