export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  voiceUrl?: string;
  duration?: number;
  transcript?: string;
}

export interface VoiceMessage {
  audioBlob: Blob;
  audioUrl: string;
  duration: number;
  transcript?: string;
}

export interface ChatRequest {
  message: string;
  userId: string;
  timestamp: string;
}

export interface VoiceRequest {
  audio: string; // Base64 encoded audio
  format: string;
  duration: number;
  userId: string;
  timestamp: string;
}

export interface ApiResponse {
  success: boolean;
  reply: string;
  transcript?: string;
  error?: string;
}