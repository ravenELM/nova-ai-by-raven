export interface Attachment {
  type: 'image' | 'file';
  mimeType: string;
  data: string; // Base64 string with data URI prefix
  name: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  isGeneratingImage?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  isArchived?: boolean;
}

export enum ModelType {
  FLASH = 'gemini-3-flash-preview',
  PRO = 'gemini-3-pro-preview',
}

export type Plan = 'free' | 'basic' | 'pro' | 'plus' | 'agent';

export interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  alwaysShowCode: boolean;
  language: string;
  customInstructions: string;
  enableMemory: boolean;
  enableHistory: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // In a real app, this would be hashed. Storing plain for demo.
  plan: Plan;
  settings: UserSettings;
  // Credit System
  credits: number;
  lastCreditReset: number; // Timestamp
  dailyImageCount: number;
  lastImageReset: number; // Timestamp
}