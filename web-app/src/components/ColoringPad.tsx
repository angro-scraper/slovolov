import { useEffect, useRef, useState } from 'react';

const palette = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#17213b'];

type ColoringPadProps = {
  letter: string;
  objectName?: string;
  requireDrawing?: boolean;
  illustration?: string;
  illustrationImage?: string;
  onSaved?: (letter: string) => void;
  storageKey?: string;
  canvasLabel?: string;
};

export function ColoringPad({
  letter,
  objectName,
  requireDrawing = false,
  illustration = '🌈',
  illustrationImage,
  onSaved,
  storageKey,
  canvasLabel
}: ColoringPadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState(palette[0]);
  const [brushSize, setBrushSize] = useState(12);
  const [drawing, setDrawing] = useState(false);
  const [message, setMessage] = useState('');
  const [hasDrawing, setHasDrawing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const historyRef = useRef<ImageData[]>([]);
  const previousPointRef = useRef<{ x: number; y: number } | null>(null);

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
      image.onload = () => {
        context?.drawImage(image, 0, 0, bounds.width, bounds.height);
        setHasDrawing(true);
      };
      image.src = saved;
    }
    historyRef.current = [];
    setHasDrawing(false);
    setConfirmClear(false);
  }, [letter, storageKey]);

  const drawSegment = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = event.currentTarget;
    const bounds = canvas.getBoundingClientRect();
    const context = canvas.getContext('2d');
    if (!context) return;
    context.globalCompositeOperation = color === 'transparent' ? 'destination-out' : 'source-over';
    const point = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    const previous = previousPointRef.current ?? point;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = color === 'transparent' ? '#000000' : color;
    context.lineWidth = color === 'transparent' ? Math.max(brushSize * 2, 28) : brushSize;
    context.beginPath();
    context.moveTo(previous.x, previous.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    previousPointRef.current = point;
  };

  const startStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const context = canvas.getContext('2d');
    if (!context) return;
    try {
      historyRef.current = [...historyRef.current.slice(-19), context.getImageData(0, 0, canvas.width, canvas.height)];
    } catch {
      // Browsers may deny canvas reads in unusual embedded contexts; drawing still works.
    }
    canvas.setPointerCapture?.(event.pointerId);
    setDrawing(true);
    setHasDrawing(true);
    previousPointRef.current = null;
    drawSegment(event);
  };

  const undo = () => {
    const canvas = canvasRef.current;
    const snapshot = historyRef.current.pop();
    if (!canvas || !snapshot) {
      setMessage('Još nema poteza za vraćanje.');
      return;
    }
    canvas.getContext('2d')?.putImageData(snapshot, 0, 0);
    setHasDrawing(historyRef.current.length > 0);
    setMessage('Poslednji potez je vraćen.');
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setMessage('Crtež nije sačuvan. Pokušaj ponovo.');
      return;
    }
    if (requireDrawing && !hasDrawing) {
      setMessage('Prvo oboji deo slike, pa onda sačuvaj crtež.');
      return;
    }
    try {
      const image = canvas.toDataURL('image/png');
      localStorage.setItem(`slovolov-coloring-${storageKey ?? letter}`, image);
      setMessage(objectName ? `Bravo! Obojao si ${objectName.toLocaleLowerCase('sr-RS')}. Reč: ${objectName}.` : 'Crtež je sačuvan!');
      onSaved?.(letter);
    } catch {
      setMessage('Crtež nije sačuvan. Proverite prostor na uređaju.');
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const bounds = canvas.getBoundingClientRect();
      canvas.getContext('2d')?.clearRect(0, 0, bounds.width, bounds.height);
    }
    localStorage.removeItem(`slovolov-coloring-${storageKey ?? letter}`);
    historyRef.current = [];
    setHasDrawing(false);
    setConfirmClear(false);
    setMessage('Platno je obrisano.');
  };

  return (
    <div className="coloring-pad">
      <div className="coloring-picture" aria-hidden="true">
        {illustrationImage ? <img src={illustrationImage} alt="" /> : illustration}
        {objectName && <strong className="coloring-object-name">{objectName}</strong>}
        {letter && <strong>{letter}</strong>}
      </div>
      <canvas
        ref={canvasRef}
        aria-label={canvasLabel ?? (objectName ? `Bojanka za ${objectName}` : letter ? `Bojanka za slovo ${letter}` : 'Platno za crtanje')}
        onPointerDown={startStroke}
        onPointerMove={(event) => {
          if (drawing) drawSegment(event);
        }}
        onPointerUp={() => { setDrawing(false); previousPointRef.current = null; }}
        onPointerCancel={() => { setDrawing(false); previousPointRef.current = null; }}
      />
      <div className="coloring-tools">
        <div className="palette" aria-label="Paleta boja">
        {palette.map((item) => <button key={item} aria-label={`Boja ${item}`} className={item === color ? 'active' : ''} style={{ background: item }} onClick={() => setColor(item)} />)}
        <button className={color === 'transparent' ? 'eraser active' : 'eraser'} onClick={() => setColor('transparent')} aria-label="Gumica">⌫</button>
        </div>
        <div className="brush-sizes" role="group" aria-label="Debljina četkice">
          {[6, 12, 20].map((size) => <button key={size} aria-pressed={brushSize === size} onClick={() => setBrushSize(size)}><i style={{ width: size, height: size }} />{size === 6 ? 'Tanka' : size === 12 ? 'Srednja' : 'Debela'}</button>)}
        </div>
      </div>
      <div className="coloring-actions"><button className="secondary" onClick={undo}>Vrati potez</button><button className="secondary" onClick={() => setConfirmClear(true)}>Obriši</button><button className="primary" onClick={save}>{objectName ? 'Gotovo, obojio sam!' : 'Sačuvaj crtež'}</button></div>
      {confirmClear && <div className="coloring-clear-confirm" role="group" aria-label="Potvrda brisanja"><span>Obrisati ceo crtež?</span><button className="secondary" onClick={() => setConfirmClear(false)}>Odustani</button><button className="danger" onClick={clear}>Obriši sve</button></div>}
      {message && <p className="coloring-message" role="status">{message}</p>}
    </div>
  );
}
