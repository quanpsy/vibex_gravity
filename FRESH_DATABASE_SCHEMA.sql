-- ============================================================================
-- VIBEX PRODUCTION DATABASE - FRESH DEPLOYMENT
-- ============================================================================
-- Version: 1.0 (Clean for new Supabase account)
-- Created: 2025-11-26
-- 
-- INSTRUCTIONS:
-- 1. Create a NEW Supabase project
-- 2. Go to SQL Editor
-- 3. Paste this ENTIRE file and run it
-- 4. Copy your project URL and anon key
-- 5. Update lib/supabaseClient.ts with new credentials
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
    bio TEXT DEFAULT '' CHECK (char_length(bio) <= 200),
    branch TEXT DEFAULT 'Computer Science',
    year INTEGER DEFAULT 2025 CHECK (year >= 2020 AND year <= 2035),
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
    title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 50),
    description TEXT DEFAULT '' CHECK (char_length(description) <= 150),
    lat DOUBLE PRECISION NOT NULL CHECK (lat >= -90 AND lat <= 90),
    lng DOUBLE PRECISION NOT NULL CHECK (lng >= -180 AND lng <= 180),
    session_type TEXT NOT NULL CHECK (session_type IN ('vibe', 'help', 'cookie', 'query')),
    emoji TEXT NOT NULL DEFAULT '🎉',
    event_time TIMESTAMPTZ NOT NULL,
    duration INTEGER NOT NULL DEFAULT 60 CHECK (duration > 0 AND duration <= 480),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    participants UUID[] NOT NULL DEFAULT '{}',
    participant_roles JSONB DEFAULT '{}'::jsonb,
    privacy TEXT NOT NULL DEFAULT 'public' CHECK (privacy IN ('public', 'private')),
    visible_to_tags UUID[] DEFAULT '{}',
    gender_filter TEXT CHECK (gender_filter IN ('all', 'same_only')) DEFAULT 'all',
    
    -- Help session fields
    help_category TEXT CHECK (help_category IN ('Academic', 'Project', 'Tech', 'General')),
    flow TEXT CHECK (flow IN ('seeking', 'offering')),
    
    -- Cookie session fields
    skill_tag TEXT,
    expected_outcome TEXT,
    
    -- Query session fields
    return_time TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. SESSION MESSAGES
CREATE TABLE public.session_messages (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    text TEXT NOT NULL CHECK (char_length(text) > 0 AND char_length(text) <= 280),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. FRIENDSHIPS (bidirectional - one row per direction)
CREATE TABLE public.friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, friend_id),
    CHECK (user_id <> friend_id)
);

-- 5. FRIEND REQUESTS
CREATE TABLE public.friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(from_user_id, to_user_id),
    CHECK (from_user_id <> to_user_id)
);

-- 6. TAGS (custom friend groups)
CREATE TABLE public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 20),
    color TEXT NOT NULL DEFAULT 'green',
    emoji TEXT NOT NULL DEFAULT '🏷️',
    member_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. CONVERSATIONS (DM threads)
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_ids UUID[] NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (cardinality(participant_ids) = 2)
);

