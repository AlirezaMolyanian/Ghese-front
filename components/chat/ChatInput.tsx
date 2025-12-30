'use client';

import { useState, useRef, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onStartRecording: () => void;
  isRecording: boolean;
  disabled?: boolean;
}

export default function ChatInput({ 
  onSendMessage, 
  onStartRecording, 
  isRecording, 
  disabled = false 
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isHoldingMic, setIsHoldingMic] = useState(false);
  const holdTimerRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleMouseDown = () => {
    setIsHoldingMic(true);
    holdTimerRef.current = window.setTimeout(() => {
      if (!isRecording) {
        onStartRecording();
      }
    }, 500); // 0.5 second hold to start recording
  };

  const handleMouseUp = () => {
    setIsHoldingMic(false);
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };


  return (
    <div className="flex items-end space-x-3">
      {/* Text Input */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onKeyDown={handleKeyDown}
          placeholder="Type your message here..."
          disabled={disabled || isRecording}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[48px] max-h-[120px] disabled:opacity-50"
          rows={1}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        {message.trim() ? (
          <button
            onClick={handleSubmit}
            disabled={disabled || isRecording}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        ) : (
          // Voice Recording Button (when no text)
          <button
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            disabled={disabled || isRecording}
            className={`p-3 rounded-xl transition-all duration-300 shadow-md ${
              isHoldingMic 
                ? 'bg-red-500 scale-110' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isHoldingMic ? (
              <div className="w-5 h-5 bg-white rounded-sm"></div>
            ) : (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}