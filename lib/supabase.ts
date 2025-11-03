import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Message = {
  id: string;
  room_id: string;
  user_name: string;
  message: string;
  created_at: string;
};

export type Room = {
  id: string;
  name: string;
  password: string;
  created_at: string;
  vaporize_count?: number;
};

export type RoomStats = {
  id: string;
  name: string;
  active_users: number;
  messages_per_minute: number;
  vaporize_count: number;
  recent_activity: string;
};
