/**
 * Supabase Client for Server-Side Scripts (Node.js)
 * 
 * Uses process.env instead of import.meta.env for compatibility with tsx/node
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load .env file
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase credentials. Check .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
