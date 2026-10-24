import { useEffect, useRef, useState } from 'react';

export type TracePoint = { x: number; y: number };

const penColors = [
  { name: 'Ljubičasta', value: '#4f46e5' },
  { name: 'Crvena', value: '#ef4444' },
  { name: 'Narandžasta', value: '#f97316' },
  { name: 'Žuta', value: '#eab308' },
  { name: 'Zelena', value: '#22c55e' },
  { name: 'Plava', value: '#3b82f6' },
  { name: 'Roze', value: '#ec4899' },
  { name: 'Tamna', value: '#17213b' }
];
const penWidths = [
  { label: 'Tanka', value: 10 },
  { label: 'Srednja', value: 18 },
  { label: 'Debela', value: 28 }
];

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

function measureGuideHitRatio(letter: string, points: TracePoint[], width: number, height: number, guideElement?: HTMLElement | null) {
  if (!points.length || width <= 0 || height <= 0) return 0;
  try {
    const mask = document.createElement('canvas');
    mask.width = Math.max(1, Math.round(width));
    mask.height = Math.max(1, Math.round(height));
    const context = mask.getContext('2d', { willReadFrequently: true });
    if (!context) return 1;
    const fontSize = Math.min(width * 0.64, height * 0.74);
    const guideStyle = guideElement ? window.getComputedStyle(guideElement) : null;
    const renderedFontSize = guideStyle && Number.parseFloat(guideStyle.fontSize) > 0
      ? Number.parseFloat(guideStyle.fontSize)
      : fontSize;
    const fontWeight = guideStyle?.fontWeight || '900';
    const fontFamily = guideStyle?.fontFamily || '"Segoe UI Rounded", "Arial Rounded MT Bold", sans-serif';
    context.font = `${fontWeight} ${renderedFontSize}px ${fontFamily}`;
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
  script = 'cyrillic',
  letterCase = 'upper',
  onComplete,
  onAttempt,
  difficulty = 'standard'
}: {
  letter: string;
  script?: 'cyrillic' | 'latin';
  letterCase?: 'upper' | 'lower';
  onComplete: () => void;
  onAttempt?: (success: boolean) => void;
  difficulty?: 'easy' | 'standard' | 'challenge';
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<TracePoint[]>([]);
  const strokeGroupsRef = useRef<TracePoint[][]>([]);
  const [drawing, setDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#4f46e5');
  const [penWidth, setPenWidth] = useState(18);
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
    strokeGroupsRef.current = [];
  }, [letter]);

  const position = (event: React.PointerEvent<HTMLCanvasElement>): TracePoint => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  };

  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const point = position(event);
    pointsRef.current = [...pointsRef.current, point];
    strokeGroupsRef.current = [...strokeGroupsRef.current, [point]];
    const context = event.currentTarget.getContext('2d');
    if (context) {
      context.strokeStyle = penColor;
      context.lineWidth = penWidth;
    }
    context?.beginPath();
    context?.moveTo(point.x, point.y);
    setDrawing(true);
  };

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    event.preventDefault();
    const next = position(event);
    const previous = strokeGroupsRef.current.at(-1)?.at(-1);
    const context = event.currentTarget.getContext('2d');
    if (context && previous) {
      context.moveTo(previous.x, previous.y);
      context.lineTo(next.x, next.y);
      context.stroke();
    }
    pointsRef.current = [...pointsRef.current, next];
    strokeGroupsRef.current.at(-1)?.push(next);
  };

  const stop = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    setDrawing(false);
    const bounds = event.currentTarget.getBoundingClientRect();
    const currentPoints = pointsRef.current;
    const guideElement = event.currentTarget.parentElement?.querySelector<HTMLElement>('.guide-letter');
    const guideHitRatio = measureGuideHitRatio(letter, currentPoints, bounds.width, bounds.height, guideElement);
    const adjustedGuideHit = guideHitRatio / ({ easy: 0.82, standard: 1, challenge: 1.14 }[difficulty]);
    const result = evaluateTrace(currentPoints, bounds.width, bounds.height, adjustedGuideHit);
    onAttempt?.(result.success);
    if (result.success) onComplete();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const bounds = canvas.getBoundingClientRect();
      canvas.getContext('2d')?.clearRect(0, 0, bounds.width, bounds.height);
    }
    pointsRef.current = [];
    strokeGroupsRef.current = [];
  };

  return (
    <div className="trace-wrap">
      <div className={`guide-letter ${letterCase === 'lower' ? 'guide-letter-lowercase' : ''}`} data-testid="guide-letter" aria-hidden="true">{letter}</div>
      <div className="guide-line guide-line-top" />
      <div className="guide-line guide-line-base" />
      <div className="trace-toolbar" aria-label="Podešavanja olovke">
        <div className="trace-tool-row" role="group" aria-label="Boja olovke">
          <span>Boja</span>
          <div className="palette">
            {penColors.map((color) => <button
              key={color.value}
              type="button"
              aria-label={`Boja ${color.name}`}
              aria-pressed={penColor === color.value}
              className={penColor === color.value ? 'active' : ''}
              style={{ background: color.value }}
              onClick={() => setPenColor(color.value)}
            />)}
          </div>
        </div>
        <div className="trace-tool-row" role="group" aria-label="Debljina olovke">
          <span>Debljina</span>
          <div className="brush-sizes">
            {penWidths.map((width) => <button
              key={width.value}
              type="button"
              aria-pressed={penWidth === width.value}
              onClick={() => setPenWidth(width.value)}
            ><i style={{ width: Math.max(5, width.value / 2), height: Math.max(5, width.value / 2) }} />{width.label}</button>)}
          </div>
        </div>
      </div>
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
