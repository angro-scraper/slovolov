import { useEffect, useRef, useState } from 'react';

export function VoicePractice({
  enabled,
  phrase,
  onRecorded
}: {
  enabled: boolean;
  phrase: string;
  onRecorded?: () => void;
}) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [message, setMessage] = useState(
    enabled
      ? `Sovica sluša. Izgovori: ${phrase}. Snimak ostaje samo na ovom uređaju.`
      : 'Roditelj može da uključi lokalnu vežbu glasa u podešavanjima.'
  );

  useEffect(() => () => {
    recorderRef.current?.state === 'recording' && recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  if (!enabled) {
    return <aside className="voice-practice locked"><span>🎙️</span><p>{message}</p></aside>;
  }

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setMessage('Ovaj uređaj ne podržava lokalno snimanje glasa.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setMessage('Snimak je spreman samo na ovom uređaju. Poslušaj i uporedi.');
        onRecorded?.();
      };
      streamRef.current = stream;
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setMessage(`Snimamo… Izgovori: ${phrase}`);
    } catch {
      setMessage('Mikrofon nije dostupan. Roditelj može proveriti dozvolu uređaja.');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    setRecording(false);
  };

  return (
    <aside className="voice-practice">
      <div><span>🎙️</span><p role="status">{message}</p></div>
      <small>Sovica te ohrabruje, ali ne ocenjuje da li je izgovor savršen.</small>
      {recording
        ? <button className="secondary" onClick={stopRecording}>Zaustavi snimanje</button>
        : <button className="secondary" onClick={() => void startRecording()}>Snimi moj glas</button>}
      {audioUrl && <audio aria-label="Preslušaj svoj izgovor" controls src={audioUrl} />}
    </aside>
  );
}
