'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, type RoomStats } from '@/lib/supabase';

export default function RoomLeaderboard() {
  const router = useRouter();
  const [roomStats, setRoomStats] = useState<RoomStats[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    loadRoomStats();

    // Refresh stats every 10 seconds
    const interval = setInterval(loadRoomStats, 10000);

    // Subscribe to real-time updates for room activity
    const channel = supabase
      .channel('room-activity')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        if (mountedRef.current) {
          loadRoomStats();
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        if (mountedRef.current) {
          loadRoomStats();
        }
      })
      .subscribe();

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const loadRoomStats = async () => {
    try {
      // Get all rooms
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('id, name, vaporize_count, created_at');

      if (roomsError) throw roomsError;

      if (!rooms || rooms.length === 0) {
        setRoomStats([]);
        setLoading(false);
        return;
      }

      // Calculate stats for each room
      const statsPromises = rooms.map(async (room) => {
        // Get messages from last minute for MPM calculation
        const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
        const { data: recentMessages, error: messagesError } = await supabase
          .from('messages')
          .select('id, created_at, user_name')
          .eq('room_id', room.id)
          .gte('created_at', oneMinuteAgo);

        if (messagesError) throw messagesError;

        // Count unique users (active users are those who sent a message in last minute)
        const uniqueUsers = new Set(recentMessages?.map(m => m.user_name) || []);
        const activeUsers = uniqueUsers.size;

        // Messages per minute
        const messagesPerMinute = recentMessages?.length || 0;

        // Get the most recent message timestamp for sorting
        const { data: latestMessage } = await supabase
          .from('messages')
          .select('created_at')
          .eq('room_id', room.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          id: room.id,
          name: room.name,
          active_users: activeUsers,
          messages_per_minute: messagesPerMinute,
          vaporize_count: room.vaporize_count || 0,
          recent_activity: latestMessage?.created_at || room.created_at,
        } as RoomStats;
      });

      const stats = await Promise.all(statsPromises);

      // Sort by messages per minute (descending), then by active users
      const sortedStats = stats
        .sort((a, b) => {
          if (b.messages_per_minute !== a.messages_per_minute) {
            return b.messages_per_minute - a.messages_per_minute;
          }
          if (b.active_users !== a.active_users) {
            return b.active_users - a.active_users;
          }
          return new Date(b.recent_activity).getTime() - new Date(a.recent_activity).getTime();
        })
        .slice(0, 10); // Top 10

      if (mountedRef.current) {
        setRoomStats(sortedStats);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error loading room stats:', err);
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleRoomClick = (roomId: string) => {
    // Note: Users still need to know the password to join
    // This just shows the stats, actual joining requires password
    console.log(`Room ${roomId} clicked`);
  };

  if (loading) {
    return (
      <div className="bg-charcoal border-2 border-gray/30 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-center">
          <span className="text-accent-lime">🔥 Hottest Rooms</span>
        </h2>
        <div className="text-center text-gray py-8">Loading stats...</div>
      </div>
    );
  }

  if (roomStats.length === 0) {
    return (
      <div className="bg-charcoal border-2 border-gray/30 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-center">
          <span className="text-accent-lime">🔥 Hottest Rooms</span>
        </h2>
        <div className="text-center text-gray py-8">No active rooms yet. Be the first to create one!</div>
      </div>
    );
  }

  return (
    <div className="bg-charcoal border-2 border-gray/30 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-center">
        <span className="text-accent-lime">🔥 Hottest Rooms</span>
      </h2>
      <div className="text-xs text-gray text-center mb-4">Updates every 10 seconds</div>

      <div className="space-y-2">
        {/* Header Row */}
        <div className="grid grid-cols-[auto_2fr_1fr_1fr_1fr] gap-4 px-4 py-2 text-xs font-semibold text-gray border-b border-gray/30">
          <div className="text-center">#</div>
          <div>Room Name</div>
          <div className="text-center">👥 Active</div>
          <div className="text-center">💬 MSG/Min</div>
          <div className="text-center">💥 Vaporized</div>
        </div>

        {/* Data Rows */}
        {roomStats.map((room, index) => {
          // Determine medal/rank styling
          const rankColors = [
            'text-accent-lime', // 1st - Lime
            'text-accent-cyan', // 2nd - Cyan
            'text-accent-magenta', // 3rd - Magenta
          ];
          const rankColor = index < 3 ? rankColors[index] : 'text-gray';
          const rankBg = index < 3 ? 'bg-gray/10' : '';
          const rankSize = index === 0 ? 'text-lg' : index === 1 ? 'text-base' : 'text-sm';

          return (
            <div
              key={room.id}
              className={`grid grid-cols-[auto_2fr_1fr_1fr_1fr] gap-4 px-4 py-3 rounded-lg hover:bg-gray/10 transition-all cursor-pointer border-2 border-transparent hover:border-accent-magenta/30 ${rankBg}`}
              onClick={() => handleRoomClick(room.id)}
            >
              <div className={`text-center font-bold ${rankColor} ${rankSize} flex items-center justify-center`}>
                {index + 1}
              </div>
              <div className={`font-semibold truncate flex items-center ${rankColor}`}>
                {room.name}
              </div>
              <div className="text-center flex items-center justify-center">
                <span className={`${room.active_users > 0 ? 'text-accent-cyan font-bold' : 'text-gray'}`}>
                  {room.active_users}
                </span>
              </div>
              <div className="text-center flex items-center justify-center">
                <span className={`${room.messages_per_minute > 0 ? 'text-accent-magenta font-bold' : 'text-gray'}`}>
                  {room.messages_per_minute}
                </span>
              </div>
              <div className="text-center flex items-center justify-center">
                <span className={`${room.vaporize_count > 0 ? 'text-accent-orange font-bold' : 'text-gray'}`}>
                  {room.vaporize_count}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-gray text-center">
        Click on a room name above, then use "Join a Room" to enter
      </div>
    </div>
  );
}
