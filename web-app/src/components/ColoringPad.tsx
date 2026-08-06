import { useEffect, useRef, useState } from 'react';

const palette = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#17213b'];

type ColoringPadProps = {
  letter: string;
  illustration?: string;
  illustrationImage?: string;
  onSaved?: (letter: string) => void;
  storageKey?: string;
  canvasLabel?: string;
};

export function ColoringPad({
  letter,
  illustration = '🌈',
  illustrationImage,
  onSaved,
  storageKey,
  canvasLabel
}: ColoringPadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState(palette[0]);
  const [drawing, setDrawing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const bounds = canvas.getBoundingClientRect();
    canvas.width = bounds.width * ratio;
    canvas.height = bounds.height * ratio;
    const context = canvas.getContext('2d');
    context?.scale(ratio, ratio);
    const saved = localStorage.getItem(`slovolov-coloring-${storageKey ?? letter}`);
    if (saved) {
      const image = new Image();
      image.onload = () => context?.drawImage(image, 0, 0, bounds.width, bounds.height);
      image.src = saved;
    }
  }, [letter, storageKey]);

  const drawPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = event.currentTarget;
    const bounds = canvas.getBoundingClientRect();
    const context = canvas.getContext('2d');
    if (!context) return;
    context.globalCompositeOperation = color === 'transparent' ? 'destination-out' : 'source-over';
    context.fillStyle = color === 'transparent' ? '#000000' : color;
    context.beginPath();
    context.arc(event.clientX - bounds.left, event.clientY - bounds.top, color === 'transparent' ? 25 : 13, 0, Math.PI * 2);
    context.fill();
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setMessage('Crtež nije sačuvan. Pokušaj ponovo.');
      return;
    }
    try {
      const image = canvas.toDataURL('image/png');
      localStorage.setItem(`slovolov-coloring-${storageKey ?? letter}`, image);
      setMessage('Crtež je sačuvan! Otvaramo sledeće slovo.');
      onSaved?.(letter);
    } catch {
      setMessage('Crtež nije sačuvan. Proverite prostor na uređaju.');
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    localStorage.removeItem(`slovolov-coloring-${storageKey ?? letter}`);
    setMessage('Platno je obrisano.');
  };

  return (
    <div className="coloring-pad">
      <div className="coloring-picture" aria-hidden="true">
        {illustrationImage ? <img src={illustrationImage} alt="" /> : illustration}
        {letter && <strong>{letter}</strong>}
      </div>
      <canvas
        ref={canvasRef}
        aria-label={canvasLabel ?? `Bojanka za slovo ${letter}`}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setDrawing(true);
          drawPoint(event);
        }}
        onPointerMove={(event) => {
          if (drawing) drawPoint(event);
        }}
        onPointerUp={() => setDrawing(false)}
        onPointerCancel={() => setDrawing(false)}
      />
      <div className="palette" aria-label="Paleta boja">
        {palette.map((item) => <button key={item} aria-label={`Boja ${item}`} className={item === color ? 'active' : ''} style={{ background: item }} onClick={() => setColor(item)} />)}
        <button className={color === 'transparent' ? 'eraser active' : 'eraser'} onClick={() => setColor('transparent')} aria-label="Gumica">⌫</button>
      </div>
      <div className="coloring-actions"><button className="secondary" onClick={clear}>Obriši</button><button className="primary" onClick={save}>Sačuvaj crtež</button></div>
      {message && <p className="coloring-message" role="status">{message}</p>}
    </div>
  );
}
