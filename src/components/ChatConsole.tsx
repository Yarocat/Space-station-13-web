import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, Terminal, MessageSquare, Radio, ShieldAlert, Cpu } from 'lucide-react';

interface ChatConsoleProps {
  messages: ChatMessage[];
  onSendMessage: (rawInput: string) => void;
}

export const ChatConsole: React.FC<ChatConsoleProps> = ({ messages, onSendMessage }) => {
  const [inputVal, setInputVal] = useState<string>('');
  const [filterChannel, setFilterChannel] = useState<string>('ALL');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    onSendMessage(inputVal.trim());
    setInputVal('');
  };

  const filteredMessages = filterChannel === 'ALL'
    ? messages
    : messages.filter((m) => m.channel === filterChannel);

  const getChannelColor = (channel: ChatMessage['channel']) => {
    switch (channel) {
      case 'RADIO':
        return 'text-emerald-400 font-semibold';
      case 'SAY':
        return 'text-neutral-200';
      case 'EMOTE':
        return 'text-sky-300 italic';
      case 'OOC':
        return 'text-amber-400 font-medium';
      case 'ATMOS':
        return 'text-pink-400';
      case 'COMBAT':
        return 'text-red-400';
      case 'SYSTEM':
      default:
        return 'text-neutral-400';
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900/95 border-l border-neutral-800 text-xs font-mono select-text">
      {/* Header Channel Filters */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800 bg-neutral-950/60">
        <div className="flex items-center gap-1.5 text-neutral-400">
          <Terminal className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-semibold tracking-wide text-neutral-200 uppercase text-[11px]">
            Station Comms
          </span>
        </div>

        <div className="flex items-center gap-1">
          {['ALL', 'RADIO', 'SAY', 'ATMOS', 'COMBAT'].map((ch) => (
            <button
              key={ch}
              onClick={() => setFilterChannel(ch)}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                filterChannel === ch
                  ? 'bg-neutral-800 text-amber-400 font-semibold border border-neutral-700'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Message Feed */}
      <div
        ref={scrollRef}
        className="flex-1 p-3 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-neutral-700 select-text"
      >
        {filteredMessages.map((msg) => (
          <div key={msg.id} className="leading-relaxed break-words">
            <span className="text-[10px] text-neutral-600 mr-2">[{msg.timestamp}]</span>
            {msg.channel !== 'SAY' && (
              <span className={`text-[10px] mr-1.5 px-1 py-0.5 rounded uppercase tracking-wider bg-neutral-800/80 ${getChannelColor(msg.channel)}`}>
                {msg.channel}
              </span>
            )}
            <span className="font-bold text-neutral-300 mr-1">{msg.sender}:</span>
            <span className={getChannelColor(msg.channel)}>{msg.text}</span>
          </div>
        ))}
      </div>

      {/* GamingLineEdit Command Bar */}
      <form onSubmit={handleSubmit} className="p-2 border-t border-neutral-800 bg-neutral-950/80 flex items-center gap-2">
        <input
          type="text"
          id="command-line-edit"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Say, :me emote, /spawn item, or /help..."
          className="flex-1 bg-neutral-900 border border-neutral-700/80 rounded px-2.5 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors font-mono"
        />
        <button
          type="submit"
          id="send-cmd-btn"
          className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded font-mono text-xs border border-neutral-700 flex items-center gap-1 transition-colors"
        >
          <Send className="w-3 h-3 text-amber-400" />
        </button>
      </form>
    </div>
  );
};
