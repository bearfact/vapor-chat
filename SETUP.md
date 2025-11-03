# VaporChat Setup Instructions

## Quick Setup

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for the project to be fully provisioned

### 2. Run the Database Schema

1. In your Supabase project dashboard, go to the SQL Editor
2. Copy the contents of `supabase-schema.sql` from this project
3. Paste it into the SQL Editor and click "Run"
4. Verify that the `rooms` and `messages` tables were created successfully

### 2.5. Enable Realtime (CRITICAL - Required for real-time chat!)

**Without this step, messages will only appear for the sender, not other users!**

1. In your Supabase project dashboard, click on **Database** in the left sidebar
2. Click on **Replication**
3. Find the `messages` table in the list (you may need to scroll)
4. Click the toggle switch next to `messages` to **enable** replication
5. You should see "Source: messages" with a green checkmark
6. Wait 10-15 seconds for the change to take effect

This enables real-time subscriptions so messages appear instantly for all users in the room.

### 3. Get Your Supabase Credentials

1. In your Supabase project, go to Settings > API
2. Copy your **Project URL** (e.g., `https://xxxxx.supabase.co`)
3. Copy your **anon/public key** (the long string under "Project API keys")

### 4. Configure Environment Variables

1. Open the `.env.local` file in this project
2. Replace the placeholder values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Start the Application

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Testing the Application

### Test Creating a Room

1. Click "Create a Room" tab in the navbar
2. Enter a room name (e.g., "test-room")
3. Enter a password (e.g., "password123")
4. Enter your display name (e.g., "Alice")
5. Click "Create"

### Test Joining a Room

1. Open a new browser window or incognito tab
2. Click "Join a Room" tab
3. Enter the same room name ("test-room")
4. Enter the same password ("password123")
5. Enter a different display name (e.g., "Bob")
6. Click "Join"

### Test Chat Features

- Send messages between the two browser windows
- Try the "Vaporize History" button to clear all messages
- Try the "Exit Room" button to leave and delete the room

## Troubleshooting

### Error: "Invalid supabaseUrl"

Make sure your `.env.local` file has valid Supabase credentials. The URL should start with `https://` and the anon key should be a long string.

### Messages Not Appearing in Real-Time

This is the most common issue. Follow these steps:

1. **Enable Realtime Replication:**
   - Go to Database > Replication in your Supabase dashboard
   - Enable replication for the `messages` table
   - Wait a few seconds for it to take effect

2. **Check Realtime Status:**
   - Open your browser's Developer Console (F12)
   - Look for a message like "Realtime subscription status: SUBSCRIBED"
   - If you see "SUBSCRIPTION_ERROR", realtime is not properly configured

3. **Verify Your Messages Still Work:**
   - Even without realtime, your own messages should appear immediately
   - Other users' messages will appear after a page refresh
   - Once realtime is enabled, all messages will appear instantly

4. **Check Supabase Logs:**
   - Go to Logs > Realtime in your Supabase dashboard
   - Look for any connection or subscription errors

### Room Already Exists Error

Room names are unique. Try using a different room name or delete the existing room from the Supabase dashboard.

## Next Steps

Once everything is working:

1. Customize the visual design further
2. Add additional features (e.g., typing indicators, user list)
3. Deploy to Vercel (automatically detects Next.js projects)
4. Add your Supabase environment variables in Vercel's project settings
