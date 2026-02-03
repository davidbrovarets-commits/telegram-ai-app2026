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

export type NewsType = 'IMPORTANT' | 'INFO' | 'FUN';
export type NewsStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED' | 'AUTO_REMOVED' | 'POOL' | 'SHADOW_DELETED' | 'AUTO_EXPIRED';
export type EmotionalWeight = 'LOW' | 'MEDIUM' | 'HIGH';

export interface News {
  id: number;
  source: string;
  source_id?: string;
  title: string;
  // Standardized Date Fields
  published_at?: string; // Original publication date from source
  created_at?: string;   // Ingestion time

  region: string; // Legacy field
  image_url?: string;
  image_status?: 'placeholder' | 'generating' | 'generated' | 'failed';
  image_source_type?: 'reference' | 'imagen';
  image?: string; // Legacy
  content: string;
  link?: string;

  // Logical Fields
  type?: NewsType;
  status: NewsStatus;

  // Geo-Scoped V2/V3 fields
  scope?: 'DE' | 'LAND' | 'CITY' | 'COUNTRY';
  country?: string;
  land?: string;
  city?: string;

  // Intelligence Layer
  topics?: string[];
  priority?: 'HIGH' | 'MEDIUM' | 'LOW'; // Legacy score-based priority
  reason_tag?: string;      // e.g. 'OFFICIAL_UPDATE', 'EVENT_NEAR_YOU'
  decay_score?: number;     // 0-100, default 100
  emotional_weight?: EmotionalWeight;

  actions?: string[];
  expires_at?: string;
  score?: number;
  dedupe_group?: string;

  // Agent Fields
  keyword_hits?: string[];
  relevance_score?: number;
  uk_summary?: string;
  de_summary?: string;
}

export interface UserNewsState {
  userId?: string; // Tracks ownership of the state
  visibleFeed: number[]; // IDs of 6 visible items
  pool: number[];        // IDs of pool items
  history: {
    shown: number[];
    archived: number[];
    deleted: number[];
  };
  signals: Record<NewsType, {
    openRate: number;
    timeSpent: number;
  }>;
  location?: {  // Tracks explicit user location preference for Push/Feed
    city?: string;
    land?: string;
  };
  lastActionDate: string; // YYYY-MM-DD
  userState: 'BASELINE' | 'ACTIVE_READER' | 'SELECTIVE_READER' | 'PASSIVE_READER' | 'RETURNING_USER';
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

