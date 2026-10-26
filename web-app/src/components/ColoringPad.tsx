import { useEffect, useRef, useState } from 'react';
import { fillColorRegion } from '../domain/coloring';

const palette = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#17213b'];

function drawColoringTemplate(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  index: number,
  bounds: DOMRect,
  columns: number,
  rows: number,
  cropInsetLeft: number,
  cropInsetRight: number
) {
  const ratio = window.devicePixelRatio || 1;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, bounds.width, bounds.height);
  const column = index % columns;
  const row = Math.floor(index / columns);
  const cellLeft = Math.round((column * image.naturalWidth) / columns);
  const cellRight = Math.round(((column + 1) * image.naturalWidth) / columns);
  const sourceLeft = cellLeft + Math.round((cellRight - cellLeft) * cropInsetLeft);
  const sourceRight = cellRight - Math.round((cellRight - cellLeft) * cropInsetRight);
  const cellTop = Math.round((row * image.naturalHeight) / rows);
  const cellBottom = Math.round(((row + 1) * image.naturalHeight) / rows);
  const sourceTop = cellTop + Math.round((cellBottom - cellTop) * 0.025);
  const sourceBottom = cellBottom - Math.round((cellBottom - cellTop) * 0.025);
  const sourceWidth = sourceRight - sourceLeft;
  const sourceHeight = sourceBottom - sourceTop;
  const scale = Math.min((bounds.width * 0.78) / sourceWidth, (bounds.height * 0.62) / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  const targetX = (bounds.width - width) / 2;
  const targetY = bounds.height * 0.04 + (bounds.height * 0.66 - height) / 2;
  context.imageSmoothingEnabled = true;
  if (columns === 1 && rows === 1) {
    context.drawImage(image, targetX, targetY, width, height);
  } else {
    context.drawImage(image, sourceLeft, sourceTop, sourceWidth, sourceHeight, targetX, targetY, width, height);
  }
}

