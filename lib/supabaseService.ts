// ================================================================
// vibeX Supabase Service Layer v2
// Complete database operations for all features
// ================================================================

import { supabase } from './supabaseClient';
import { validateText } from './profanityFilter';
import { canJoinSession, canCreateSession } from './sessionLimits';
import { createVouch as createVouchWithPoints } from './vouchCalculator';
import type {
  Session,
  SessionMessage,
  Friend,
  Tag,
  FriendRequest,
  Notification,
  Profile,
  Conversation,
  DirectMessage,
  Vouch,
  SessionType,
  SessionFlow,
  CreateSessionFormData,
  UpdateProfileFormData,
  CreateTagFormData,
} from '../types';

// ================================================================
// HELPER TYPES
// ================================================================

interface ServiceResponse<T> {
  data: T | null;
  error: Error | null;
}

// ================================================================
// SESSIONS
// ================================================================

/**
 * Fetch all public active sessions
 */
export async function fetchActiveSessions(): Promise<ServiceResponse<Session[]>> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        creator:profiles!creator_id(id, username, cookie_score),
        session_participants(
          user_id,
          role,
          user:profiles(username)
        )
      `)
      .eq('privacy', 'public')
      .in('status', ['scheduled', 'active'])
      .order('event_time', { ascending: true });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching active sessions:', error);
    return { data: null, error };
  }
}

/**
 * Fetch sessions visible to user (public + private with tags)
 */
export async function fetchVisibleSessions(userId: string): Promise<ServiceResponse<Session[]>> {
  try {
    // Get user's tags
    const { data: userTags } = await supabase
      .from('tag_members')
      .select('tag_id')
      .eq('user_id', userId);

    const tagIds = userTags?.map(t => t.tag_id) || [];

    // Fetch public sessions
    const { data: publicSessions, error: publicError } = await supabase
      .from('sessions')
      .select(`
        *,
        creator:profiles!creator_id(id, username, cookie_score),
        session_participants(
          user_id,
          role,
          user:profiles(username)
        )
      `)
      .eq('privacy', 'public')
      .in('status', ['scheduled', 'active']);

    if (publicError) throw publicError;

    // Fetch private sessions with user's tags
    let privateSessions: any[] = [];
    if (tagIds.length > 0) {
      const { data: privData, error: privError } = await supabase
        .from('sessions')
        .select(`
          *,
          creator:profiles!creator_id(id, username, cookie_score),
          session_participants(
            user_id,
            role,
            user:profiles(username)
          )
        `)
        .eq('privacy', 'private')
        .in('status', ['scheduled', 'active'])
        .overlaps('visible_to_tags', tagIds);

      if (!privError) {
        privateSessions = privData || [];
      }
    }

    const allSessions = [...(publicSessions || []), ...privateSessions];
    return { data: allSessions, error: null };
  } catch (error: any) {
    console.error('Error fetching visible sessions:', error);
    return { data: null, error };
  }
}

/**
 * Create a new session
 */
export async function createSession(
  formData: CreateSessionFormData,
  userId: string
): Promise<ServiceResponse<Session>> {
  try {
    // Validate profanity
    const titleError = validateText(formData.title, 'Title');
    if (titleError) throw new Error(titleError);

    const descError = validateText(formData.description, 'Description');
    if (descError) throw new Error(descError);

    // Check session limits
    const limits = await canCreateSession(userId, formData.session_type, formData.flow);
    if (!limits.can_join) {
      throw new Error(limits.reason || 'Cannot create session');
    }

    // Calculate event time
    const eventTime = new Date();
    eventTime.setMinutes(eventTime.getMinutes() + formData.start_delay);

    // Create session
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        creator_id: userId,
        session_type: formData.session_type,
        title: formData.title,
        description: formData.description,
        emoji: formData.emoji,
        lat: formData.lat,
        lng: formData.lng,
        event_time: eventTime.toISOString(),
        duration: formData.duration,
        status: formData.start_delay === 0 ? 'active' : 'scheduled',
        privacy: formData.privacy,
        visible_to_tags: formData.visible_to_tags || [],
        gender_filter: formData.gender_filter,
        flow: formData.flow,
        help_category: formData.help_category,
        skill_tag: formData.skill_tag,
        return_time: formData.return_time,
        current_owner_id: userId,
      })
      .select(`
        *,
        creator:profiles!creator_id(id, username, cookie_score)
      `)
      .single();

    if (error) throw error;

    // Add creator as participant
    await supabase
      .from('session_participants')
      .insert({
        session_id: session.id,
        user_id: userId,
        role: 'creator',
      });

    // Update recent emojis
    await supabase
      .from('recent_emojis')
      .upsert({
        user_id: userId,
        emoji: formData.emoji,
        last_used: new Date().toISOString(),
      }, {
        onConflict: 'user_id,emoji',
      });

    return { data: session, error: null };
  } catch (error: any) {
    console.error('Error creating session:', error);
    return { data: null, error };
  }
}

/**
 * Join a session
 */
export async function joinSession(
  sessionId: number,
  userId: string,
  session: Session
): Promise<ServiceResponse<boolean>> {
  try {
    // Check limits
    const limits = await canJoinSession(userId, session.session_type, session.flow);
    if (!limits.can_join) {
      throw new Error(limits.reason || 'Cannot join session');
    }

    // Add participant
    const { error } = await supabase
      .from('session_participants')
      .insert({
        session_id: sessionId,
        user_id: userId,
        role: 'participant',
      });

    if (error) throw error;

    // Create notification for creator
    await createNotification(session.creator_id, 'session_join', {
      actor_id: userId,
      session_id: sessionId,
    });

    return { data: true, error: null };
  } catch (error: any) {
    console.error('Error joining session:', error);
    return { data: null, error };
  }
}

/**
 * Leave a session
 */
export async function leaveSession(
  sessionId: number,
  userId: string
): Promise<ServiceResponse<boolean>> {
  try {
    const { error } = await supabase
      .from('session_participants')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (error) throw error;

    return { data: true, error: null };
  } catch (error: any) {
    console.error('Error leaving session:', error);
    return { data: null, error };
  }
}

/**
 * Transfer session ownership
 */
export async function transferOwnership(
  sessionId: number,
  newOwnerId: string,
  currentOwnerId: string
): Promise<ServiceResponse<boolean>> {
  try {
    // Verify current owner
    const { data: session } = await supabase
      .from('sessions')
      .select('current_owner_id')
      .eq('id', sessionId)
      .single();

    if (session?.current_owner_id !== currentOwnerId) {
      throw new Error('You are not the owner of this session');
    }

    // Update owner
    const { error } = await supabase
      .from('sessions')
      .update({ current_owner_id: newOwnerId })
      .eq('id', sessionId);

    if (error) throw error;

    // Notify new owner
    await createNotification(newOwnerId, 'ownership_transfer', {
      actor_id: currentOwnerId,
      session_id: sessionId,
    });

    return { data: true, error: null };
  } catch (error: any) {
    console.error('Error transferring ownership:', error);
    return { data: null, error };
  }
}

/**
 * Extend session duration
 */
export async function extendSession(
  sessionId: number,
  additionalMinutes: number,
  userId: string
): Promise<ServiceResponse<boolean>> {
  try {
    // Verify ownership
    const { data: session } = await supabase
      .from('sessions')
      .select('current_owner_id, duration')
      .eq('id', sessionId)
      .single();

    if (session?.current_owner_id !== userId) {
      throw new Error('Only the owner can extend the session');
    }

    // Update duration
    const { error } = await supabase
      .from('sessions')
      .update({ duration: session.duration + additionalMinutes })
      .eq('id', sessionId);

    if (error) throw error;

    return { data: true, error: null };
  } catch (error: any) {
    console.error('Error extending session:', error);
    return { data: null, error };
  }
}

/**
 * Close a session
 */
export async function closeSession(
  sessionId: number,
  userId: string
): Promise<ServiceResponse<boolean>> {
  try {
    const { error } = await supabase
      .from('sessions')
      .update({ status: 'closed' })
      .eq('id', sessionId)
      .eq('creator_id', userId);

    if (error) throw error;

    return { data: true, error: null };
  } catch (error: any) {
    console.error('Error closing session:', error);
    return { data: null, error };
  }
}

// ================================================================
// SESSION MESSAGES
// ================================================================

/**
 * Fetch messages for a session
 */
export async function fetchSessionMessages(
  sessionId: number
): Promise<ServiceResponse<SessionMessage[]>> {
  try {
    const { data, error } = await supabase
      .from('session_messages')
      .select(`
        *,
        sender:profiles!sender_id(username)
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching session messages:', error);
    return { data: null, error };
  }
}

