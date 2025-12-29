'use client';

import { useState } from 'react';
import { Message } from '@/types/chat';
import ChatMessage from './ChatMessage';

interface ChatMessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export default function ChatMessageList({ messages, isLoading }: ChatMessageListProps) {
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const handleAudioPlay = (messageId: string) => {
    setPlayingAudioId(messageId);
  };

  const handleAudioEnd = () => {
    setPlayingAudioId(null);
  };

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
          isPlaying={playingAudioId === message.id}
          onAudioPlay={() => handleAudioPlay(message.id)}
          onAudioEnd={handleAudioEnd}
        />
      ))}
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}
    </div>
  );
}