'use client';

import { useState, useRef, useEffect } from 'react';
import { Message } from '@/types/chat';

interface ChatMessageProps {
  message: Message;
  isPlaying: boolean;
  onAudioPlay: () => void;
  onAudioEnd: () => void;
}

export default function ChatMessage({ message, isPlaying, onAudioPlay, onAudioEnd }: ChatMessageProps) {
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressIntervalRef = useRef<number | null>(null);

  const isUser = message.sender === 'user';

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
        startProgressTimer();
      } else {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        if (progressIntervalRef.current) {
          window.clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        setAudioProgress(0);
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const startProgressTimer = () => {
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
    }
    
    progressIntervalRef.current = window.setInterval(() => {
      if (audioRef.current && message.duration) {
        const progress = (audioRef.current.currentTime / message.duration) * 100;
        setAudioProgress(progress);
        
        if (progress >= 100) {
          if (progressIntervalRef.current) {
            window.clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          onAudioEnd();
        }
      }
    }, 100);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      onAudioEnd();
    } else {
      onAudioPlay();
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
        isUser 
          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-none' 
          : 'bg-gray-100 text-gray-800 rounded-bl-none'
      }`}>
        
        {/* Sender Info */}
        <div className="flex items-center space-x-2 mb-1">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
            isUser ? 'bg-white/20' : 'bg-blue-100 text-blue-600'
          }`}>
            {isUser ? 'U' : 'AI'}
          </div>
          <span className="text-xs opacity-80">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Message Content */}
        <p className="mb-2">{message.content}</p>

        {/* Voice Message Player */}
        {message.voiceUrl && (
          <div className={`mt-2 p-3 rounded-xl ${
            isUser ? 'bg-white/20' : 'bg-white'
          }`}>
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePlayPause}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isUser 
                    ? 'bg-white text-blue-500 hover:bg-white/90' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              <div className="flex-1">
                {/* Progress Bar */}
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
                  <div 
                    className={`h-full ${isUser ? 'bg-white' : 'bg-blue-500'} transition-all duration-100`}
                    style={{ width: `${audioProgress}%` }}
                  />
                </div>
                
                {/* Time Info */}
                <div className="flex justify-between text-xs">
                  <span className={isUser ? 'text-white/80' : 'text-gray-600'}>
                    {formatTime((audioRef.current?.currentTime || 0))}
                  </span>
                  <span className={isUser ? 'text-white/80' : 'text-gray-600'}>
                    {formatTime(message.duration || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Hidden Audio Element */}
            <audio
              ref={audioRef}
              src={message.voiceUrl}
              onEnded={onAudioEnd}
              preload="metadata"
            />
          </div>
        )}
      </div>
    </div>
  );
}