export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  voiceUrl?: string;
  duration?: number;
  isPlaying?: boolean;
}

export interface VoiceMessage {
  audioBlob: Blob;
  audioUrl: string;
  duration: number;
  transcript?: string;
}