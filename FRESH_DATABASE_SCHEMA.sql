-- ============================================================================
-- VIBEX PRODUCTION DATABASE - ALIGNED WITH FRONTEND v2
-- ============================================================================
-- Version: 2.0 (Frontend-Backend Aligned)
-- Updated: 2025-11-27
-- 
-- INSTRUCTIONS:
-- 1. Go to your Supabase project: https://pnfxxaryrtpxtmoeujqo.supabase.co
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Click "New Query"
-- 4. Paste this ENTIRE file and click "Run"
-- 5. Wait for "Success" message
-- 6. Your database is ready!
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- TABLES
-- ============================================================================

-- 1. PROFILES (extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL CHECK (char_length(username) >= 3 AND char_length(username) <= 20),
    full_name TEXT,
    bio TEXT DEFAULT '' CHECK (char_length(bio) <= 300),
    branch TEXT DEFAULT 'Computer Science',
    year INTEGER DEFAULT 1 CHECK (year >= 1 AND year <= 5),
    expertise TEXT[] DEFAULT '{}',
    interests TEXT[] DEFAULT '{}',
    cookie_score INTEGER NOT NULL DEFAULT 0 CHECK (cookie_score >= 0),
    skill_scores JSONB DEFAULT '{}'::jsonb,
    privacy TEXT DEFAULT 'public' CHECK (privacy IN ('public', 'friends', 'private')),
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. SESSIONS (all 4 types: vibe, help, cookie, query)
CREATE TABLE public.sessions (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 100),
    description TEXT DEFAULT '' CHECK (char_length(description) <= 500),
    lat DOUBLE PRECISION NOT NULL CHECK (lat >= -90 AND lat <= 90),
    lng DOUBLE PRECISION NOT NULL CHECK (lng >= -180 AND lng <= 180),
    session_type TEXT NOT NULL CHECK (session_type IN ('vibe', 'help', 'cookie', 'query')),
    emoji TEXT NOT NULL DEFAULT '🎉',
    event_time TIMESTAMPTZ NOT NULL,
    duration INTEGER NOT NULL DEFAULT 60 CHECK (duration > 0 AND duration <= 480),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('scheduled', 'active', 'closed')),
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    privacy TEXT NOT NULL DEFAULT 'public' CHECK (privacy IN ('public', 'private')),
    visible_to_tags UUID[] DEFAULT '{}',
    gender_filter TEXT CHECK (gender_filter IN ('all', 'same_only')) DEFAULT 'all',
    
    -- Help session fields
    help_category TEXT CHECK (help_category IN ('Academic', 'Project', 'Tech', 'General')),
    flow TEXT CHECK (flow IN ('seeking', 'offering')),
    
    -- Cookie session fields
    skill_tag TEXT,
    
    -- Query session fields
    return_time TIMESTAMPTZ,
    
    -- Owner tracking
    current_owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. SESSION PARTICIPANTS (join table for many-to-many)
CREATE TABLE public.session_participants (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('creator', 'participant', 'seeking', 'offering')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(session_id, user_id)
);

-- 4. SESSION MESSAGES
CREATE TABLE public.session_messages (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    text TEXT NOT NULL CHECK (char_length(text) > 0 AND char_length(text) <= 280),
    is_premade BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. FRIENDSHIPS (bidirectional)
CREATE TABLE public.friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_id_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id_1, user_id_2),
    CHECK (user_id_1 < user_id_2) -- Ensure user_id_1 is always smaller for consistency
);

-- 6. FRIEND REQUESTS
CREATE TABLE public.friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(from_user_id, to_user_id),
    CHECK (from_user_id <> to_user_id)
);

-- 7. TAGS (custom friend groups)
CREATE TABLE public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 50),
    color TEXT NOT NULL DEFAULT 'blue',
    emoji TEXT DEFAULT '🏷️',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. TAG MEMBERS
CREATE TABLE public.tag_members (
    id BIGSERIAL PRIMARY KEY,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tag_id, user_id)
);

-- 9. CONVERSATIONS (DM threads)
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    participant_2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(participant_1_id, participant_2_id),
    CHECK (participant_1_id < participant_2_id)
);