/**
 * Send a session message
 */
export async function sendSessionMessage(
  sessionId: number,
  userId: string,
  text: string,
  isPremade: boolean = false
): Promise<ServiceResponse<SessionMessage>> {
  try {
    // Validate profanity (only for custom messages)
    if (!isPremade) {
      const error = validateText(text, 'Message');
      if (error) throw new Error(error);
    }

    const { data, error } = await supabase
      .from('session_messages')
      .insert({
        session_id: sessionId,
        sender_id: userId,
        text,
        is_premade: isPremade,
      })
      .select(`
        *,
        sender:profiles!sender_id(username)
      `)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error sending session message:', error);
    return { data: null, error };
  }
}

// ================================================================
// FRIENDS
// ================================================================

/**
 * Search users by username
 */
export async function searchUsers(
  query: string,
  currentUserId: string
): Promise<ServiceResponse<Friend[]>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, branch, year, cookie_score')
      .ilike('username', `%${query}%`)
      .neq('id', currentUserId)
      .limit(20);

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error: any) {
    console.error('Error searching users:', error);
    return { data: null, error };
  }
}

/**
 * Fetch user's friends
 */
export async function fetchFriends(userId: string): Promise<ServiceResponse<Friend[]>> {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        user_id_1,
        user_id_2,
        user1:profiles!friendships_user_id_1_fkey(id, username, full_name, branch, year, cookie_score),
        user2:profiles!friendships_user_id_2_fkey(id, username, full_name, branch, year, cookie_score)
      `)
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

    if (error) throw error;

    // Extract the friend (not the current user)
    const friends = data?.map((f: any) => {
      const friend = f.user_id_1 === userId ? f.user2 : f.user1;
      return friend;
    }) || [];

    return { data: friends, error: null };
  } catch (error: any) {
    console.error('Error fetching friends:', error);
    return { data: null, error };
  }
}

/**
 * Send friend request
 */
export async function sendFriendRequest(
  fromUserId: string,
  toUserId: string
): Promise<ServiceResponse<FriendRequest>> {
  try {
    // Check if already friends
    const { data: existing } = await supabase
      .from('friendships')
      .select('id')
      .or(`and(user_id_1.eq.${fromUserId},user_id_2.eq.${toUserId}),and(user_id_1.eq.${toUserId},user_id_2.eq.${fromUserId})`)
      .maybeSingle();

    if (existing) {
      throw new Error('Already friends');
    }

    // Check if request already exists
    const { data: existingRequest } = await supabase
      .from('friend_requests')
      .select('id')
      .or(`and(from_user_id.eq.${fromUserId},to_user_id.eq.${toUserId}),and(from_user_id.eq.${toUserId},to_user_id.eq.${fromUserId})`)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingRequest) {
      throw new Error('Friend request already pending');
    }

    const { data, error } = await supabase
      .from('friend_requests')
      .insert({
        from_user_id: fromUserId,
        to_user_id: toUserId,
      })
      .select(`
        *,
        from_user:profiles!from_user_id(username, full_name, branch, year)
      `)
      .single();

    if (error) throw error;

    // Create notification
    await createNotification(toUserId, 'friend_request_received', {
      actor_id: fromUserId,
    });

    return { data, error: null };
  } catch (error: any) {
    console.error('Error sending friend request:', error);
    return { data: null, error };
  }
}

/**
 * Accept friend request
 */
export async function acceptFriendRequest(
  requestId: string
): Promise<ServiceResponse<boolean>> {
  try {
    // Get request details
    const { data: request } = await supabase
      .from('friend_requests')
      .select('from_user_id, to_user_id')
      .eq('id', requestId)
      .single();

    if (!request) throw new Error('Request not found');

    // Create friendship (bidirectional with constraint)
    const [user1, user2] = [request.from_user_id, request.to_user_id].sort();

    const { error: friendError } = await supabase
      .from('friendships')
      .insert({
        user_id_1: user1,
        user_id_2: user2,
      });

    if (friendError) throw friendError;

    // Update request status
    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // Notify requester
    await createNotification(request.from_user_id, 'friend_request_accepted', {
      actor_id: request.to_user_id,
    });

    return { data: true, error: null };
  } catch (error: any) {
    console.error('Error accepting friend request:', error);
    return { data: null, error };
  }
}

/**
 * Reject friend request
 */
export async function rejectFriendRequest(
  requestId: string
): Promise<ServiceResponse<boolean>> {
  try {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) throw error;

    return { data: true, error: null };
  } catch (error: any) {
    console.error('Error rejecting friend request:', error);
    return { data: null, error };
  }
}

/**
 * Fetch pending friend requests
 */
export async function fetchFriendRequests(
  userId: string
): Promise<ServiceResponse<FriendRequest[]>> {
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        *,
        from_user:profiles!from_user_id(username, full_name, branch, year),
        to_user:profiles!to_user_id(username, full_name)
      `)
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .eq('status', 'pending');

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching friend requests:', error);
    return { data: null, error };
  }
}

