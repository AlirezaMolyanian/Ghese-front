'use client';

import { useState, useEffect, useRef } from 'react';
import { VoiceMessage } from '@/types/chat';

interface VoiceRecorderProps {
  onRecordingComplete: (voiceMessage: VoiceMessage) => void;
  onRecordingStop: () => void;
}

export default function VoiceRecorder({ onRecordingComplete, onRecordingStop }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    startRecording();
    
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      onRecordingStop();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    
    setIsProcessing(true);
    
    // Simulate transcription API call
    setTimeout(() => {
      const voiceMessage: VoiceMessage = {
        audioBlob,
        audioUrl,
        duration: recordingTime,
        transcript: 'This is a simulated transcript. In production, integrate with a speech-to-text API.',
      };
      
      onRecordingComplete(voiceMessage);
      setIsProcessing(false);
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-10 h-10 bg-red-500 rounded-full animate-pulse"></div>
        </div>
        <h3 className="text-xl font-semibold text-gray-800">Recording Voice Message</h3>
        <p className="text-gray-600 mt-1">Speak now, release to send</p>
      </div>

      {/* Visualizer */}
      <div className="flex justify-center items-end h-24 gap-1">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="w-2 bg-blue-500 rounded-t-lg animate-pulse"
            style={{
              height: `${20 + Math.sin(i * 0.5) * 15 + Math.random() * 30}px`,
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>

      {/* Timer */}
      <div className="text-center">
        <div className="text-4xl font-mono font-bold text-gray-800">
          {formatTime(recordingTime)}
        </div>
        <p className="text-gray-500 text-sm mt-1">Recording time</p>
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={onRecordingStop}
          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full font-medium transition-colors"
          disabled={isProcessing}
        >
          Cancel
        </button>
        
        <button
          onClick={stopRecording}
          className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium transition-colors flex items-center space-x-2"
          disabled={isProcessing}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
          </svg>
          <span>Stop Recording</span>
        </button>
        
        {!isRecording && audioBlob && (
          <button
            onClick={handleSend}
            disabled={isProcessing}
            className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-medium transition-colors flex items-center space-x-2"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Send Voice</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Preview */}
      {audioUrl && !isRecording && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
          <audio controls className="w-full">
            <source src={audioUrl} type="audio/webm" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  );
}