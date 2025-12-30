'use client';

import { useState, useRef, useEffect } from 'react';
import { VoiceMessage } from '@/types/chat';

interface VoiceRecorderProps {
  onRecordingComplete: (voiceMessage: VoiceMessage) => void;
  onRecordingStop: () => void;
}

// ElevenLabs configuration
const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || 'YOUR_API_KEY';

export default function VoiceRecorder({ 
  onRecordingComplete, 
  onRecordingStop 
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [recordingSize, setRecordingSize] = useState<string>('0 KB');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Start recording automatically when component mounts
  useEffect(() => {
    startRecording();
    
    return () => {
      stopRecording();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          updateRecordingSize();
        }
      };

      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: 'audio/webm' 
          });
          setAudioBlob(audioBlob);
          const audioUrl = URL.createObjectURL(audioBlob);
          setAudioUrl(audioUrl);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      
      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Microphone access denied. Please allow microphone access to record.');
      onRecordingStop();
    }
  };

  const updateRecordingSize = () => {
    const totalSize = audioChunksRef.current.reduce((total, chunk) => total + chunk.size, 0);
    const sizeInKB = (totalSize / 1024).toFixed(1);
    setRecordingSize(`${sizeInKB} KB`);
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

  const transcribeAudio = async () => {
    if (!audioBlob) {
      setError('No audio recording available to transcribe');
      return;
    }

    setIsTranscribing(true);
    setError(null);

    try {
      // Dynamic import to avoid SSR issues
      const { ElevenLabsClient } = await import('@elevenlabs/elevenlabs-js');

      const elevenlabs = new ElevenLabsClient({
        apiKey: ELEVENLABS_API_KEY,
      });

      console.log('Transcribing audio with ElevenLabs...');

      // Convert audio to speech-to-text
      const transcription = await elevenlabs.speechToText.convert({
        file: audioBlob,
        modelId: "scribe_v1", // Model to use
        tagAudioEvents: true, // Tag audio events like laughter, applause, etc.
        languageCode: "fa", // Language of the audio file
        diarize: true, // Whether to annotate who is speaking
      });

      console.log('Transcription result:', transcription);

      // Extract transcript from response
      let transcribedText = '';
      
      if (typeof transcription === 'string') {
        transcribedText = transcription;
      } else if (transcription.text) {
        transcribedText = transcription.text;
      } else if (Array.isArray(transcription)) {
        // Handle array format if returned
        transcribedText = transcription.map(item => item.text || '').join(' ');
      }

      setTranscript(transcribedText.trim());
      
    } catch (error) {
      console.error('Error transcribing audio:', error);
      setError(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Fallback: Use Web Speech API if ElevenLabs fails
      await tryWebSpeechAPI();
    } finally {
      setIsTranscribing(false);
    }
  };

  // Fallback using Web Speech API
  const tryWebSpeechAPI = async (): Promise<void> => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      return new Promise((resolve) => {
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setTranscript(transcript);
          resolve();
        };

        recognition.onerror = (event: any) => {
          setError(`Web Speech API error: ${event.error}`);
          resolve();
        };

        recognition.onend = () => {
          resolve();
        };

        // Convert blob to audio element
        const audio = new Audio(audioUrl);
        audio.oncanplaythrough = () => {
          // Note: Web Speech API requires live audio input, not recorded audio
          // This is a limitation, so we'll just show a message
          setTranscript('[Web Speech API requires live microphone input]');
          resolve();
        };
        audio.onerror = () => {
          setError('Cannot play audio for transcription');
          resolve();
        };
      });
    } catch (error) {
      console.error('Web Speech API error:', error);
      setError('Speech recognition failed');
    }
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    
    // If we have a transcript, use it, otherwise send without transcript
    const voiceMessage: VoiceMessage = {
      audioBlob,
      audioUrl,
      duration: recordingTime,
      transcript: transcript || 'Voice message (transcription unavailable)',
    };
    
    onRecordingComplete(voiceMessage);
  };

  const handleCancel = () => {
    stopRecording();
    onRecordingStop();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
          {isRecording ? (
            <div className="w-10 h-10 bg-red-500 rounded-full animate-pulse"></div>
          ) : isTranscribing ? (
            <div className="w-10 h-10 bg-purple-500 rounded-full animate-spin">
              <div className="w-full h-full border-4 border-white border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <h3 className="text-xl font-semibold text-gray-800">
          {isRecording ? 'Recording...' : 
           isTranscribing ? 'Transcribing...' : 
           transcript ? 'Transcription Ready' : 'Recording Complete'}
        </h3>
        <p className="text-gray-600 mt-1">
          {isRecording ? 'Speak into your microphone' : 
           isTranscribing ? 'Converting speech to text with AI' :
           'Your voice message is ready'}
        </p>
      </div>

      {/* Recording Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-800">{formatTime(recordingTime)}</div>
          <p className="text-sm text-gray-500">Duration</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-800">{recordingSize}</div>
          <p className="text-sm text-gray-500">Size</p>
        </div>
      </div>

      {/* Transcription Result */}
      {transcript && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Transcription:</p>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
              AI Generated
            </span>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-gray-800">{transcript}</p>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Powered by ElevenLabs Speech-to-Text
          </div>
        </div>
      )}

      {/* Audio Preview */}
      {audioUrl && !isRecording && !isTranscribing && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Audio Preview:</p>
          <audio 
            controls 
            className="w-full"
            src={audioUrl}
          >
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-center space-x-4 pt-4">
        <button
          onClick={handleCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          disabled={isTranscribing}
        >
          Cancel
        </button>
        
        {isRecording ? (
          <button
            onClick={stopRecording}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
            <span>Stop Recording</span>
          </button>
        ) : !transcript && !isTranscribing ? (
          <button
            onClick={transcribeAudio}
            disabled={!audioBlob || isTranscribing}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Transcribe with AI</span>
          </button>
        ) : (
          <button
            onClick={handleSend}
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 font-medium transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Send with Transcript</span>
          </button>
        )}
      </div>

      {/* Status Indicator */}
      <div className="text-center">
        {isTranscribing && (
          <div className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse mr-2"></div>
            Processing audio with ElevenLabs AI...
          </div>
        )}
      </div>
    </div>
  );
}