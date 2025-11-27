// ================================================================
// vibeX Type Definitions v2
// Complete type system for all features
// ================================================================

/**
 * Session Types - The Big 4
 */
export type SessionType = 'vibe' | 'help' | 'cookie' | 'query';

/**
 * Session Flow - for Help, Cookie, and Query
 */
export type SessionFlow = 'seeking' | 'offering';

/**
 * Session Status
 */
export type SessionStatus = 'scheduled' | 'active' | 'closed';

/**
 * Privacy Settings
 */
export type Privacy = 'public' | 'private' | 'friends';

/**
 * Gender Filter for Vibes
 */
export type GenderFilter = 'all' | 'same_only';

/**
 * User Gender
 */
export type Gender = 'male' | 'female' | 'other';

/**
 * Help Categories
 */
export type HelpCategory = 'Academic' | 'Project' | 'Tech' | 'General';

/**
 * Notification Types
 */
export type NotificationType =
  | 'friend_request_received'
  | 'friend_request_accepted'
  | 'session_invite'
  | 'session_join'
  | 'session_starting_soon'
  | 'session_ending_soon'
  | 'ownership_transfer'
  | 'tag_add'
  | 'vouch_received';

/**
 * Friend Request Status
 */
export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

// ================================================================
// CORE INTERFACES
// ================================================================

/**
 * User Profile
 */
export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  bio?: string;
  branch?: string;
  year?: number;
  expertise: string[];
  interests: string[];
  cookie_score: number;
  privacy: Privacy;
  gender?: Gender;
  created_at: string;
  updated_at: string;
}

/**
 * Complete User Object (auth + profile)
 */
export interface User {
  id: string;
  email?: string;
  profile: Profile;
}

/**
 * Session Participant
 */
export interface SessionParticipant {
  id: number;
  session_id: number;
  user_id: string;
  role: 'creator' | 'participant' | 'seeking' | 'offering';
  joined_at: string;
  user?: {
    username: string;
    cookie_score?: number;
  };
}

/**
 * Main Session Interface
 */
export interface Session {
  id: number;
  creator_id: string;
  session_type: SessionType;
  title: string;
  description?: string;
  emoji: string;
  lat: number;
  lng: number;
  
  // Timing
  event_time: string;
  duration: number;
  status: SessionStatus;
  
  // Privacy & Filters
  privacy: Privacy;
  visible_to_tags?: string[];
  gender_filter?: GenderFilter;
  
  // Type-specific fields
  flow?: SessionFlow;
  help_category?: HelpCategory;
  skill_tag?: string;
  return_time?: string;
  
  // Ownership
  current_owner_id?: string;
  
  // Joined data
  creator?: {
    id: string;
    username: string;
    cookie_score?: number;
  };
  participants?: SessionParticipant[];
  participant_count?: number;
  
  created_at: string;
  updated_at: string;
}

/**
 * Session Message
 */
export interface SessionMessage {
  id: number;
  session_id: number;
  sender_id: string;
  text: string;
  is_premade: boolean;
  created_at: string;
  sender?: {
    username: string;
  };
}

/**
 * Friendship
 */
export interface Friendship {
  id: string;
  user_id_1: string;
  user_id_2: string;
  created_at: string;
}

/**
 * Friend (enriched for display)
 */
export interface Friend {
  id: string;
  username: string;
  full_name?: string;
  branch?: string;
  year?: number;
  cookie_score: number;
  tags?: Tag[];
  mutual_friends?: number;
}

/**
 * Friend Request
 */
export interface FriendRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: FriendRequestStatus;
  created_at: string;
  updated_at: string;
  from_user?: {
    username: string;
    full_name?: string;
    branch?: string;
    year?: number;
  };
  to_user?: {
    username: string;
    full_name?: string;
  };
}

/**
 * Custom Tag
 */
export interface Tag {
  id: string;
  creator_id: string;
  name: string;
  color: string;
  emoji?: string;
  created_at: string;
  members?: string[]; // user IDs
  member_count?: number;
}

/**
 * Tag Member
 */
export interface TagMember {
  id: number;
  tag_id: string;
  user_id: string;
  added_at: string;
}

/**
 * Vouch
 */
export interface Vouch {
  id: string;
  session_id?: number;
  voucher_id: string;
  receiver_id: string;
  skill: string;
  points: number;
  vouch_number: number;
  created_at: string;
  voucher?: {
    username: string;
  };
  receiver?: {
    username: string;
  };
}

/**
 * Notification
 */
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  actor_id?: string;
  session_id?: number;
  tag_id?: string;
  message?: string;
  is_read: boolean;
  created_at: string;
  actor?: {
    username: string;
  };
  session?: {
    title: string;
    emoji: string;
  };
  tag?: {
    name: string;
  };
}

/**
 * Conversation
 */
export interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  last_message_at: string;
  created_at: string;
  other_user?: {
    id: string;
    username: string;
    full_name?: string;
  };
  last_message?: DirectMessage;
  unread_count?: number;
}

/**
 * Direct Message
 */
export interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  is_premade: boolean;
  created_at: string;
  sender?: {
    username: string;
  };
}

/**
 * Recent Emoji
 */
export interface RecentEmoji {
  id: number;
  user_id: string;
  emoji: string;
  last_used: string;
  use_count: number;
}

// ================================================================
// UI/FORM TYPES
// ================================================================

/**
 * Session Creation Form Data
 */
