import { useEffect, useRef, useState } from 'react';

type Point = { x: number; y: number };

export function TracePad({ letter, onComplete }: { letter: string; onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);

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
  }, [letter]);

  const position = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  };

  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = position(event);
    setPoints([point]);
    setDrawing(true);
  };

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    event.preventDefault();
    const next = position(event);
    const previous = points.at(-1);
    const context = event.currentTarget.getContext('2d');
    if (context && previous) {
      context.beginPath();
      context.moveTo(previous.x, previous.y);
      context.lineTo(next.x, next.y);
      context.stroke();
    }
    setPoints((current) => [...current, next]);
  };

  const stop = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    setDrawing(false);
    if (points.length > 18) onComplete();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    setPoints([]);
  };

  return (
    <div className="trace-wrap">
      <div className="guide-letter" aria-hidden="true">{letter}</div>
      <div className="guide-line guide-line-top" />
      <div className="guide-line guide-line-base" />
      <span className="start-dot" aria-hidden="true">1</span>
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
