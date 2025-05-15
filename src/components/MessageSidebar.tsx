import React from 'react';
import Image from 'next/image';

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

interface Conversation {
  _id: string;
  otherParticipant: {
    _id: string;
    name: string;
    avatar?: string;
  };
  lastMessage?: {
    content: string;
    sender: string;
    createdAt: string;
    isOwn: boolean;
  };
  updatedAt: string;
}

interface Props {
  conversations: Conversation[];
  onSelect: (id: string) => void;
  selectedId: string | null;
  currentUserId: string;
}

export function MessageSidebar({ conversations, onSelect, selectedId, currentUserId }: Props) {
  return (
    <aside className="w-80 border-r h-full flex flex-col">
      <h2 className="p-4 font-bold text-lg border-b">Messages</h2>
      <div className="flex-1 overflow-y-auto">
        {conversations.map(conv => (
          <div
            key={conv._id}
            className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-100 ${conv._id === selectedId ? 'bg-gray-100' : ''}`}
            onClick={() => onSelect(conv._id)}
          >
            <Image 
              src={conv.otherParticipant.avatar || '/default-avatar.png'} 
              width={40} 
              height={40} 
              className="rounded-full" 
              alt={conv.otherParticipant.name} 
            />
            <div>
              <div className="font-semibold">{conv.otherParticipant.name}</div>
              <div className="text-xs text-gray-500 truncate max-w-[180px]">
                {conv.lastMessage?.content}
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
