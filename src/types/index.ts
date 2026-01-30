// TypeScript tüübid rakenduse jaoks

export interface Task {
  id: string;
  title: string;
  description: string;
  content: string;
  link?: string;
  linkText?: string;
  link_text?: string;
  price: number;
  category: 'general' | 'premium';
  step: number;
}

export interface News {
  id: number;
  source: string;
  source_id?: string;
  title: string;
  date?: string;
  created_at?: string;
  region: string; // Legacy field
  image_url?: string;
  image?: string;
  content: string;
  link?: string;
  type?: 'news';
  // Geo-Scoped V2/V3 fields
  scope?: 'DE' | 'LAND' | 'CITY';
  country?: string;
  land?: string;
  city?: string;
  topics?: string[];
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  actions?: string[];
  expires_at?: string;
  score?: number;
  dedupe_group?: string;
}

export interface UserData {
  id: string;
  email: string;
  username: string;
  land: string;
  city?: string;
  residence_permit: string;
  credits: number;
  completed_tasks?: string[];
  unlocked_tasks?: string[];
  created_at?: Date;
}

export interface PersonalTask {
  id: number;
  user_id: string;
  title: string;
  is_completed: boolean;
  created_at?: string;
}

export interface UserFile {
  id: number;
  user_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  created_at: string;
}

export type Theme = 'light' | 'dark';
export type View = 'login' | 'register' | 'recovery' | 'app';
export type TabType = 'home' | 'tasks' | 'portfolio' | 'news' | 'menu' | 'assistant'; // Added 'assistant'

// --- L7 AI ASSISTANT TYPES ---

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface AIContext {
  userProfile: {
    name: string;
    city: string;
    status: string;
    credits: number;
  };
  activeTasks: Task[];
  unreadNewsCount: number;
  currentView: string;
  location?: string;
  preferences?: Record<string, any>;
}