type ColoringPadProps = {
  letter: string;
  objectName?: string;
  requireDrawing?: boolean;
  illustration?: string;
  illustrationImage?: string;
  templateIndex?: number;
  templateColumns?: number;
  templateRows?: number;
  templateCropInsetLeft?: number;
  templateCropInsetRight?: number;
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
  templateIndex,
  templateColumns = 3,
  templateRows = 2,
  templateCropInsetLeft = 0.025,
  templateCropInsetRight = 0.025,
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
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const initialize = (template?: HTMLImageElement) => {
      const bounds = canvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(bounds.width * ratio);
      canvas.height = Math.round(bounds.height * ratio);
      const context = canvas.getContext('2d');
      if (!context) return;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (templateIndex !== undefined && template) drawColoringTemplate(context, template, templateIndex, bounds, templateColumns, templateRows, templateCropInsetLeft, templateCropInsetRight);
      const saved = localStorage.getItem(`slovolov-coloring-${storageKey ?? letter}`);
      if (!saved) return;
      const savedImage = new Image();
      savedImage.onload = () => {
        context.drawImage(savedImage, 0, 0, bounds.width, bounds.height);
        setHasDrawing(true);
      };
      savedImage.src = saved;
    };

    if (templateIndex !== undefined && illustrationImage) {
      const template = new Image();
      template.onload = () => initialize(template);
      template.onerror = () => {
        initialize();
        setMessage('Slika za bojenje nije učitana. Proveri vezu pa pokušaj ponovo.');
      };
      template.src = illustrationImage;
    } else {
      initialize();
    }
    historyRef.current = [];
    setHasDrawing(false);
    setConfirmClear(false);
  }, [illustrationImage, letter, storageKey, templateColumns, templateCropInsetLeft, templateCropInsetRight, templateIndex, templateRows]);

  const drawSegment = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    const bounds = canvas?.getBoundingClientRect();
    if (!canvas || !bounds) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.globalCompositeOperation = color === 'transparent' ? 'destination-out' : 'source-over';
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = color === 'transparent' ? '#000000' : color;
    context.lineWidth = color === 'transparent' ? Math.max(brushSize * 2, 28) : brushSize;
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
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
    movedRef.current = false;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    previousPointRef.current = { x: event.clientX - canvas.getBoundingClientRect().left, y: event.clientY - canvas.getBoundingClientRect().top };
  };

  const finishPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const bounds = canvas.getBoundingClientRect();
    const start = pointerStartRef.current;
    if (!start) return;
    const end = { x: event.clientX, y: event.clientY };
    const pixelRatioX = canvas.width / Math.max(bounds.width, 1);
    const pixelRatioY = canvas.height / Math.max(bounds.height, 1);

    if (movedRef.current) {
      setHasDrawing(true);
    } else if (templateIndex !== undefined) {
      const context = canvas.getContext('2d');
      let filled = false;
      try {
        const pixels = context?.getImageData(0, 0, canvas.width, canvas.height);
        if (pixels) {
          filled = fillColorRegion(pixels, (end.x - bounds.left) * pixelRatioX, (end.y - bounds.top) * pixelRatioY, color);
          if (filled) context?.putImageData(pixels, 0, 0);
        }
      } catch {
        setMessage('Ovaj deo slike ne može da se popuni. Prevuci prstom da obojiš.');
      }
      if (filled) {
        setHasDrawing(true);
        setMessage('Lepo bojiš! Dodirni još neki deo ili pritisni „Gotovo“.');
      } else if (historyRef.current.length) {
        historyRef.current.pop();
        setMessage('Dodirni zatvoren deo crteža da ga popuniš ili prevuci prstom da bojiš.');
      }
    } else {
      const point = { x: end.x - bounds.left, y: end.y - bounds.top };
      drawSegment(point, point);
      setHasDrawing(true);
    }

    setDrawing(false);
    pointerStartRef.current = null;
    previousPointRef.current = null;
  };

  const cancelPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const snapshot = historyRef.current.pop();
    if (snapshot) event.currentTarget.getContext('2d')?.putImageData(snapshot, 0, 0);
    setDrawing(false);
    pointerStartRef.current = null;
    previousPointRef.current = null;
    movedRef.current = false;
  };

  const movePointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    event.preventDefault();
    const start = pointerStartRef.current;
    const previous = previousPointRef.current;
    if (!start || !previous) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const point = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    if (!movedRef.current && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 3) return;
    movedRef.current = true;
    drawSegment(previous, point);
    previousPointRef.current = point;
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
      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        if (templateIndex !== undefined && illustrationImage) {
          const template = new Image();
          template.onload = () => {
            drawColoringTemplate(context, template, templateIndex, bounds, templateColumns, templateRows, templateCropInsetLeft, templateCropInsetRight);
          };
          template.src = illustrationImage;
        }
      }
    }
    localStorage.removeItem(`slovolov-coloring-${storageKey ?? letter}`);
    historyRef.current = [];
    setHasDrawing(false);
    setConfirmClear(false);
    setMessage('Platno je obrisano.');
  };

  return (
    <div className="coloring-pad">
      <div className={`coloring-picture${templateIndex !== undefined ? ' coloring-picture-template' : ''}`} aria-hidden="true">
        {templateIndex === undefined && (illustrationImage ? <img src={illustrationImage} alt="" /> : illustration)}
        {objectName && <strong className="coloring-object-name">{objectName}</strong>}
        {letter && <strong>{letter}</strong>}
      </div>
      <canvas
        ref={canvasRef}
        aria-label={canvasLabel ?? (objectName ? `Bojanka za ${objectName}` : letter ? `Bojanka za slovo ${letter}` : 'Platno za crtanje')}
        onPointerDown={startStroke}
        onPointerMove={movePointer}
        onPointerUp={finishPointer}
        onPointerCancel={cancelPointer}
        onClick={() => {}}
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
