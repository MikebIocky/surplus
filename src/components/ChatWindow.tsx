import React, { useRef, useEffect } from 'react';
import Image from 'next/image';

interface Message {
  _id: string;
  sender: { _id: string; name: string; avatar?: string };
  content: string;
  createdAt: string;
}
interface Props {
  messages: Message[];
  currentUserId: string;
  onSend: (content: string) => void;
}
export function ChatWindow({ messages, currentUserId, onSend }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(msg => (
          <div key={msg._id} className={`flex ${msg.sender._id === currentUserId ? 'justify-end' : 'justify-start'} mb-2`}>
            <div className={`flex items-end gap-2 max-w-[70%] ${msg.sender._id === currentUserId ? 'flex-row-reverse' : ''}`}>
              <Image src={msg.sender.avatar || '/default-avatar.png'} width={32} height={32} className="rounded-full" alt={msg.sender.name} />
              <div className={`rounded-lg p-3 ${msg.sender._id === currentUserId ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                <div className="text-sm">{msg.content}</div>
                <div className="text-xs text-right opacity-60">{new Date(msg.createdAt).toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form
        className="p-4 border-t flex gap-2"
        onSubmit={e => { e.preventDefault(); const form = e.target as any; onSend(form.message.value); form.message.value = ''; }}
      >
        <input name="message" className="flex-1 border rounded p-2" placeholder="Type a message..." autoComplete="off" />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Send</button>
      </form>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