// ================================================================
// TAGS
// ================================================================

/**
 * Fetch user's tags
 */
export async function fetchTags(userId: string): Promise<ServiceResponse<Tag[]>> {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select(`
        *,
        tag_members(user_id)
      `)
      .eq('creator_id', userId);

    if (error) throw error;

    const tags = data?.map((t: any) => ({
      ...t,
      members: t.tag_members?.map((m: any) => m.user_id) || [],
      member_count: t.tag_members?.length || 0,
    })) || [];

    return { data: tags, error: null };
  } catch (error: any) {
    console.error('Error fetching tags:', error);
    return { data: null, error };
  }
}

/**
 * Create a tag
 */
export async function createTag(
  formData: CreateTagFormData,
  userId: string
): Promise<ServiceResponse<Tag>> {
  try {
    // Validate profanity
    const error = validateText(formData.name, 'Tag name');
    if (error) throw new Error(error);

    const { data, error: dbError } = await supabase
      .from('tags')
      .insert({
        creator_id: userId,
        name: formData.name,
        color: formData.color,
        emoji: formData.emoji,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return { data: { ...data, members: [], member_count: 0 }, error: null };
  } catch (error: any) {
    console.error('Error creating tag:', error);
    return { data: null, error };
  }
}

/**
 * Add member to tag
 */
export async function addMemberToTag(
  tagId: string,
  userId: string
): Promise<ServiceResponse<boolean>> {
  try {
    const { error } = await supabase
      .from('tag_members')
      .insert({
        tag_id: tagId,
        user_id: userId,
      });

    if (error) throw error;

    return { data: true, error: null };
  } catch (error: any) {
    console.error('Error adding member to tag:', error);
    return { data: null, error };
  }
}

/**
 * Remove member from tag
 */
export async function removeMemberFromTag(
  tagId: string,
  userId: string
): Promise<ServiceResponse<boolean>> {
  try {
    const { error } = await supabase
      .from('tag_members')
      .delete()
      .eq('tag_id', tagId)
      .eq('user_id', userId);

    if (error) throw error;

    return { data: true, error: null };
  } catch (error: any) {
    console.error('Error removing member from tag:', error);
    return { data: null, error };
  }
}

/**
 * Delete a tag
 */
export async function deleteTag(tagId: string): Promise<ServiceResponse<boolean>> {
  try {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId);

    if (error) throw error;

    return { data: true, error: null };
  } catch (error: any) {
    console.error('Error deleting tag:', error);
    return { data: null, error };
  }
}

// ================================================================
// VOUCHES
// ================================================================

/**
 * Create a vouch
 */
export async function vouchForUser(
  sessionId: number,
  voucherId: string,
  receiverId: string,
  skill: string
): Promise<ServiceResponse<{ points: number }>> {
  try {
    const result = await createVouchWithPoints(sessionId, voucherId, receiverId, skill);

    if (!result.success) {
      throw new Error(result.error || 'Failed to create vouch');
    }

    // Create notification
    await createNotification(receiverId, 'vouch_received', {
      actor_id: voucherId,
      session_id: sessionId,
    });

    return { data: { points: result.points }, error: null };
  } catch (error: any) {
    console.error('Error creating vouch:', error);
    return { data: null, error };
  }
}

// ================================================================
// NOTIFICATIONS
// ================================================================

/**
 * Create a notification
 */
export async function createNotification(
  userId: string,
  type: string,
  data: {
    actor_id?: string;
    session_id?: number;
    tag_id?: string;
    message?: string;
  }
): Promise<ServiceResponse<boolean>> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        ...data,
      });

    if (error) throw error;

    // TODO: Send email notification via Supabase Auth

    return { data: true, error: null };
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return { data: null, error };
  }
}

