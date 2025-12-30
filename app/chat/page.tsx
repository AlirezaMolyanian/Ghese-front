'use client';

import { useState, useRef, useEffect } from 'react';
import ChatMessageList from '@/components/chat/ChatMessageList';
import ChatInput from '@/components/chat/ChatInput';
import VoiceRecorder from '@/components/chat/VoiceRecorder';
import { Message, VoiceMessage, ApiResponse } from '@/types/chat';

// API endpoints configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';
const CHAT_API_URL = `${API_BASE_URL}/chat`;
const VOICE_API_URL = `${API_BASE_URL}/voice`;

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', content: 'Hello! I am your AI assistant. You can send me text or voice messages.', sender: 'assistant', timestamp: new Date() },
  ]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentInputText, setCurrentInputText] = useState(''); // Track current input text
  const [textForTTS, setTextForTTS] = useState('');
  const [isTextToSpeechMode, setIsTextToSpeechMode] = useState(false);
  
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
    setError(null);

    try {
      // Send text message to Spring Boot backend
      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          userId: 'user-123',
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.reply || 'I received your message!',
        sender: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      
      // Fallback response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVoiceMessage = async (voiceData: VoiceMessage) => {
    const voiceMessage: Message = {
      id: Date.now().toString(),
      content: voiceData.transcript || '[Voice message sent]',
      sender: 'user',
      timestamp: new Date(),
      voiceUrl: voiceData.audioUrl,
      duration: voiceData.duration,
    };

    setMessages(prev => [...prev, voiceMessage]);
    setIsLoading(true);
    setError(null);
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setIsTextToSpeechMode(false); // This is voice recording mode
    setError(null);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsTextToSpeechMode(false);
  };

  const handleRetry = () => {
    setError(null);
  };

  // Update current input text when ChatInput changes
  const handleInputTextChange = (text: string) => {
    setCurrentInputText(text);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Voice & Text Chat</h1>
              <p className="text-sm text-gray-500">
                {isTextToSpeechMode ? 'Text-to-Speech Mode' : 'Connected to Spring Boot Backend'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-hidden p-4 md:p-6">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-700">{error}</span>
                </div>
                <button
                  onClick={handleRetry}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Mode Indicator */}
          {isTextToSpeechMode && isRecording && (
            <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span className="text-purple-700 font-medium">Converting text to speech...</span>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto rounded-2xl bg-white/80 backdrop-blur-sm p-4 shadow-sm mb-4">
            <ChatMessageList messages={messages} isLoading={isLoading} />
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Recorder Overlay */}
          {isRecording && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
                <VoiceRecorder
                  onRecordingComplete={handleSendVoiceMessage}
                  onRecordingStop={handleStopRecording}
                  textToConvert={isTextToSpeechMode ? textForTTS : undefined}
                />
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-200">
            <ChatInput
              onSendMessage={handleSendMessage}
              onStartRecording={handleStartRecording}
              onStartTextToSpeech={() => handleStartTextToSpeech()}
              onInputTextChange={handleInputTextChange} // Add this prop
              isRecording={isRecording}
              disabled={isLoading}
            />
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-center mt-3 space-x-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              isLoading ? 'bg-yellow-500' : 'bg-green-500'
            }`}></div>
            <p className="text-sm text-gray-500">
              {isLoading 
                ? 'Processing...' 
                : isTextToSpeechMode 
                  ? 'Text-to-speech mode' 
                  : 'Ready to send text or voice messages'
              }
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}