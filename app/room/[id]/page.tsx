'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { supabase, type Message } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Dialog from '@/components/Dialog';
import VaporizeEffect from '@/components/VaporizeEffect';

export default function ChatRoom() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = params.id as string;
  const displayName = searchParams.get('displayName') || 'Anonymous';
  const [roomName, setRoomName] = useState<string>('Loading...');

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  // User color mapping - maintains consistent colors for each user
  const userColorsRef = useRef<Map<string, number>>(new Map());

  // Color configurations with full Tailwind class names for JIT compilation
  const colorConfigs = [
    {
      bg: 'bg-accent-cyan/20',
      border: 'border-accent-cyan/40',
      text: 'text-accent-cyan',
    },
    {
      bg: 'bg-accent-magenta/20',
      border: 'border-accent-magenta/40',
      text: 'text-accent-magenta',
    },
    {
      bg: 'bg-accent-lime/20',
      border: 'border-accent-lime/40',
      text: 'text-accent-lime',
    },
    {
      bg: 'bg-accent-orange/20',
      border: 'border-accent-orange/40',
      text: 'text-accent-orange',
    },
  ];

  // Function to get or assign a color index to a user
  const getUserColorIndex = (userName: string): number => {
    if (!userColorsRef.current.has(userName)) {
      // Assign color based on the number of users we've seen
      const colorIndex = userColorsRef.current.size % colorConfigs.length;
      userColorsRef.current.set(userName, colorIndex);
    }
    return userColorsRef.current.get(userName)!;
  };

  // Dialog state
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm';
    title?: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'alert',
    message: '',
  });

  // Vaporize effect state
  const [isVaporizing, setIsVaporizing] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load room name and initial messages
  useEffect(() => {
    mountedRef.current = true;

    const loadRoomData = async () => {
      try {
        // Get room name
        const { data: room } = await supabase
          .from('rooms')
          .select('name')
          .eq('id', roomId)
          .single();

        if (room && mountedRef.current) {
          setRoomName(room.name);
        }

        // Get messages
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('room_id', roomId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        if (mountedRef.current) {
          setMessages(data || []);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadRoomData();

    // Subscribe to new messages
    console.log('Setting up realtime subscription for room:', roomId);
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (!mountedRef.current) return;
          console.log('Received new message via realtime:', payload);
          const newMsg = payload.new as Message;
          setMessages((current) => {
            // Check if message already exists to avoid duplicates
            const exists = current.some(msg => msg.id === newMsg.id);
            if (exists) {
              console.log('Message already exists, skipping');
              return current;
            }
            console.log('Adding new message to state');
            return [...current, newMsg];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (!mountedRef.current) return;
          console.log('DELETE event received:', payload);
          // Reload all messages to ensure consistency
          loadMessages();
        }
      )
      .on('broadcast', { event: 'clear_history' }, () => {
        if (!mountedRef.current) return;
        console.log('Broadcast: clear_history received');
        setMessages([]);
      })
      .on('broadcast', { event: 'vaporize_effect' }, () => {
        if (!mountedRef.current) return;
        console.log('Broadcast: vaporize_effect received');
        setIsVaporizing(true);
      })
      .subscribe((status) => {
        if (!mountedRef.current) return;
        console.log('Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to realtime updates!');
          setRealtimeStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error('❌ Realtime subscription failed:', status);

          if (status === 'CLOSED') {
            console.error('');
            console.error('CLOSED error usually means:');
            console.error('1. Supabase credentials are not configured in .env.local');
            console.error('2. The credentials are invalid');
            console.error('');
            console.error('To fix this:');
            console.error('1. Check .env.local has valid NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
            console.error('2. Restart the dev server after updating .env.local');
            console.error('3. See SETUP.md for detailed instructions');
          } else {
            console.error('Make sure Realtime Replication is enabled in Supabase Dashboard:');
            console.error('Database > Replication > Enable for "messages" table');
          }

          setRealtimeStatus('error');
        }
      });

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // Update loadMessages function for reload
  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (mountedRef.current) {
        setMessages(data || []);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      const { error } = await supabase.from('messages').insert([
        {
          room_id: roomId,
          user_name: displayName,
          message: messageText,
        },
      ]);

      if (error) throw error;

      // Don't add to local state - let the real-time subscription handle it
      // This ensures all users see messages in the same way
      console.log('Message sent successfully');
    } catch (err) {
      console.error('Error sending message:', err);
      setDialogState({
        isOpen: true,
        type: 'alert',
        title: 'Error',
        message: 'Failed to send message. Please check your Supabase configuration.',
      });
      // Restore the message if send failed
      setNewMessage(messageText);
    }
  };

  const handleClearHistoryConfirm = () => {
    setDialogState({
      isOpen: true,
      type: 'confirm',
      title: 'Clear History',
      message: 'Are you sure you want to clear all chat history? This cannot be undone.',
      onConfirm: handleClearHistory,
    });
  };

  const handleClearHistory = async () => {
    try {
      // Start glitch effect first
      setIsGlitching(true);
      await new Promise(resolve => setTimeout(resolve, 200));

      // Start screen shake
      setIsShaking(true);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Broadcast vaporize effect to all users in the room
      try {
        await supabase
          .channel(`room:${roomId}`)
          .send({
            type: 'broadcast',
            event: 'vaporize_effect',
            payload: {},
          });
        console.log('Vaporize effect broadcast sent');
      } catch (broadcastErr) {
        console.warn('Failed to broadcast vaporize effect:', broadcastErr);
        // Continue anyway
      }

      // Trigger vaporize effect locally
      setIsVaporizing(true);

      // Wait a moment for the effect to start for all users
      await new Promise(resolve => setTimeout(resolve, 300));

      // Stop shake after effect starts
      setIsShaking(false);

      // Delete all messages from database
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('room_id', roomId);

      if (error) throw error;

      // Increment vaporize counter for the room
      const { data: currentRoom } = await supabase
        .from('rooms')
        .select('vaporize_count')
        .eq('id', roomId)
        .single();

      const currentCount = currentRoom?.vaporize_count || 0;
      await supabase
        .from('rooms')
        .update({ vaporize_count: currentCount + 1 })
        .eq('id', roomId);

      // Broadcast clear event to all users in the room (using the existing channel)
      try {
        await supabase
          .channel(`room:${roomId}`)
          .send({
            type: 'broadcast',
            event: 'clear_history',
            payload: {},
          });
        console.log('Clear history broadcast sent');
      } catch (broadcastErr) {
        console.warn('Failed to broadcast clear event:', broadcastErr);
        // Continue anyway - the DELETE event should trigger a reload
      }

      // Clear local state
      setMessages([]);
      console.log('History cleared successfully');
    } catch (err) {
      console.error('Error clearing history:', err);
      setIsVaporizing(false);
      setIsShaking(false);
      setIsGlitching(false);
      setDialogState({
        isOpen: true,
        type: 'alert',
        title: 'Error',
        message: 'Failed to clear history. Please try again.',
      });
    }
  };

  const handleLeaveRoomConfirm = () => {
    setDialogState({
      isOpen: true,
      type: 'confirm',
      title: 'Leave Room',
      message: 'Leaving the room will clear all chat history for everyone. Are you sure?',
      onConfirm: handleLeaveRoom,
    });
  };

  const handleLeaveRoom = async () => {
    try {
      // Start glitch effect first
      setIsGlitching(true);
      await new Promise(resolve => setTimeout(resolve, 200));

      // Start screen shake
      setIsShaking(true);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Broadcast vaporize effect to all users in the room
      try {
        await supabase
          .channel(`room:${roomId}`)
          .send({
            type: 'broadcast',
            event: 'vaporize_effect',
            payload: {},
          });
        console.log('Vaporize effect broadcast sent');
      } catch (broadcastErr) {
        console.warn('Failed to broadcast vaporize effect:', broadcastErr);
        // Continue anyway
      }

      // Trigger vaporize effect locally
      setIsVaporizing(true);

      // Wait a moment for the effect to start for all users
      await new Promise(resolve => setTimeout(resolve, 300));

      // Stop shake after effect starts
      setIsShaking(false);

      // Delete all messages from database
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('room_id', roomId);

      if (error) throw error;

      // Increment vaporize counter for the room
      const { data: currentRoom } = await supabase
        .from('rooms')
        .select('vaporize_count')
        .eq('id', roomId)
        .single();

      const currentCount = currentRoom?.vaporize_count || 0;
      await supabase
        .from('rooms')
        .update({ vaporize_count: currentCount + 1 })
        .eq('id', roomId);

      // Broadcast clear event to all remaining users in the room
      try {
        await supabase
          .channel(`room:${roomId}`)
          .send({
            type: 'broadcast',
            event: 'clear_history',
            payload: {},
          });
        console.log('Leave room broadcast sent');
      } catch (broadcastErr) {
        console.warn('Failed to broadcast leave event:', broadcastErr);
        // Continue anyway - the DELETE event should trigger a reload
      }

      console.log('Left room successfully');

      // Wait for the vaporize effect to complete before navigating
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Navigate back to home
      router.push('/');
    } catch (err) {
      console.error('Error leaving room:', err);
      setIsVaporizing(false);
      setIsShaking(false);
      setIsGlitching(false);
      router.push('/');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar showTabs={false} />
        <main className="flex-1">
          <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
            <div className="text-accent-magenta text-xl">Loading chat room...</div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-5px, -5px) rotate(-1deg); }
          20% { transform: translate(5px, 5px) rotate(1deg); }
          30% { transform: translate(-5px, 5px) rotate(-1deg); }
          40% { transform: translate(5px, -5px) rotate(1deg); }
          50% { transform: translate(-3px, 3px) rotate(-0.5deg); }
          60% { transform: translate(3px, -3px) rotate(0.5deg); }
          70% { transform: translate(-3px, -3px) rotate(-0.5deg); }
          80% { transform: translate(3px, 3px) rotate(0.5deg); }
          90% { transform: translate(-2px, 2px) rotate(-0.25deg); }
        }

        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }

        .shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both infinite;
        }

        .glitch {
          animation: glitch 0.1s infinite;
          filter: contrast(1.2) saturate(1.5);
        }
      `}</style>
      <Navbar showTabs={false} />
      <main className={`flex-1 flex flex-col ${isShaking ? 'shake' : ''}`}>
        <div className="max-w-5xl mx-auto px-4 py-6 flex-1 flex flex-col w-full">
          {/* Header with Room Name */}
          <div className="bg-charcoal border-2 border-gray/30 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">
                <span className="text-accent-cyan">You Are Now in Room:</span>{' '}
                <span className="text-accent-lime">{roomName}</span>
              </h1>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  realtimeStatus === 'connected' ? 'bg-accent-lime animate-pulse' :
                  realtimeStatus === 'error' ? 'bg-accent-orange' :
                  'bg-gray animate-pulse'
                }`}></div>
                <span className={`text-xs ${
                  realtimeStatus === 'connected' ? 'text-accent-lime' :
                  realtimeStatus === 'error' ? 'text-accent-orange' :
                  'text-gray'
                }`}>
                  {realtimeStatus === 'connected' ? 'Live' :
                   realtimeStatus === 'error' ? 'Offline' :
                   'Connecting...'}
                </span>
              </div>
            </div>
            {realtimeStatus === 'error' && (
              <div className="mt-2 text-xs text-accent-orange">
                ⚠️ Real-time updates disabled. Check console (F12) for setup instructions.
              </div>
            )}
          </div>

          {/* Messages Container */}
          <div className={`flex-1 bg-charcoal border-2 border-gray/30 rounded-lg overflow-hidden flex flex-col min-h-0 transition-opacity duration-500 ${isVaporizing ? 'opacity-0' : 'opacity-100'} ${isGlitching ? 'glitch' : ''}`}>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray text-center">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const colorIndex = getUserColorIndex(msg.user_name);
                  const colors = colorConfigs[colorIndex];
                  return (
                    <div key={msg.id} className="space-y-1">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div
                            className={`rounded-lg px-4 py-3 ${colors.bg} border-2 ${colors.border}`}
                          >
                            <p className="text-sm font-bold mb-1">
                              <span className={colors.text}>
                                {msg.user_name}:
                              </span>
                            </p>
                            <p className="text-foreground break-words">{msg.message}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="mt-4">
            <div className="bg-charcoal border-2 border-gray/30 rounded-lg p-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="..."
                className="w-full px-4 py-3 bg-background border-2 border-gray/30 rounded-lg focus:outline-none focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20 text-foreground transition-all mb-4"
              />
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleLeaveRoomConfirm}
                  type="button"
                  className="px-6 py-2 bg-background border-2 border-gray/30 hover:border-accent-magenta/50 text-foreground rounded-lg font-semibold transition-all duration-300"
                >
                  Exit Room
                </button>
                <button
                  onClick={handleClearHistoryConfirm}
                  type="button"
                  className="px-6 py-2 bg-background border-2 border-gray/30 hover:border-accent-orange/50 text-foreground rounded-lg font-semibold transition-all duration-300"
                >
                  Vaporize History
                </button>
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-6 py-2 bg-accent-magenta hover:bg-accent-magenta/90 disabled:bg-gray/20 disabled:text-gray/50 disabled:cursor-not-allowed text-background font-bold rounded-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,31,240,0.5)]"
                >
                  Send Message
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
      <Dialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ ...dialogState, isOpen: false })}
        onConfirm={dialogState.onConfirm}
        title={dialogState.title}
        message={dialogState.message}
        type={dialogState.type}
      />
      <VaporizeEffect
        isActive={isVaporizing}
        onComplete={() => {
          setIsVaporizing(false);
          setIsGlitching(false);
        }}
      />
    </>
  );
}