/**
 * Fetch user's notifications
 */
export async function fetchNotifications(
  userId: string
): Promise<ServiceResponse<Notification[]>> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:profiles!actor_id(username),
        session:sessions(title, emoji),
        tag:tags(name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return { data: null, error };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(
  notificationId: string
): Promise<ServiceResponse<boolean>> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;

    return { data: true, error: null };
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return { data: null, error };
  }
}

// ================================================================
// DIRECT MESSAGES
// ================================================================

/**
 * Get or create conversation between two users
 */
export async function getOrCreateConversation(
  user1Id: string,
  user2Id: string
): Promise<ServiceResponse<Conversation>> {
  try {
    const [userId1, userId2] = [user1Id, user2Id].sort();

    // Try to find existing conversation
    let { data: conversation, error } = await supabase
      .from('conversations')
      .select(`
        *,
        direct_messages(*)
      `)
      .eq('participant_1_id', userId1)
      .eq('participant_2_id', userId2)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    // Create if doesn't exist
    if (!conversation) {
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          participant_1_id: userId1,
          participant_2_id: userId2,
        })
        .select()
        .single();

      if (createError) throw createError;
      conversation = { ...newConv, direct_messages: [] };
    }

    return { data: conversation, error: null };
  } catch (error: any) {
    console.error('Error getting/creating conversation:', error);
    return { data: null, error };
  }
}

