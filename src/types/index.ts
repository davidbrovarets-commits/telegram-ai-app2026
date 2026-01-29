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
  title: string;
  date?: string;
  created_at?: string;
  region: string;
  image_url?: string;
  image?: string;
  content: string;
  link?: string;
  type?: 'news';
}

export interface UserData {
  id: string;
  email: string;
  username: string;
  land: string;
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

export type Theme = 'light' | 'dark' | 'neutral';
export type View = 'login' | 'register' | 'recovery' | 'app';
export type TabType = 'home' | 'tasks' | 'portfolio' | 'news' | 'menu';