-- 8. DIRECT MESSAGES
CREATE TABLE public.direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    text TEXT NOT NULL CHECK (char_length(text) > 0 AND char_length(text) <= 100),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. NOTIFICATIONS
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'session_invite',
        'friend_request_received',
        'friend_request_accepted',
        'session_join',
        'session_ending_soon',
        'tag_add',
        'ownership_transfer'
    )),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    session_id BIGINT REFERENCES public.sessions(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. VOUCHES (Cookie Score system)
CREATE TABLE public.vouches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id BIGINT REFERENCES public.sessions(id) ON DELETE SET NULL,
    skill TEXT NOT NULL,
    points INTEGER NOT NULL CHECK (points > 0 AND points <= 10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_vouch_per_session UNIQUE(voucher_id, session_id),
    CONSTRAINT no_self_vouch CHECK (voucher_id <> receiver_id)
);

-- 11. RECENT EMOJIS (per user)
CREATE TABLE public.recent_emojis (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    last_used TIMESTAMPTZ NOT NULL DEFAULT now(),
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
CREATE INDEX idx_sessions_participants ON public.sessions USING gin (participants);
CREATE INDEX idx_sessions_visible_tags ON public.sessions USING gin (visible_to_tags);
CREATE INDEX idx_sessions_active ON public.sessions(status, event_time) WHERE status = 'active';

-- Session messages
CREATE INDEX idx_session_messages_session ON public.session_messages(session_id);
CREATE INDEX idx_session_messages_created ON public.session_messages(session_id, created_at);

-- Friendships
CREATE INDEX idx_friendships_user ON public.friendships(user_id);
CREATE INDEX idx_friendships_friend ON public.friendships(friend_id);

-- Friend requests
CREATE INDEX idx_friend_requests_from ON public.friend_requests(from_user_id);
CREATE INDEX idx_friend_requests_to ON public.friend_requests(to_user_id);

-- Tags
CREATE INDEX idx_tags_creator ON public.tags(creator_id);
CREATE INDEX idx_tags_members ON public.tags USING gin (member_ids);

-- Conversations
CREATE INDEX idx_conversations_participants ON public.conversations USING gin (participant_ids);
CREATE INDEX idx_conversations_updated ON public.conversations(updated_at DESC);

-- Direct messages
CREATE INDEX idx_direct_messages_conversation ON public.direct_messages(conversation_id);
CREATE INDEX idx_direct_messages_timestamp ON public.direct_messages(conversation_id, timestamp DESC);

-- Notifications
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX idx_notifications_unread ON public.notifications(recipient_id, is_read, created_at DESC) WHERE is_read = false;

-- Vouches
CREATE INDEX idx_vouches_receiver ON public.vouches(receiver_id);
CREATE INDEX idx_vouches_voucher ON public.vouches(voucher_id);
CREATE INDEX idx_vouches_skill ON public.vouches(receiver_id, skill);

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

-- 4. Safe session join (prevents race conditions)
CREATE OR REPLACE FUNCTION public.join_session_safe(
    p_session_id BIGINT,
    p_user_id UUID,
    p_role TEXT DEFAULT 'participant'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_new_participants UUID[];
    v_new_roles JSONB;
BEGIN
    SELECT * INTO v_session FROM public.sessions WHERE id = p_session_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Session not found');
    END IF;
    
    IF v_session.status != 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Session is no longer active');
    END IF;
    
    IF p_user_id = ANY(v_session.participants) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Already a participant');
    END IF;
    
    v_new_participants := array_append(v_session.participants, p_user_id);
    v_new_roles := COALESCE(v_session.participant_roles, '{}'::jsonb);
    v_new_roles := v_new_roles || jsonb_build_object(p_user_id::text, p_role);
    
    UPDATE public.sessions
    SET participants = v_new_participants, participant_roles = v_new_roles
    WHERE id = p_session_id;
    
    RETURN jsonb_build_object('success', true, 'participants', v_new_participants, 'participant_roles', v_new_roles);
END;
$$;

-- 5. Safe session leave
CREATE OR REPLACE FUNCTION public.leave_session_safe(
    p_session_id BIGINT,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_new_participants UUID[];
    v_new_roles JSONB;
BEGIN
    SELECT * INTO v_session FROM public.sessions WHERE id = p_session_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Session not found');
    END IF;
    
    IF NOT (p_user_id = ANY(v_session.participants)) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not a participant');
    END IF;
    
    v_new_participants := array_remove(v_session.participants, p_user_id);
    v_new_roles := COALESCE(v_session.participant_roles, '{}'::jsonb) - p_user_id::text;
    
    IF array_length(v_new_participants, 1) IS NULL OR array_length(v_new_participants, 1) = 0 THEN
        UPDATE public.sessions SET status = 'closed', participants = '{}', participant_roles = '{}' WHERE id = p_session_id;
        RETURN jsonb_build_object('success', true, 'session_closed', true);
    END IF;
    
    UPDATE public.sessions SET participants = v_new_participants, participant_roles = v_new_roles WHERE id = p_session_id;
    RETURN jsonb_build_object('success', true, 'session_closed', false, 'participants', v_new_participants);
END;
$$;

-- 6. Safe vouch creation (with diminishing returns)
CREATE OR REPLACE FUNCTION public.create_vouch_safe(
    p_voucher_id UUID,
    p_receiver_id UUID,
    p_session_id BIGINT,
    p_skill TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_vouches INTEGER;
    v_points INTEGER;
    v_current_score INTEGER;
    v_current_skill_scores JSONB;
BEGIN
    IF p_voucher_id = p_receiver_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot vouch for yourself');
    END IF;
    
    SELECT COUNT(*) INTO v_existing_vouches
    FROM public.vouches
    WHERE voucher_id = p_voucher_id AND receiver_id = p_receiver_id AND skill = p_skill;
    
    IF v_existing_vouches >= 5 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Maximum vouches reached');
    END IF;
    
    v_points := GREATEST(10 - (v_existing_vouches * 2), 2);
    
    INSERT INTO public.vouches (voucher_id, receiver_id, session_id, skill, points)
    VALUES (p_voucher_id, p_receiver_id, p_session_id, p_skill, v_points);
    
    SELECT cookie_score, skill_scores INTO v_current_score, v_current_skill_scores
    FROM public.profiles WHERE id = p_receiver_id;
    
    v_current_skill_scores := COALESCE(v_current_skill_scores, '{}'::jsonb);
    v_current_skill_scores := jsonb_set(
        v_current_skill_scores,
        ARRAY[p_skill],
        to_jsonb(COALESCE((v_current_skill_scores->>p_skill)::integer, 0) + v_points)
    );
    
    UPDATE public.profiles
    SET cookie_score = COALESCE(v_current_score, 0) + v_points,
        skill_scores = v_current_skill_scores
    WHERE id = p_receiver_id;
    
    RETURN jsonb_build_object('success', true, 'points', v_points);
END;
$$;

-- 7. Get or create conversation
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
    v_participants UUID[];
BEGIN
    IF user_id_1 < user_id_2 THEN
        v_participants := ARRAY[user_id_1, user_id_2];
    ELSE
        v_participants := ARRAY[user_id_2, user_id_1];
    END IF;
    
    SELECT id INTO v_conversation_id
    FROM public.conversations
    WHERE participant_ids @> v_participants AND participant_ids <@ v_participants;
    
    IF NOT FOUND THEN
        INSERT INTO public.conversations (participant_ids)
        VALUES (v_participants)
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
ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
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

-- Session messages
CREATE POLICY "Participants can view messages" ON public.session_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = session_id AND auth.uid() = ANY(s.participants))
);
CREATE POLICY "Participants can send messages" ON public.session_messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = session_id AND auth.uid() = ANY(s.participants))
);

-- Friendships
CREATE POLICY "Users can view own friendships" ON public.friendships FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can create friendships" ON public.friendships FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete own friendships" ON public.friendships FOR DELETE USING (auth.uid() = user_id);

-- Friend requests
CREATE POLICY "Users can view their requests" ON public.friend_requests FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Users can send requests" ON public.friend_requests FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Users can delete requests" ON public.friend_requests FOR DELETE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Tags
CREATE POLICY "Users can view own tags" ON public.tags FOR SELECT USING (auth.uid() = creator_id OR auth.uid() = ANY(member_ids));
CREATE POLICY "Users can create tags" ON public.tags FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update tags" ON public.tags FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete tags" ON public.tags FOR DELETE USING (auth.uid() = creator_id);

-- Conversations
CREATE POLICY "Users can view their conversations" ON public.conversations FOR SELECT USING (auth.uid() = ANY(participant_ids));
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = ANY(participant_ids));

-- Direct messages
CREATE POLICY "Users can view their messages" ON public.direct_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND auth.uid() = ANY(c.participant_ids))
);
CREATE POLICY "Users can send messages" ON public.direct_messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND auth.uid() = ANY(c.participant_ids))
);

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = recipient_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = recipient_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = recipient_id);

-- Vouches
CREATE POLICY "Users can view their vouches" ON public.vouches FOR SELECT USING (auth.uid() = voucher_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can create vouches" ON public.vouches FOR INSERT WITH CHECK (true);

-- Recent emojis
CREATE POLICY "Users can view own emojis" ON public.recent_emojis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own emojis" ON public.recent_emojis FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own emojis" ON public.recent_emojis FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- ENABLE REALTIME
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vouches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tags;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

GRANT EXECUTE ON FUNCTION public.join_session_safe(BIGINT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_session_safe(BIGINT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_vouch_safe(UUID, UUID, BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(UUID, UUID) TO authenticated;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================

SELECT 'vibeX Database Setup Complete!' as status, now() as completed_at;
