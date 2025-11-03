# Database Migration Guide

## Adding vaporize_count to existing database

If you already have a Supabase database set up, you need to add the `vaporize_count` column to the `rooms` table.

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the following SQL:

```sql
-- Add vaporize_count column to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS vaporize_count INTEGER DEFAULT 0;

-- Add update policy for rooms (if not already exists)
CREATE POLICY IF NOT EXISTS "Enable update access for all users" ON rooms FOR UPDATE USING (true);
```

### Option 2: Using the Full Schema

If you're setting up a fresh database, simply run the entire `supabase-schema.sql` file which includes the `vaporize_count` column.

### Verify the Migration

After running the migration, verify it worked by checking your rooms table:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'rooms';
```

You should see `vaporize_count` listed with type `integer` and default value `0`.

## What does vaporize_count track?

This column tracks how many times the chat history has been vaporized (cleared) in each room. It increments every time:
- Someone clicks "Vaporize History"
- Someone clicks "Exit Room" (which also clears history)

This stat is displayed on the home page leaderboard showing the hottest rooms.
