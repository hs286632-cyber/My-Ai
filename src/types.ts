export type MessageRole = 'user' | 'assistant' | 'system';

export type MessageType = 'text' | 'image';

export type ImageStyle = 'realistic' | 'cartoon' | 'anime' | 'cinematic' | '3d' | 'illustration' | 'logo';

export type AspectRatio = '1:1' | '16:9' | '9:16';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  type?: MessageType;
  imageUrl?: string;
  imagePrompt?: string;
  imageStyle?: ImageStyle;
  imageAspectRatio?: AspectRatio;
  isError?: boolean;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface AdminSettings {
  defaultModel: string;
  systemInstruction: string;
  temperature: number;
  imageLimitDaily: number;
  enableVoiceInput: boolean;
  rateLimitPerMin: number;
}

export interface SystemLog {
  id: string;
  timestamp: number;
  type: 'info' | 'chat' | 'image' | 'error' | 'admin';
  message: string;
  details?: string;
}

export interface UsageStats {
  totalMessages: number;
  totalImages: number;
  activeUsersCount: number;
  errorCount: number;
  logs: SystemLog[];
}

export interface ImageGenerateRequest {
  prompt: string;
  style: ImageStyle;
  aspectRatio: AspectRatio;
}

export interface ImageGenerateResponse {
  imageUrl: string;
  prompt: string;
  style: ImageStyle;
  aspectRatio: AspectRatio;
  revisedPrompt?: string;
}
