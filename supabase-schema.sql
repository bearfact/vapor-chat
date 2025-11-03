-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS messages_room_id_idx ON messages(room_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);

-- Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since any user can create/join rooms)
CREATE POLICY "Enable read access for all users" ON rooms FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable delete access for all users" ON rooms FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON messages FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable delete access for all users" ON messages FOR DELETE USING (true);
