import { User, ChatSession, Plan, UserSettings } from '../types';
import { supabase } from './supabaseClient';

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  alwaysShowCode: false,
  language: 'Auto-detect',
  customInstructions: '',
  enableMemory: false,
  enableHistory: true
};

const PLAN_CREDITS: Record<string, number> = {
    'basic': 100,
    'free': 100,
    'pro': 500,
    'plus': 1000,
    'agent': 1500
};

export const storageService = {
  


  getSession: async (): Promise<User | null> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      // Fetch profile from DB
      let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
      
      // Log any errors fetching profile for debugging
      if (profileError) {
          console.log("Profile fetch error (may be normal for new users):", profileError.message);
      }

      // IF PROFILE MISSING (First time Google Login)
      // We must create it immediately so the user isn't stranded
      if (!profile) {
           const newProfile = {
              id: session.user.id,
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              email: session.user.email,
              plan: 'basic',
              settings: DEFAULT_SETTINGS,
              credits: 100,
              last_credit_reset: Date.now(),
              daily_image_count: 0,
              last_image_reset: Date.now()
          };
          
          const { error } = await supabase.from('profiles').insert(newProfile);
          if (!error) {
              profile = newProfile;
          } else {
              console.error("Failed to create profile for new Google user", error);
              // If we can't create profile in DB, still allow login with in-memory profile
              // This prevents the app from getting stuck on "Loading..."
              profile = newProfile;
          }
      }

      // Map DB snake_case to app camelCase
      let user: User = {
          id: session.user.id,
          name: profile.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          plan: profile.plan || 'basic',
          settings: profile.settings ? { ...DEFAULT_SETTINGS, ...profile.settings } : DEFAULT_SETTINGS,
          credits: profile.credits ?? 100,
          lastCreditReset: profile.last_credit_reset || Date.now(),
          dailyImageCount: profile.daily_image_count ?? 0,
          lastImageReset: profile.last_image_reset || Date.now()
      };

      return storageService.checkAndResetLimits(user);
  },

  // --- Limits Logic ---

  checkAndResetLimits: async (user: User): Promise<User> => {
      let updated = false;
      const now = Date.now();
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      const tenHours = 10 * 60 * 60 * 1000; 

      const updates: any = {};

      if (now - user.lastCreditReset > oneWeek) {
          user.credits = PLAN_CREDITS[user.plan] || 100;
          user.lastCreditReset = now;
          updates.credits = user.credits;
          updates.last_credit_reset = now;
          updated = true;
      }

      if (now - user.lastImageReset > tenHours) {
          user.dailyImageCount = 0;
          user.lastImageReset = now;
          updates.daily_image_count = 0;
          updates.last_image_reset = now;
          updated = true;
      }

      if (updated) {
          await supabase.from('profiles').update(updates).eq('id', user.id);
      }
      return user;
  },

  // --- User Updates ---

  saveUser: async (user: User) => {
      // Convert camelCase back to snake_case for DB
      const profileData = {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
          credits: user.credits,
          settings: user.settings,
          last_credit_reset: user.lastCreditReset,
          daily_image_count: user.dailyImageCount,
          last_image_reset: user.lastImageReset
      };

      const { error } = await supabase
          .from('profiles')
          .upsert(profileData);

      if (error) console.error("Error saving user:", error);
  },

  deleteAccount: async (userId: string) => {
      await supabase.auth.signOut();
  },

  logout: async () => {
      await supabase.auth.signOut();
  },

  // --- Chat Management ---

  getUserChats: async (userId: string): Promise<ChatSession[]> => {
      const { data, error } = await supabase
          .from('chats')
          .select('*')
          .eq('user_id', userId)
          .eq('is_archived', false) 
          .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map((row: any) => ({
          id: row.id,
          title: row.title,
          messages: row.messages || [],
          createdAt: row.created_at,
          isArchived: row.is_archived
      }));
  },

  saveUserChats: async (userId: string, chats: ChatSession[]) => {
      const rows = chats.map(chat => ({
          id: chat.id,
          user_id: userId,
          title: chat.title,
          messages: chat.messages,
          created_at: chat.createdAt,
          is_archived: chat.isArchived || false
      }));

      const { error } = await supabase
          .from('chats')
          .upsert(rows);

      if (error) console.error("Error saving chats:", error);
  },

  clearUserChats: async (userId: string) => {
     await supabase.from('chats').delete().eq('user_id', userId);
  }
};