import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { Key, Settings, Check, Unlock, Lock } from 'lucide-react';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Configuration State
  const [isConfigured, setIsConfigured] = useState(true);
  const [manualKey, setManualKey] = useState('');

  useEffect(() => {
      if (!isSupabaseConfigured()) {
          setIsConfigured(false);
      }
  }, []);

  const handleSaveKey = () => {
      if (!manualKey.trim()) return;
      localStorage.setItem('GEMINI_GPT_SUPABASE_KEY', manualKey.trim());
      window.location.reload();
  };

  // Google Login Handler
  const handleGoogleLogin = async () => {
      if (!isConfigured) return;
      setError(null);
      setLoading(true);
      try {
          const { error } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                  redirectTo: window.location.origin
              }
          });
          if (error) throw error;
      } catch (err: any) {
          setError(err.message || "Google login failed.");
          setLoading(false);
      }
  };

  // --- Render Configuration Screen if Key is Missing ---
  if (!isConfigured) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#171717] text-white p-4">
             <div className="w-full max-w-md bg-[#212121] border border-gray-700 rounded-2xl p-8 shadow-2xl">
                 <div className="flex items-center gap-3 mb-6">
                     <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl">
                         <Settings size={24} />
                     </div>
                     <h1 className="text-xl font-bold">Connect Supabase</h1>
                 </div>

                 <div className="space-y-4 text-sm text-gray-300 mb-6">
                     <p>You need to enter your <strong>Publishable Key</strong> to connect.</p>
                     
                     <div className="bg-[#171717] p-4 rounded-lg border border-gray-800 space-y-3">
                         <div className="font-semibold text-white flex items-center gap-2">
                             <Key size={16}/> Which key do I use?
                         </div>
                         <div className="space-y-3 mt-2">
                             <div className="flex items-start gap-3 p-2 bg-green-500/10 rounded border border-green-500/30">
                                 <Unlock size={16} className="text-green-400 mt-0.5 shrink-0" />
                                 <div>
                                     <strong className="text-green-400 block text-xs uppercase tracking-wide">Use This One</strong>
                                     <span className="text-gray-300">"Publishable key" (public)</span>
                                 </div>
                             </div>
                             
                             <div className="flex items-start gap-3 p-2 bg-red-500/10 rounded border border-red-500/30">
                                 <Lock size={16} className="text-red-400 mt-0.5 shrink-0" />
                                 <div>
                                     <strong className="text-red-400 block text-xs uppercase tracking-wide">Do Not Use</strong>
                                     <span className="text-gray-300">"Secret key" (service_role)</span>
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>

                 <div className="space-y-4">
                     <div>
                         <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Publishable API Key</label>
                         <input 
                            type="text" 
                            value={manualKey}
                            onChange={(e) => setManualKey(e.target.value)}
                            placeholder="sb_publishable_..."
                            className="w-full p-3 bg-[#171717] border border-gray-700 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                         />
                     </div>
                     <button 
                        onClick={handleSaveKey}
                        disabled={!manualKey}
                        className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${manualKey ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                     >
                         <Check size={18} /> Save & Connect
                     </button>
                 </div>
             </div>
        </div>
      );
  }

  // --- Render Auth Screen (Google Only) ---
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#171717] text-white p-4">
      <div className="w-full max-w-[360px]">
        <div className="flex justify-center mb-10">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-white">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor" fillOpacity="0.2"/>
            <path d="M12 6C15.31 6 18 8.69 18 12C18 15.31 15.31 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6ZM12 8C9.79 8 8 9.79 8 12C8 14.21 9.79 16 12 16C14.21 16 16 14.21 16 12C16 9.79 14.21 8 12 8Z" fill="currentColor"/>
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">
          Welcome to GeminiGPT
        </h1>
        <p className="text-gray-400 text-center mb-8">
            Sign in to continue
        </p>

        {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg mt-4 mb-2 text-center">
                {error}
            </div>
        )}

        <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3.5 bg-white text-black hover:bg-gray-200 rounded-lg font-medium transition-colors flex justify-center items-center gap-3 relative disabled:opacity-70 disabled:cursor-not-allowed"
        >
            {loading ? (
                 <span className="animate-spin h-5 w-5 border-2 border-b-transparent rounded-full border-black"></span>
            ) : (
                <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                </>
            )}
        </button>

        <div className="mt-8 text-center text-xs text-gray-500">
            By clicking "Continue with Google", you agree to our Terms of Service and Privacy Policy.
        </div>
      </div>
    </div>
  );
};

export default AuthPage;