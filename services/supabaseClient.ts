import { createClient } from '@supabase/supabase-js';

// Derived from your provided connection string
const supabaseUrl = 'https://eauliazjdywgeizgpdmy.supabase.co';

// Try to get key from storage, environment, or use default
const getSupabaseKey = () => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('GEMINI_GPT_SUPABASE_KEY');
        if (stored) return stored;
    }
    // Try environment variable first (Vite uses import.meta.env)
    // @ts-ignore
    const envKey = import.meta.env?.SUPABASE_KEY;
    if (envKey) return envKey;
    // Fallback to the provided key
    return 'sb_publishable_3dOMAbavq4rTxS7brRSIhQ_-UHLWpbt';
};

const supabaseKey = getSupabaseKey();

export const isSupabaseConfigured = () => {
    // Basic validation - key exists and has minimum length
    if (!supabaseKey || supabaseKey.length < 10) return false;
    
    return true;
};

export const supabase = createClient(supabaseUrl, supabaseKey);