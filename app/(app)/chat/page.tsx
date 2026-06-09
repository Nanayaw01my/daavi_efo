'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Send } from 'lucide-react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';

interface ChatMsg {
  _id: string;
  sender: string;
  senderDisplay: string;
  content: string;
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/chat');
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data);
    } catch {
      // silent
    }
  }, []);

  // Initial load + scroll to bottom immediately
  useEffect(() => {
    fetchMessages().then(() => scrollToBottom('instant' as ScrollBehavior));
  }, [fetchMessages, scrollToBottom]);

  // Poll every 4 seconds
  useEffect(() => {
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Scroll to bottom when messages change (after initial load)
  const prevCountRef = useRef(0);
  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      scrollToBottom('smooth');
    }
    prevCountRef.current = messages.length;
  }, [messages.length, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 84) + 'px'; // max 3 rows ≈ 84px
  }, [input]);

  async function sendMessage() {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        await fetchMessages();
        scrollToBottom('smooth');
      }
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Build messages with date separators
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
      {/* Messages scroll area */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-20">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-5xl mb-3">💕</div>
            <p className="text-gray-400 font-medium text-sm">No messages yet. Say hi! 💕</p>
          </div>
        ) : (
          <div className="space-y-1">
            {renderedItems.map((item, i) => {
              if (item.type === 'separator') {
                return <DateSeparator key={`sep-${i}`} date={item.date} />;
              }
              const { msg } = item;
              const isMine = msg.sender === username;
              return (
                <div
                  key={msg._id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1`}
                >
                  <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[78%]`}>
                    {/* Sender label — show only if not mine and first in a run or after separator */}
                    {!isMine && (
                      <span className="text-[11px] font-semibold text-gray-400 mb-0.5 ml-1">
                        {msg.senderDisplay}
                      </span>
                    )}
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMine
                          ? 'bg-rose-500 text-white rounded-br-sm'
                          : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-0.5 mx-1">
                      {format(new Date(msg.createdAt), 'h:mm a')}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Fixed input bar — sits above bottom nav (72px) */}
      <div className="fixed bottom-[72px] left-0 right-0 z-30 bg-white/90 backdrop-blur border-t border-gray-200 px-3 py-2.5 safe-area-inset-bottom">
        <div className="flex items-end gap-2 max-w-lg mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Type a message..."
            className="flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all overflow-hidden"
            style={{ minHeight: 40, maxHeight: 84 }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md active:scale-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send"
          >
            <Send size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