-- 10. DIRECT MESSAGES
CREATE TABLE public.direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    text TEXT NOT NULL CHECK (char_length(text) > 0 AND char_length(text) <= 100),
    is_premade BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. NOTIFICATIONS
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'session_invite',
        'friend_request_received',
        'friend_request_accepted',
        'session_join',
        'session_starting_soon',
        'session_ending_soon',
        'tag_add',
        'ownership_transfer',
        'vouch_received'
    )),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    session_id BIGINT REFERENCES public.sessions(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    message TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. VOUCHES (Cookie Score system)
CREATE TABLE public.vouches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id BIGINT REFERENCES public.sessions(id) ON DELETE SET NULL,
    skill TEXT NOT NULL,
    points INTEGER NOT NULL CHECK (points > 0 AND points <= 10),
    vouch_number INTEGER NOT NULL CHECK (vouch_number >= 1 AND vouch_number <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (voucher_id <> receiver_id)
);

-- 13. RECENT EMOJIS (per user)
CREATE TABLE public.recent_emojis (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    last_used TIMESTAMPTZ NOT NULL DEFAULT now(),
    use_count INTEGER NOT NULL DEFAULT 1,
    UNIQUE(user_id, emoji)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Profiles
CREATE INDEX idx_profiles_username_trgm ON public.profiles USING gin (username gin_trgm_ops);
CREATE INDEX idx_profiles_cookie_score ON public.profiles(cookie_score DESC);

-- Sessions
CREATE INDEX idx_sessions_status ON public.sessions(status);
CREATE INDEX idx_sessions_creator ON public.sessions(creator_id);
CREATE INDEX idx_sessions_event_time ON public.sessions(event_time DESC);
CREATE INDEX idx_sessions_type_status ON public.sessions(session_type, status);
CREATE INDEX idx_sessions_active ON public.sessions(status, event_time) WHERE status = 'active';
CREATE INDEX idx_sessions_visible_tags ON public.sessions USING gin (visible_to_tags);

-- Session participants
CREATE INDEX idx_session_participants_session ON public.session_participants(session_id);
CREATE INDEX idx_session_participants_user ON public.session_participants(user_id);
CREATE INDEX idx_session_participants_role ON public.session_participants(session_id, role);

-- Session messages
CREATE INDEX idx_session_messages_session ON public.session_messages(session_id);
CREATE INDEX idx_session_messages_created ON public.session_messages(session_id, created_at);

-- Friendships
CREATE INDEX idx_friendships_user1 ON public.friendships(user_id_1);
CREATE INDEX idx_friendships_user2 ON public.friendships(user_id_2);

-- Friend requests
CREATE INDEX idx_friend_requests_from ON public.friend_requests(from_user_id);
CREATE INDEX idx_friend_requests_to ON public.friend_requests(to_user_id);
CREATE INDEX idx_friend_requests_status ON public.friend_requests(status);

-- Tags
CREATE INDEX idx_tags_creator ON public.tags(creator_id);

-- Tag members
CREATE INDEX idx_tag_members_tag ON public.tag_members(tag_id);
CREATE INDEX idx_tag_members_user ON public.tag_members(user_id);

-- Conversations
CREATE INDEX idx_conversations_participant1 ON public.conversations(participant_1_id);
CREATE INDEX idx_conversations_participant2 ON public.conversations(participant_2_id);
CREATE INDEX idx_conversations_updated ON public.conversations(updated_at DESC);

-- Direct messages
CREATE INDEX idx_direct_messages_conversation ON public.direct_messages(conversation_id);
CREATE INDEX idx_direct_messages_created ON public.direct_messages(conversation_id, created_at DESC);

-- Notifications
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX idx_notifications_unread ON public.notifications(recipient_id, is_read, created_at DESC) WHERE is_read = false;

-- Vouches
CREATE INDEX idx_vouches_receiver ON public.vouches(receiver_id);
CREATE INDEX idx_vouches_voucher ON public.vouches(voucher_id);
CREATE INDEX idx_vouches_skill ON public.vouches(receiver_id, skill);
CREATE INDEX idx_vouches_session ON public.vouches(session_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- 1. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- 2. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_username TEXT;
    v_counter INTEGER := 0;
BEGIN
    v_username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        'user_' || LEFT(NEW.id::text, 8)
    );
    
    LOOP
        BEGIN
            INSERT INTO public.profiles (id, username, bio, privacy)
            VALUES (
                NEW.id,
                CASE WHEN v_counter = 0 THEN v_username ELSE v_username || '_' || v_counter END,
                COALESCE(NEW.raw_user_meta_data->>'bio', ''),
                'public'
            );
            EXIT;
        EXCEPTION WHEN unique_violation THEN
            v_counter := v_counter + 1;
            IF v_counter > 100 THEN
                RAISE EXCEPTION 'Could not create unique username';
            END IF;
        END;
    END LOOP;
    
    RETURN NEW;
END;
$$;

-- 3. Update conversation timestamp on new message
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.conversations
    SET updated_at = now()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$;

-- 4. Get or create conversation
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
    user_id_1 UUID,
    user_id_2 UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conversation_id UUID;
    v_participant_1 UUID;
    v_participant_2 UUID;
BEGIN
    -- Ensure consistent ordering
    IF user_id_1 < user_id_2 THEN
        v_participant_1 := user_id_1;
        v_participant_2 := user_id_2;
    ELSE
        v_participant_1 := user_id_2;
        v_participant_2 := user_id_1;
    END IF;
    
    -- Try to find existing conversation
    SELECT id INTO v_conversation_id
    FROM public.conversations
    WHERE participant_1_id = v_participant_1 AND participant_2_id = v_participant_2;
    
    -- Create if not found
    IF NOT FOUND THEN
        INSERT INTO public.conversations (participant_1_id, participant_2_id)
        VALUES (v_participant_1, v_participant_2)
        RETURNING id INTO v_conversation_id;
    END IF;
    
    RETURN v_conversation_id;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_sessions_updated_at
    BEFORE UPDATE ON public.sessions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_friend_requests_updated_at
    BEFORE UPDATE ON public.friend_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_tags_updated_at
    BEFORE UPDATE ON public.tags
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_conversation_on_message
    AFTER INSERT ON public.direct_messages
    FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent_emojis ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Sessions
CREATE POLICY "Sessions viewable by everyone" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Users can create sessions" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update sessions" ON public.sessions FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete sessions" ON public.sessions FOR DELETE USING (auth.uid() = creator_id);

-- Session participants
CREATE POLICY "Participants viewable by everyone" ON public.session_participants FOR SELECT USING (true);
CREATE POLICY "Users can join sessions" ON public.session_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave sessions" ON public.session_participants FOR DELETE USING (auth.uid() = user_id);

-- Session messages
CREATE POLICY "Participants can view messages" ON public.session_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.session_participants sp WHERE sp.session_id = session_messages.session_id AND sp.user_id = auth.uid())
);
CREATE POLICY "Participants can send messages" ON public.session_messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.session_participants sp WHERE sp.session_id = session_messages.session_id AND sp.user_id = auth.uid())
);