export interface CreateSessionFormData {
  session_type: SessionType;
  title: string;
  description: string;
  emoji: string;
  lat: number;
  lng: number;
  duration: number; // minutes
  start_delay: number; // minutes from now
  privacy: Privacy;
  visible_to_tags?: string[];
  gender_filter?: GenderFilter;
  flow?: SessionFlow;
  help_category?: HelpCategory;
  skill_tag?: string;
  return_time?: string;
}

/**
 * Profile Update Form Data
 */
export interface UpdateProfileFormData {
  username?: string;
  full_name?: string;
  bio?: string;
  branch?: string;
  year?: number;
  expertise?: string[];
  interests?: string[];
  privacy?: Privacy;
  gender?: Gender;
}

/**
 * Tag Creation Form Data
 */
export interface CreateTagFormData {
  name: string;
  color: string;
  emoji?: string;
}

// ================================================================
// UTILITY TYPES
// ================================================================

/**
 * Session Participation Limits
 */
export interface SessionLimits {
  can_join: boolean;
  reason?: string;
  current_exclusive?: Session;
  current_queries: Session[];
}

/**
 * Vouch Points Calculation
 */
export interface VouchPointsResult {
  points: number;
  vouch_number: number;
  can_vouch: boolean;
  reason?: string;
}

/**
 * Campus Zone
 */
export interface CampusZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number; // meters
}

/**
 * Pre-made Message Block
 */
export interface MessageBlock {
  id: string;
  text: string;
  category: 'session' | 'dm';
}

/**
 * Emoji Option
 */
export interface EmojiOption {
  emoji: string;
  label: string;
  category: string;
}

// ================================================================
// APP STATE TYPES
// ================================================================

/**
 * Bottom Navigation Tab
 */
export type AppTab = 'Home' | 'Search' | 'Friends' | 'Messages' | 'Profile';

/**
 * Theme
 */
export type Theme = 'light' | 'dark';

/**
 * Toast Type
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Toast Message
 */
export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

/**
 * Modal State
 */
export interface ModalState {
  isOpen: boolean;
  type?: string;
  data?: any;
}

// ================================================================
// API RESPONSE TYPES
// ================================================================

/**
 * Generic API Response
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// ================================================================
// CONSTANTS
// ================================================================

/**
 * Pre-made Skills (for expertise/skill tags)
 */
export const SKILLS = [
  'Python',
  'JavaScript',
  'Java',
  'C++',
  'CAD',
  'Design',
  'Photography',
  'Video Editing',
  'Music',
  'Writing',
  'Public Speaking',
  'Data Science',
  'Machine Learning',
  'Web Development',
  'Mobile Development',
  'Electronics',
  'Robotics',
  '3D Printing',
  'Animation',
  'UI/UX Design',
] as const;

/**
 * Pre-made Interests
 */
export const INTERESTS = [
  'Chess',
  'Football',
  'Cricket',
  'Badminton',
  'Basketball',
  'Tennis',
  'Swimming',
  'Gym',
  'Yoga',
  'Movies',
  'Music',
  'Reading',
  'Gaming',
  'Cooking',
  'Travel',
  'Photography',
  'Art',
  'Dance',
  'Theater',
  'Debate',
] as const;

/**
 * Branches
 */
export const BRANCHES = [
  'Computer Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Chemical Engineering',
  'Civil Engineering',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Economics',
  'Other',
] as const;

/**
 * Years
 */
export const YEARS = [1, 2, 3, 4, 5] as const;

/**
 * Duration Options (minutes)
 */
export const DURATION_OPTIONS = [30, 60, 120] as const;

/**
 * Start Delay Options (minutes)
 */
export const START_DELAY_OPTIONS = [0, 10, 30, 60, 120] as const;

/**
 * Vouch Points (F1-style)
 */
export const VOUCH_POINTS = [10, 7, 5, 2, 1] as const;

/**
 * Max Vouches per Voucher-Receiver Pair
 */
export const MAX_VOUCHES = 5;

/**
 * Message Character Limits
 */
export const MESSAGE_LIMITS = {
  SESSION_CHAT: 100,
  DIRECT_MESSAGE: 100,
  TITLE: 100,
  DESCRIPTION: 500,
  BIO: 300,
  TAG_NAME: 50,
} as const;

/**
 * Session Participation Limits
 */
export const PARTICIPATION_LIMITS = {
  MAX_EXCLUSIVE: 1, // Vibe, Help, or Cookie
  MAX_QUERIES: 4, // Total queries
  MAX_QUERY_SEEKING: 2,
  MAX_QUERY_OFFERING: 2,
} as const;

/**
 * Pre-made Session Messages
 */
export const SESSION_MESSAGE_BLOCKS: MessageBlock[] = [
  { id: 'on_way', text: 'On the way!', category: 'session' },
  { id: 'in_5', text: 'In 5 min', category: 'session' },
  { id: 'here', text: 'Here!', category: 'session' },
  { id: 'running_late', text: 'Running late', category: 'session' },
  { id: 'cant_make_it', text: "Can't make it", category: 'session' },
];

/**
 * Pre-made DM Blocks
 */
export const DM_MESSAGE_BLOCKS: MessageBlock[] = [
  { id: 'hey', text: 'Hey!', category: 'dm' },
  { id: 'thanks', text: 'Thanks!', category: 'dm' },
  { id: 'sure', text: 'Sure', category: 'dm' },
  { id: 'sounds_good', text: 'Sounds good', category: 'dm' },
  { id: 'maybe_later', text: 'Maybe later', category: 'dm' },
];