/**
 * Send a direct message
 */
export async function sendDirectMessage(
  conversationId: string,
  senderId: string,
  text: string,
  isPremade: boolean = false
): Promise<ServiceResponse<DirectMessage>> {
  try {
    // Validate profanity (only for custom messages)
    if (!isPremade) {
      const error = validateText(text, 'Message');
      if (error) throw new Error(error);
    }

    const { data, error } = await supabase
      .from('direct_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        text,
        is_premade: isPremade,
      })
      .select(`
        *,
        sender:profiles!sender_id(username)
      `)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error sending direct message:', error);
    return { data: null, error };
  }
}

/**
 * Fetch user's conversations
 */
export async function fetchConversations(
  userId: string
): Promise<ServiceResponse<Conversation[]>> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participant_1:profiles!participant_1_id(id, username, full_name),
        participant_2:profiles!participant_2_id(id, username, full_name),
        direct_messages(*)
      `)
      .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (error) throw error;

    // Enrich with other user info
    const conversations = data?.map((c: any) => {
      const otherUser = c.participant_1_id === userId ? c.participant_2 : c.participant_1;
      const messages = c.direct_messages || [];
      return {
        ...c,
        other_user: otherUser,
        last_message: messages[messages.length - 1],
      };
    }) || [];

    return { data: conversations, error: null };
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return { data: null, error };
  }
}

// ================================================================
// PROFILE
// ================================================================

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  formData: UpdateProfileFormData
): Promise<ServiceResponse<Profile>> {
  try {
    // Validate profanity in bio
    if (formData.bio) {
      const error = validateText(formData.bio, 'Bio');
      if (error) throw new Error(error);
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(formData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return { data: null, error };
  }
}

/**
 * Fetch user profile
 */
export async function fetchProfile(userId: string): Promise<ServiceResponse<Profile>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return { data: null, error };
  }
}

// ================================================================
// RECENT EMOJIS
// ================================================================

/**
 * Fetch user's recent emojis
 */
export async function fetchRecentEmojis(userId: string): Promise<ServiceResponse<string[]>> {
  try {
    const { data, error } = await supabase
      .from('recent_emojis')
      .select('emoji')
      .eq('user_id', userId)
      .order('last_used', { ascending: false })
      .limit(5);

    if (error) throw error;

    return { data: data?.map(e => e.emoji) || [], error: null };
  } catch (error: any) {
    console.error('Error fetching recent emojis:', error);
    return { data: null, error };
  }
}