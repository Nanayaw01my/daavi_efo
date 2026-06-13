'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Send, Mic, Pencil, Trash2, X } from 'lucide-react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { playSend } from '@/lib/sounds';

interface ChatMsg {
  _id: string;
  sender: string;
  senderDisplay: string;
  content: string;
  type?: 'text' | 'audio';
  audioData?: string;
  edited?: boolean;
  createdAt: string;
}

function DateSeparator({ date }: { date: Date }) {
  let label: string;
  if (isToday(date)) label = 'Today';
  else if (isYesterday(date)) label = 'Yesterday';
  else label = format(date, 'MMMM d, yyyy');
  return (
    <div className="flex items-center justify-center my-4">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="mx-3 text-[11px] font-semibold text-gray-400 whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

export default function ChatPage() {
  const { data: session } = useSession();
  const username = (session?.user as any)?.username as string | undefined;

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState<ChatMsg | null>(null);
  const [editingMsg, setEditingMsg] = useState<ChatMsg | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCountRef = useRef(0);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/chat');
      if (!res.ok) return;
      setMessages(await res.json());
    } catch {}
  }, []);

  useEffect(() => { fetchMessages().then(() => scrollToBottom('instant' as ScrollBehavior)); }, [fetchMessages, scrollToBottom]);
  useEffect(() => { const t = setInterval(fetchMessages, 4000); return () => clearInterval(t); }, [fetchMessages]);
  useEffect(() => {
    if (messages.length > prevCountRef.current) scrollToBottom('smooth');
    prevCountRef.current = messages.length;
  }, [messages.length, scrollToBottom]);
  useEffect(() => {
    const el = textareaRef.current; if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 84) + 'px';
  }, [input]);

  // Focus textarea when editing
  useEffect(() => {
    if (editingMsg) textareaRef.current?.focus();
  }, [editingMsg]);

  function startLongPress(msg: ChatMsg) {
    if (msg.sender !== username) return;
    longPressTimer.current = setTimeout(() => {
      navigator.vibrate?.(30);
      setSelectedMsg(msg);
    }, 500);
  }
  function cancelLongPress() {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  }

  async function sendMessage() {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);
    try {
      if (editingMsg) {
        const res = await fetch('/api/chat', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId: editingMsg._id, content }),
        });
        if (res.ok) { setEditingMsg(null); await fetchMessages(); }
      } else {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        if (res.ok) { playSend(); await fetchMessages(); scrollToBottom('smooth'); }
      }
    } catch {} finally { setSending(false); }
  }

  async function deleteMessage(msgId: string) {
    setSelectedMsg(null);
    await fetch('/api/chat', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: msgId }),
    }).catch(() => null);
    await fetchMessages();
  }

  function startEdit(msg: ChatMsg) {
    setSelectedMsg(null);
    setEditingMsg(msg);
    setInput(msg.content);
  }

  function cancelEdit() {
    setEditingMsg(null);
    setInput('');
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = async () => {
          const audioData = reader.result as string;
          setSending(true);
          await fetch('/api/chat', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'audio', audioData }),
          }).catch(() => null);
          await fetchMessages();
          scrollToBottom('smooth');
          setSending(false);
        };
      };
      mr.start();
      recorderRef.current = mr;
      setRecording(true);
    } catch {}
  }

  function stopRecording() { recorderRef.current?.stop(); setRecording(false); }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    if (e.key === 'Escape' && editingMsg) cancelEdit();
  }

  const renderedItems: Array<{ type: 'separator'; date: Date } | { type: 'message'; msg: ChatMsg }> = [];
  messages.forEach((msg, i) => {
    const msgDate = new Date(msg.createdAt);
    if (i === 0 || !isSameDay(msgDate, new Date(messages[i - 1].createdAt))) {
      renderedItems.push({ type: 'separator', date: msgDate });
    }
    renderedItems.push({ type: 'message', msg });
  });

  return (
    <div className="flex flex-col h-[calc(100vh-56px-72px)] relative">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-20">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-5xl mb-3">💕</div>
            <p className="text-gray-400 font-medium text-sm">No messages yet. Say hi! 💕</p>
          </div>
        ) : (
          <div className="space-y-1">
            {renderedItems.map((item, i) => {
              if (item.type === 'separator') return <DateSeparator key={`sep-${i}`} date={item.date} />;
              const { msg } = item;
              const isMine = msg.sender === username;
              return (
                <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1`}>
                  <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[78%]`}>
                    {!isMine && (
                      <span className="text-[11px] font-semibold text-gray-400 mb-0.5 ml-1">
                        {msg.senderDisplay}
                      </span>
                    )}
                    <div
                      onTouchStart={() => startLongPress(msg)}
                      onTouchEnd={cancelLongPress}
                      onTouchMove={cancelLongPress}
                      onContextMenu={e => { e.preventDefault(); if (isMine) setSelectedMsg(msg); }}
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed select-none ${
                        isMine
                          ? 'bg-rose-500 text-white rounded-br-sm'
                          : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm'
                      } ${isMine && selectedMsg?._id === msg._id ? 'opacity-70' : ''}`}
                    >
                      {msg.type === 'audio' && msg.audioData ? (
                        <audio src={msg.audioData} controls className="h-8 max-w-[200px]" />
                      ) : (
                        <span>{msg.content}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 mx-1">
                      <span className="text-[10px] text-gray-400">{format(new Date(msg.createdAt), 'h:mm a')}</span>
                      {msg.edited && <span className="text-[10px] text-gray-400">· edited</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Editing indicator */}
      {editingMsg && (
        <div className="fixed bottom-[72px] left-0 right-0 z-30 bg-amber-50 border-t border-amber-200 px-4 py-2 flex items-center gap-2">
          <Pencil size={13} className="text-amber-600 shrink-0" />
          <span className="text-xs text-amber-700 font-medium flex-1 truncate">Editing: {editingMsg.content}</span>
          <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input bar */}
      <div className={`fixed left-0 right-0 z-30 bg-white/90 backdrop-blur border-t border-gray-200 px-3 py-2.5 safe-area-inset-bottom ${editingMsg ? 'bottom-[72px] mt-[38px]' : 'bottom-[72px]'}`}
        style={{ bottom: editingMsg ? 'calc(72px + 38px)' : '72px' }}>
        <div className="flex items-end gap-2 max-w-lg mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={editingMsg ? 'Edit message...' : 'Type a message...'}
            className="flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all overflow-hidden"
            style={{ minHeight: 40, maxHeight: 84 }}
          />
          {!editingMsg && (
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={sending}
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${recording ? 'bg-red-500 animate-pulse' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              <Mic size={16} className={recording ? 'text-white' : 'text-gray-500'} />
            </button>
          )}
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className={`shrink-0 w-10 h-10 rounded-full text-white flex items-center justify-center shadow-md active:scale-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${editingMsg ? 'bg-amber-500' : 'bg-rose-500'}`}
          >
            {editingMsg ? <Pencil size={15} /> : <Send size={16} strokeWidth={2.5} />}
          </button>
        </div>
      </div>

      {/* Long-press action sheet */}
      {selectedMsg && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setSelectedMsg(null)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            {selectedMsg.type !== 'audio' && (
              <p className="text-gray-400 text-xs text-center mb-4 px-4 truncate">
                &ldquo;{selectedMsg.content}&rdquo;
              </p>
            )}
            {selectedMsg.type !== 'audio' && (
              <button
                onClick={() => startEdit(selectedMsg)}
                className="w-full py-3.5 flex items-center gap-3 px-4 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <Pencil size={18} className="text-gray-500" />
                <span className="font-medium text-gray-800">Edit message</span>
              </button>
            )}
            <button
              onClick={() => deleteMessage(selectedMsg._id)}
              className="w-full py-3.5 flex items-center gap-3 px-4 rounded-xl hover:bg-red-50 active:bg-red-100 transition-colors"
            >
              <Trash2 size={18} className="text-red-500" />
              <span className="font-medium text-red-500">Delete message</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
