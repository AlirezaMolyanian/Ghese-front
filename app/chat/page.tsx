'use client';

import { useState, useRef, useEffect } from 'react';
import ChatMessageList from '@/components/chat/ChatMessageList';
import ChatInput from '@/components/chat/ChatInput';
import VoiceRecorder from '@/components/chat/VoiceRecorder';
import { Message, VoiceMessage } from '@/types/chat';

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', content: 'Hello! How can I help you today?', sender: 'assistant', timestamp: new Date() },
    { id: '2', content: 'Hi! I have a question about your services.', sender: 'user', timestamp: new Date() },
  ]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I received your message: "${content}"`,
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleSendVoiceMessage = async (voiceData: VoiceMessage) => {
    const voiceMessage: Message = {
      id: Date.now().toString(),
      content: voiceData.transcript || '[Voice message]',
      sender: 'user',
      timestamp: new Date(),
      voiceUrl: voiceData.audioUrl,
      duration: voiceData.duration,
    };

    setMessages(prev => [...prev, voiceMessage]);
    setIsLoading(true);

    // Simulate API processing voice message
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'I received your voice message!',
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleStartRecording = () => {
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">AI</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">AI Assistant</h1>
              <p className="text-sm text-gray-500">Online • Always ready to help</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-hidden p-4 md:p-6">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto rounded-2xl bg-white/80 backdrop-blur-sm p-4 shadow-sm mb-4">
            <ChatMessageList messages={messages} isLoading={isLoading} />
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Recording Overlay */}
          {isRecording && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
                <VoiceRecorder
                  onRecordingComplete={handleSendVoiceMessage}
                  onRecordingStop={handleStopRecording}
                />
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-200">
            <ChatInput
              onSendMessage={handleSendMessage}
              onStartRecording={handleStartRecording}
              isRecording={isRecording}
              disabled={isLoading}
            />
          </div>

          {/* Helper Text */}
          <p className="text-center text-gray-500 text-sm mt-3">
            Press and hold the microphone button to record voice, or type your message
          </p>
        </div>
      </main>
    </div>
  );
}