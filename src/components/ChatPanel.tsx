import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import { UserIcon, BotIcon, SendIcon, HourglassIcon } from './icons';

interface ChatPanelProps {
  history: ChatMessage[];
  isSending: boolean;
  onSendMessage: (message: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ history, isSending, onSendMessage }) => {
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isSending) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="mt-4 bg-gray-800/50 rounded-lg shadow-lg flex flex-col h-full max-h-[50vh]">
        <h3 className="text-lg font-semibold text-gray-200 p-4 border-b border-gray-700">Follow-up Chat</h3>
        <div ref={scrollRef} className="flex-grow p-4 overflow-y-auto space-y-6 custom-scrollbar">
            {history.map((chat, index) => (
                <div key={index} className={`flex items-start gap-3 ${chat.role === 'user' ? 'justify-end' : ''}`}>
                    {chat.role === 'model' && <span className="flex-shrink-0 bg-brand-blue p-2 rounded-full"><BotIcon className="w-5 h-5 text-white" /></span>}
                    <div className={`text-sm p-3 rounded-lg max-w-lg ${chat.role === 'model' ? 'bg-gray-700 text-gray-200' : 'bg-brand-blue text-white'}`}>
                        <div className="prose prose-invert prose-sm max-w-none">
                            {chat.role === 'model' ? (
                                <div className="space-y-4">
                                    {chat.text.split('\n\n').map((block, i) => {
                                        const trimmedBlock = block.trim();
                                        if (!trimmedBlock) return null;

                                        // Process bold text first
                                        const processText = (text: string) => {
                                            const parts = text.split('**');
                                            return parts.map((part, j) => (
                                                j % 2 === 0 ? part : <strong key={j} className="text-brand-teal">{part}</strong>
                                            ));
                                        };

                                        // Check for indented blocks
                                        if (trimmedBlock.includes('\n    ')) {
                                            const [header, ...items] = trimmedBlock.split('\n    ');
                                            return (
                                                <div key={i} className="space-y-2">
                                                    <p>{processText(header)}</p>
                                                    <ul className="space-y-2 ml-6 list-none">
                                                        {items.map((item, j) => (
                                                            <li key={j} className="text-gray-300">{processText(item.trim())}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            );
                                        }

                                        return <p key={i}>{processText(trimmedBlock)}</p>;
                                    })}
                                </div>
                            ) : (
                                chat.text
                            )}
                        </div>
                    </div>
                     {chat.role === 'user' && <span className="flex-shrink-0 bg-gray-600 p-2 rounded-full"><UserIcon className="w-5 h-5 text-white" /></span>}
                </div>
            ))}
            {isSending && (
                 <div className="flex items-start gap-3">
                     <span className="flex-shrink-0 bg-brand-blue p-2 rounded-full"><BotIcon className="w-5 h-5 text-white" /></span>
                     <div className="text-sm p-3 rounded-lg bg-gray-700 text-gray-400 italic">
                         <HourglassIcon className="w-4 h-4 inline-block mr-2 animate-spin" />
                         Thinking...
                     </div>
                 </div>
            )}
        </div>
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700 flex items-center gap-3">
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask a follow-up question..."
                className="flex-grow bg-gray-700 text-white placeholder-gray-400 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                disabled={isSending}
                aria-label="Chat message input"
            />
            <button
                type="submit"
                disabled={!message.trim() || isSending}
                className="bg-brand-blue text-white rounded-full p-3 hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-blue disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                aria-label="Send chat message"
            >
                <SendIcon />
            </button>
        </form>
    </div>
  );
};