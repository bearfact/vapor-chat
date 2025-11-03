'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import RoomLeaderboard from '@/components/RoomLeaderboard';

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [roomName, setRoomName] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check if room already exists
      const { data: existingRoom } = await supabase
        .from('rooms')
        .select('id')
        .eq('name', roomName)
        .single();

      if (existingRoom) {
        setError('Room name already exists. Please choose another name.');
        setLoading(false);
        return;
      }

      // Create new room
      const { data: newRoom, error: createError } = await supabase
        .from('rooms')
        .insert([{ name: roomName, password: roomPassword }])
        .select()
        .single();

      if (createError) throw createError;

      // Navigate to chat room
      router.push(`/room/${newRoom.id}?displayName=${encodeURIComponent(displayName)}`);
    } catch (err) {
      setError('Failed to create room. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Find room by name and password
      const { data: room, error: findError } = await supabase
        .from('rooms')
        .select('id, password')
        .eq('name', roomName)
        .single();

      if (findError || !room) {
        setError('Room not found. Please check the room name.');
        setLoading(false);
        return;
      }

      if (room.password !== roomPassword) {
        setError('Incorrect password.');
        setLoading(false);
        return;
      }

      // Navigate to chat room
      router.push(`/room/${room.id}?displayName=${encodeURIComponent(displayName)}`);
    } catch (err) {
      setError('Failed to join room. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar mode={mode} onModeChange={setMode} showTabs={true} />
      <main className="flex-1">
        <div className="min-h-[calc(100vh-8rem)] px-4 py-12">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Leaderboard Section */}
            <div className="order-2 lg:order-1">
              <RoomLeaderboard />
            </div>

            {/* Create/Join Form Section */}
            <div className="order-1 lg:order-2 lg:sticky lg:top-8">
              <div className="max-w-md w-full mx-auto">
            <div className="bg-charcoal border-2 border-gray/30 rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-6 text-center">
                {mode === 'create' ? (
                  <span className="text-accent-magenta">Create a Room</span>
                ) : (
                  <span className="text-accent-cyan">Join a Room</span>
                )}
              </h2>

              <form onSubmit={mode === 'create' ? handleCreateRoom : handleJoinRoom} className="space-y-5">
                <div>
                  <label htmlFor="roomName" className="block text-sm font-medium text-gray mb-2">
                    Specify Room Name
                  </label>
                  <input
                    type="text"
                    id="roomName"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full px-4 py-3 bg-background border-2 border-gray/30 rounded-lg focus:outline-none focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20 text-foreground transition-all"
                    placeholder="Specify Room Name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="roomPassword" className="block text-sm font-medium text-gray mb-2">
                    Specify Password
                  </label>
                  <input
                    type="password"
                    id="roomPassword"
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-background border-2 border-gray/30 rounded-lg focus:outline-none focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20 text-foreground transition-all"
                    placeholder="Specify Password"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray mb-2">
                    Specify Your Display Name
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3 bg-background border-2 border-gray/30 rounded-lg focus:outline-none focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20 text-foreground transition-all"
                    placeholder="Specify Your Display Name"
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 bg-accent-orange/10 border border-accent-orange/30 rounded-lg">
                    <p className="text-sm text-accent-orange">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 rounded-lg font-bold transition-all duration-300 ${
                    mode === 'create'
                      ? 'bg-accent-magenta hover:bg-accent-magenta/90 text-background hover:shadow-[0_0_20px_rgba(255,31,240,0.5)]'
                      : 'bg-accent-cyan hover:bg-accent-cyan/90 text-background hover:shadow-[0_0_20px_rgba(0,255,255,0.5)]'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? 'Please wait...' : mode === 'create' ? 'Create' : 'Join'}
                </button>
              </form>
            </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
