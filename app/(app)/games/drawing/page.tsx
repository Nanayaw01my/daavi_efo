'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { RotateCcw, Eraser, Trash2 } from 'lucide-react';

interface DrawingEntry {
  username: string;
  displayName: string;
  imageData: string;
  submittedAt: string;
  score: number | null;
  feedback: string;
}

interface Round {
  _id: string;
  prompt: string;
  startedAt: string;
  durationSeconds: number;
  status: 'active' | 'scoring' | 'done';
  drawings: DrawingEntry[];
}

const COLORS = ['#1a1a1a', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7'];
const SIZES = [3, 6, 12];

export default function DrawingPage() {
  const { data: session } = useSession();
  const username = (session?.user as any)?.username as string;
  const displayName = session?.user?.name ?? '';

  const [round, setRound] = useState<Round | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [color, setColor] = useState('#1a1a1a');
  const [size, setSize] = useState(6);
  const [erasing, setErasing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const history = useRef<ImageData[]>([]);
  const autoSubmitted = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const myDrawing = round?.drawings.find(d => d.username === username);
  const partnerDrawing = round?.drawings.find(d => d.username !== username);
  const partnerName = partnerDrawing?.displayName ?? (username === 'efo' ? 'Daavi' : 'Efo');

  // Fetch current round
  const fetchRound = useCallback(async () => {
    const res = await fetch('/api/games/drawing').catch(() => null);
    if (!res?.ok) return;
    const data: Round | null = await res.json();
    setRound(data);
    if (data) {
      const elapsed = (Date.now() - new Date(data.startedAt).getTime()) / 1000;
      setTimeLeft(Math.max(0, Math.ceil(data.durationSeconds - elapsed)));
      if (data.drawings.some(d => d.username === username)) setSubmitted(true);
    }
  }, [username]);

  useEffect(() => { fetchRound(); }, [fetchRound]);

  // Poll when round is active or scoring
  useEffect(() => {
    if (round?.status === 'active' || round?.status === 'scoring') {
      pollRef.current = setInterval(fetchRound, 3000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [round?.status, fetchRound]);

  // Timer countdown
  useEffect(() => {
    if (!round || round.status !== 'active' || submitted) return;
    if (timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [round?.status, round?._id, submitted]);

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && round?.status === 'active' && !submitted && !autoSubmitted.current && username) {
      autoSubmitted.current = true;
      submitDrawing();
    }
  }, [timeLeft, round?.status, submitted, username]);

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [round?._id]);

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (submitted || timeLeft === 0) return;
    e.preventDefault();
    drawing.current = true;
    const pos = getPos(e);
    lastPos.current = pos;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    // Save state for undo
    history.current = history.current.slice(-19);
    history.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));

    // Draw a dot at start
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, (erasing ? size * 3 : size) / 2, 0, Math.PI * 2);
    ctx.fillStyle = erasing ? '#ffffff' : color;
    ctx.fill();
  }

  function doDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || submitted || timeLeft === 0) return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e);

    ctx.beginPath();
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = erasing ? '#ffffff' : color;
    ctx.lineWidth = erasing ? size * 3 : size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
  }

  function endDraw() { drawing.current = false; lastPos.current = null; }

  function undo() {
    if (!history.current.length) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(history.current.pop()!, 0, 0);
  }

  function clearCanvas() {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    history.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  async function submitDrawing() {
    const canvas = canvasRef.current;
    if (!canvas || !round || submitting) return;
    setSubmitting(true);
    try {
      const imageData = canvas.toDataURL('image/png');
      const res = await fetch('/api/games/drawing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', roundId: round._id, imageData }),
      });
      if (!res.ok) throw new Error('Submit failed');
      const updated: Round = await res.json();
      setRound(updated);
      setSubmitted(true);
    } catch {
      toast.error('Failed to submit drawing');
    } finally {
      setSubmitting(false);
    }
  }

  async function startRound() {
    setStarting(true);
    autoSubmitted.current = false;
    try {
      const res = await fetch('/api/games/drawing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
      const data: Round = await res.json();
      setRound(data);
      setSubmitted(false);
      setTimeLeft(data.durationSeconds);
      // Reset canvas
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        history.current = [];
      }, 50);
    } catch {
      toast.error('Failed to start round');
    } finally {
      setStarting(false);
    }
  }

  async function newRound() {
    autoSubmitted.current = false;
    setStarting(true);
    try {
      const res = await fetch('/api/games/drawing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'new' }),
      });
      const data: Round = await res.json();
      setRound(data);
      setSubmitted(false);
      setTimeLeft(data.durationSeconds);
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        history.current = [];
      }, 50);
    } catch {
      toast.error('Failed to start new round');
    } finally {
      setStarting(false);
    }
  }

  const timerColor = timeLeft > 30 ? 'text-emerald-600' : timeLeft > 10 ? 'text-amber-500' : 'text-red-500';
  const timerPct = round ? (timeLeft / round.durationSeconds) * 100 : 100;

  // ── Results screen ──────────────────────────────────────────────────
  if (round?.status === 'done') {
    const myResult = round.drawings.find(d => d.username === username);
    const partnerResult = round.drawings.find(d => d.username !== username);
    const winner = myResult && partnerResult
      ? (myResult.score ?? 0) > (partnerResult.score ?? 0) ? 'you'
        : (partnerResult.score ?? 0) > (myResult.score ?? 0) ? 'partner'
        : 'tie'
      : null;

    return (
      <div className="px-4 py-5 max-w-lg mx-auto pb-20">
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">🎨</div>
          <h1 className="font-playfair text-2xl font-bold text-gray-900">Drawing Results</h1>
          <p className="text-gray-500 text-sm mt-1 px-4">&ldquo;{round.prompt}&rdquo;</p>
        </div>

        {winner && (
          <div className={`rounded-2xl p-4 text-center mb-5 ${winner === 'tie' ? 'bg-purple-50 border border-purple-100' : 'bg-rose-50 border border-rose-100'}`}>
            <div className="text-3xl mb-1">{winner === 'tie' ? '🤝' : '🏆'}</div>
            <p className="font-bold text-gray-800">
              {winner === 'tie' ? "It's a tie! You're both artists! 🎨"
                : winner === 'you' ? `You win this round, ${displayName}! 🎉`
                : `${partnerResult?.displayName} wins this round! 🎉`}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {[myResult, partnerResult].filter(Boolean).map((r, i) => r && (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                <span className="font-bold text-gray-800">{r.username === username ? `${r.displayName} (you)` : r.displayName}</span>
                {r.score !== null && (
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 10 }, (_, j) => (
                        <span key={j} className={`text-base ${j < (r.score ?? 0) ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                      ))}
                    </div>
                    <span className="font-black text-gray-700 text-lg">{r.score}/10</span>
                  </div>
                )}
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.imageData} alt="drawing" className="w-full border-b border-gray-100" style={{ imageRendering: 'pixelated' }} />
              {r.feedback && (
                <div className="px-4 py-3">
                  <p className="text-sm text-gray-600 italic">&ldquo;{r.feedback}&rdquo;</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={newRound}
          disabled={starting}
          className="w-full mt-6 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <RotateCcw size={18} /> Play Again
        </button>
      </div>
    );
  }

  // ── Scoring / waiting screen ─────────────────────────────────────────
  if (round?.status === 'scoring' || (submitted && round?.status === 'active' && !partnerDrawing)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="text-6xl mb-4 animate-bounce">🎨</div>
        <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-2">
          {round?.status === 'scoring' ? 'AI is judging...' : 'Waiting for partner...'}
        </h2>
        <p className="text-gray-500 text-sm">
          {round?.status === 'scoring' ? 'Analyzing your masterpieces 🤖' : `${partnerName} is still drawing...`}
        </p>
        <div className="flex gap-1.5 mt-6">
          {[0, 200, 400].map(d => (
            <span key={d} className="w-3 h-3 bg-rose-300 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  // ── No active round ──────────────────────────────────────────────────
  if (!round) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="text-7xl mb-5">🎨</div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900 mb-2">Draw Together</h1>
        <p className="text-gray-500 text-sm mb-8 max-w-xs">
          The system gives you both the same prompt. You have 90 seconds to draw. Then AI judges your masterpieces!
        </p>
        <button
          onClick={startRound}
          disabled={starting}
          className="px-10 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-all disabled:opacity-60"
        >
          {starting ? 'Starting...' : 'Start Drawing! 🖌️'}
        </button>
      </div>
    );
  }

  // ── Active drawing screen ────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-56px-72px)]">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Draw this:</p>
            <span className={`font-black text-xl tabular-nums ${timerColor}`}>
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </span>
          </div>
          <p className="font-playfair text-base font-semibold text-gray-900 leading-snug mb-2">&ldquo;{round.prompt}&rdquo;</p>
          {/* Timer bar */}
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${timeLeft > 30 ? 'bg-emerald-400' : timeLeft > 10 ? 'bg-amber-400' : 'bg-red-400'}`}
              style={{ width: `${timerPct}%` }}
            />
          </div>
          {/* Partner status */}
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${partnerDrawing ? 'bg-emerald-400' : 'bg-gray-300 animate-pulse'}`} />
            <span className="text-[11px] text-gray-400">
              {partnerDrawing ? `${partnerName} submitted ✓` : `${partnerName} is drawing...`}
            </span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative bg-gray-50 flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={600}
          height={600}
          className="bg-white shadow-md touch-none"
          style={{ width: '100%', maxWidth: 500, height: 'auto', cursor: erasing ? 'cell' : 'crosshair' }}
          onPointerDown={startDraw}
          onPointerMove={doDraw}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
          onPointerCancel={endDraw}
        />
        {submitted && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-2">✅</div>
              <p className="font-bold text-gray-700">Submitted! Waiting for {partnerName}...</p>
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="bg-white border-t border-gray-100 px-3 py-2.5">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {/* Colors */}
          <div className="flex gap-1.5 flex-1 flex-wrap">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => { setColor(c); setErasing(false); }}
                className={`w-7 h-7 rounded-full border-2 transition-all active:scale-90 ${color === c && !erasing ? 'border-gray-700 scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Sizes */}
          <div className="flex gap-1.5 items-center">
            {SIZES.map(s => (
              <button
                key={s}
                onClick={() => { setSize(s); setErasing(false); }}
                className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all active:scale-90 ${size === s && !erasing ? 'bg-gray-800' : 'bg-gray-100'}`}
              >
                <div className="rounded-full bg-current" style={{ width: s + 2, height: s + 2, backgroundColor: size === s && !erasing ? 'white' : '#374151' }} />
              </button>
            ))}
          </div>

          {/* Eraser */}
          <button
            onClick={() => setErasing(e => !e)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 ${erasing ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            <Eraser size={15} />
          </button>

          {/* Undo */}
          <button
            onClick={undo}
            className="w-8 h-8 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center active:scale-90 transition-all"
          >
            <RotateCcw size={15} />
          </button>

          {/* Clear */}
          <button
            onClick={clearCanvas}
            className="w-8 h-8 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center active:scale-90 transition-all"
          >
            <Trash2 size={15} />
          </button>

          {/* Submit */}
          <button
            onClick={submitDrawing}
            disabled={submitting || submitted}
            className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all disabled:opacity-50 ml-1"
          >
            {submitting ? '...' : submitted ? 'Done ✓' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