-- Friendships
CREATE POLICY "Users can view friendships" ON public.friendships FOR SELECT USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);
CREATE POLICY "Users can create friendships" ON public.friendships FOR INSERT WITH CHECK (auth.uid() = user_id_1 OR auth.uid() = user_id_2);
CREATE POLICY "Users can delete friendships" ON public.friendships FOR DELETE USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Friend requests
CREATE POLICY "Users can view their requests" ON public.friend_requests FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Users can send requests" ON public.friend_requests FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Users can update requests" ON public.friend_requests FOR UPDATE USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);
CREATE POLICY "Users can delete requests" ON public.friend_requests FOR DELETE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Tags
CREATE POLICY "Users can view own tags" ON public.tags FOR SELECT USING (
    auth.uid() = creator_id OR 
    EXISTS (SELECT 1 FROM public.tag_members tm WHERE tm.tag_id = tags.id AND tm.user_id = auth.uid())
);
CREATE POLICY "Users can create tags" ON public.tags FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update tags" ON public.tags FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete tags" ON public.tags FOR DELETE USING (auth.uid() = creator_id);

-- Tag members
CREATE POLICY "Users can view tag members" ON public.tag_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tags t WHERE t.id = tag_members.tag_id AND (t.creator_id = auth.uid() OR tag_members.user_id = auth.uid()))
);
CREATE POLICY "Tag creators can add members" ON public.tag_members FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.tags t WHERE t.id = tag_id AND t.creator_id = auth.uid())
);
CREATE POLICY "Tag creators can remove members" ON public.tag_members FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.tags t WHERE t.id = tag_id AND t.creator_id = auth.uid())
);

-- Conversations
CREATE POLICY "Users can view their conversations" ON public.conversations FOR SELECT USING (
    auth.uid() = participant_1_id OR auth.uid() = participant_2_id
);
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (
    auth.uid() = participant_1_id OR auth.uid() = participant_2_id
);

-- Direct messages
CREATE POLICY "Users can view their messages" ON public.direct_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid()))
);
CREATE POLICY "Users can send messages" ON public.direct_messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid()))
);

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = recipient_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = recipient_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = recipient_id);

-- Vouches
CREATE POLICY "Users can view vouches they're involved in" ON public.vouches FOR SELECT USING (auth.uid() = voucher_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can create vouches" ON public.vouches FOR INSERT WITH CHECK (auth.uid() = voucher_id);

-- Recent emojis
CREATE POLICY "Users can view own emojis" ON public.recent_emojis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own emojis" ON public.recent_emojis FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own emojis" ON public.recent_emojis FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own emojis" ON public.recent_emojis FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- ENABLE REALTIME
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vouches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tags;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tag_members;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_conversation_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(UUID, UUID) TO authenticated;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================

SELECT 'vibeX Database Setup Complete! ✅' as status, now() as completed_at;
