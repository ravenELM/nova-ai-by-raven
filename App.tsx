import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import InputArea from './components/InputArea';
import SettingsModal from './components/SettingsModal';
import AuthPage from './components/AuthPage';
import UpgradeModal from './components/UpgradeModal';
import { ChatSession, Message, ModelType, User, Plan, UserSettings, Attachment } from './types';
import { streamChatResponse, generateTitle, generateImage } from './services/geminiService';
import { storageService } from './services/storageService';
import { PanelLeftOpen, ChevronDown, Sparkles, Check, Lock, Zap } from 'lucide-react';
import { supabase } from './services/supabaseClient';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [model, setModel] = useState<ModelType>(ModelType.FLASH);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const initSession = async () => {
        try {
            const savedUser = await storageService.getSession();
            if (savedUser) {
                setUser(savedUser);
            }
        } catch (e) {
            console.error("Session init error", e);
        } finally {
            // Always set loading to false, even if getSession fails
            setIsLoading(false);
        }
    };
    initSession();

    // Listen for Auth Changes (e.g., Google Login Redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
            setIsLoading(true);
            const userData = await storageService.getSession();
            if (userData) setUser(userData);
            setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setSessions([]);
        }
    });

    return () => {
        subscription.unsubscribe();
    };
  }, []);

  // Theme effect
  useEffect(() => {
    if (user) {
        const theme = user.settings.theme;
        const html = document.documentElement;
        
        if (theme === 'dark') {
            html.classList.add('dark');
        } else if (theme === 'light') {
            html.classList.remove('dark');
            html.style.colorScheme = 'light';
        } else {
            // System
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                html.classList.add('dark');
            } else {
                html.classList.remove('dark');
            }
        }
    }
  }, [user?.settings.theme]);

  // Load chats when user is set
  useEffect(() => {
    const loadChats = async () => {
        if (user?.id) {
            const savedChats = await storageService.getUserChats(user.id);
            if (savedChats.length > 0) {
                setSessions(savedChats);
                setCurrentSessionId(prev => {
                    if (prev && savedChats.some(s => s.id === prev)) return prev;
                    return savedChats[0].id;
                });
            } else {
                setSessions([]);
                createNewSession(user.id);
            }
        }
    };
    loadChats();
  }, [user?.id]);

  // Save chats whenever they change
  useEffect(() => {
    if (user && sessions.length > 0 && user.settings.enableHistory) {
        // Debounce or optimize in real app
        storageService.saveUserChats(user.id, sessions);
    }
  }, [sessions, user]);

  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0];

  useEffect(() => {
      scrollToBottom();
  }, [currentSession?.messages]);

  const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createNewSession = (userId = user?.id) => {
    if (!userId) return;
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      isArchived: false,
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setIsGenerating(false);
  };

  const updateSession = (sessionId: string, updater: (session: ChatSession) => ChatSession) => {
      setSessions(prev => prev.map(s => s.id === sessionId ? updater(s) : s));
  };

  const handleSendMessage = async (text: string, attachments: Attachment[] = []) => {
    if (!currentSessionId || !user) return;

    // --- CREDIT & LIMIT CHECK ---
    
    // Limits check needs async call now
    const checkedUser = await storageService.checkAndResetLimits(user);
    if (checkedUser.credits !== user.credits) {
        setUser(checkedUser);
    }

    const isImageRequest = /^(generate|draw|create|make)\s+(a|an)\s+.*(image|picture|photo|art|drawing|sketch)/i.test(text) || text.toLowerCase().startsWith('generate');
    const cost = isImageRequest ? 10 : 1;

    if (checkedUser.credits < cost) {
        alert(`Insufficient credits. You need ${cost} credits but have ${checkedUser.credits}. Please upgrade.`);
        setIsUpgradeModalOpen(true);
        return;
    }

    if (isImageRequest && (checkedUser.plan === 'basic' || checkedUser.plan === 'free')) {
        if (checkedUser.dailyImageCount >= 3) {
            alert("Free plan is limited to 3 images per 10 hours. Upgrade to Pro for more.");
            setIsUpgradeModalOpen(true);
            return;
        }
    }

    // Deduct credits locally and save
    const updatedUser = { 
        ...checkedUser, 
        credits: checkedUser.credits - cost,
        dailyImageCount: isImageRequest ? checkedUser.dailyImageCount + 1 : checkedUser.dailyImageCount
    };
    setUser(updatedUser);
    storageService.saveUser(updatedUser);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments: attachments
    };

    updateSession(currentSessionId, (s) => ({
        ...s,
        messages: [...s.messages, userMsg]
    }));
    
    setIsGenerating(true);
    
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const botMsgId = (Date.now() + 1).toString();
    const botMsg: Message = {
        id: botMsgId,
        role: 'model',
        content: '',
        timestamp: Date.now(),
        isGeneratingImage: isImageRequest
    };

    updateSession(currentSessionId, (s) => ({
        ...s,
        messages: [...s.messages, botMsg]
    }));

    const session = sessions.find(s => s.id === currentSessionId);
    if (session && session.messages.length === 0) {
        const titleText = text || (attachments.length > 0 ? "Image Analysis" : "New Chat");
        generateTitle(titleText).then(newTitle => {
             updateSession(currentSessionId, (s) => ({ ...s, title: newTitle }));
        });
    }

    if (isImageRequest) {
        try {
            let imageModel = ModelType.FLASH; 
            if (model === ModelType.PRO) { 
                 imageModel = ModelType.PRO;
            }

            const generatedImage = await generateImage(text, imageModel);
            
            updateSession(currentSessionId, (s) => {
                const msgs = [...s.messages];
                const lastMsg = msgs.find(m => m.id === botMsgId);
                if (lastMsg) {
                    lastMsg.isGeneratingImage = false;
                    if (generatedImage) {
                        lastMsg.attachments = [generatedImage];
                    } else {
                        lastMsg.content = "I couldn't generate an image at this time.";
                    }
                }
                return { ...s, messages: msgs };
            });
        } catch (error: any) {
            updateSession(currentSessionId, (s) => {
                const msgs = [...s.messages];
                const lastMsg = msgs.find(m => m.id === botMsgId);
                if (lastMsg) {
                    lastMsg.isGeneratingImage = false;
                    lastMsg.content = `Error generating image: ${error.message || "Unknown error"}`;
                }
                return { ...s, messages: msgs };
            });
        }
        setIsGenerating(false);
        abortControllerRef.current = null;
        return;
    }

    const updatedSessionForApi = sessions.find(s => s.id === currentSessionId);
    const contextMessages = updatedSessionForApi 
        ? [...updatedSessionForApi.messages, userMsg] 
        : [userMsg];

    await streamChatResponse(
        contextMessages, 
        model, 
        user.name, 
        user.settings.customInstructions, 
        (chunkText) => {
            updateSession(currentSessionId, (s) => {
                const msgs = [...s.messages];
                const lastMsg = msgs[msgs.length - 1];
                if (lastMsg.id === botMsgId) {
                    lastMsg.content += chunkText;
                }
                return { ...s, messages: msgs };
            });
        },
        controller.signal
    );

    setIsGenerating(false);
    abortControllerRef.current = null;
  };
  
  const handleStopGenerating = () => {
      if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
          setIsGenerating(false);
          if (currentSessionId) {
             updateSession(currentSessionId, (s) => {
                 const msgs = [...s.messages];
                 const lastMsg = msgs[msgs.length - 1];
                 if (lastMsg.role === 'model' && lastMsg.isGeneratingImage) {
                     lastMsg.isGeneratingImage = false;
                     lastMsg.content += " [Stopped]";
                 }
                 return { ...s, messages: msgs };
             });
          }
      }
  };

  const handleModelChange = (newModel: ModelType) => {
    if (newModel === ModelType.PRO && (user?.plan === 'basic' || user?.plan === 'free')) {
        setIsUpgradeModalOpen(true);
        setShowModelMenu(false);
        return;
    }
    setModel(newModel);
    setShowModelMenu(false);
  };

  const handleUpgrade = async (plan: Plan) => {
      if (user) {
          const newCredits = plan === 'agent' ? 1500 : plan === 'plus' ? 1000 : plan === 'pro' ? 500 : 100;
          const updatedUser = { 
              ...user, 
              plan,
              credits: Math.max(user.credits, newCredits) 
          };
          setUser(updatedUser);
          await storageService.saveUser(updatedUser);
          
          setIsUpgradeModalOpen(false);
          if (plan === 'agent') {
              setModel(ModelType.PRO);
          }
      }
  };

  const handleUpdateSettings = async (newSettings: UserSettings) => {
      if (user) {
          const updatedUser = { ...user, settings: newSettings };
          setUser(updatedUser);
          await storageService.saveUser(updatedUser);
      }
  };

  const handleLogout = async () => {
      await storageService.logout();
      setUser(null);
      setSessions([]);
      setCurrentSessionId(null);
      setIsSettingsOpen(false);
  };

  const handleDeleteAllChats = async () => {
      if (user) {
          await storageService.clearUserChats(user.id);
          setSessions([]);
          createNewSession(user.id);
          setIsSettingsOpen(false);
      }
  };

  const handleArchiveAllChats = () => {
      if (user) {
          const newSessions = sessions.map(s => ({ ...s, isArchived: true }));
          setSessions(newSessions);
          // Save async
          storageService.saveUserChats(user.id, newSessions); 
          alert("All chats archived.");
          setIsSettingsOpen(false);
      }
  }

  const handleDeleteAccount = async () => {
      if (user) {
          await storageService.deleteAccount(user.id);
          handleLogout();
      }
  };

  const handleExportData = () => {
      if (user) {
          const data = {
              user: { name: user.name, email: user.email },
              sessions: sessions
          };
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `gemini-gpt-export-${Date.now()}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
      }
  }

  // Skip loading screen - show auth page immediately while checking session in background
  if (!user) {
      return <AuthPage onLogin={setUser} />;
  }

  return (
    <div className="flex h-screen w-full bg-main text-gray-100 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewChat={() => createNewSession(user.id)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        user={user}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative">
        
        {/* Top Bar - Solid Gray Background as requested */}
        <header className="w-full z-10 p-2 flex items-center justify-between bg-[#171717] border-b border-gray-800">
            <div className="flex items-center">
                 {!isSidebarOpen && (
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 mr-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        <PanelLeftOpen size={20} />
                    </button>
                )}
                
                {/* Model Selector */}
                <div className="relative">
                    <button 
                        onClick={() => setShowModelMenu(!showModelMenu)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-lg font-medium text-gray-300 hover:bg-gray-800 transition-colors"
                    >
                        <span className="text-gray-200">Gemini</span>
                        <span className="opacity-60 text-base">
                            {model === ModelType.FLASH ? 'Free' : model === ModelType.NERD ? 'Nerd' : 'Agent'}
                        </span>
                         <ChevronDown size={16} className="text-gray-500 mt-1" />
                    </button>
                    {/* Dropdown */}
                    {showModelMenu && (
                        <div className="absolute top-full left-0 mt-2 w-72 bg-[#2f2f2f] border border-gray-700 rounded-xl shadow-xl p-2 flex flex-col gap-1 z-50">
                             
                             {/* Free Mode (Flash) */}
                             <button 
                                onClick={() => handleModelChange(ModelType.FLASH)} 
                                className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-700 text-left ${model === ModelType.FLASH ? 'bg-gray-700' : ''}`}
                             >
                                 <div className="flex items-center gap-3">
                                     <div className="p-2 rounded border border-gray-600 bg-gray-800">
                                         <Zap size={16} className="text-yellow-400"/>
                                     </div>
                                     <div className="flex flex-col">
                                         <span className="font-medium text-sm">Free</span>
                                         <span className="text-xs text-gray-400">Great for everyday tasks</span>
                                     </div>
                                 </div>
                                 {model === ModelType.FLASH && <Check size={16} />}
                             </button>

                             {/* Nerd Mode (Flash Exp) */}
                             <button 
                                onClick={() => handleModelChange(ModelType.NERD)} 
                                className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-700 text-left ${model === ModelType.NERD ? 'bg-gray-700' : ''}`}
                             >
                                 <div className="flex items-center gap-3">
                                     <div className="p-2 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400">
                                         <Zap size={16} />
                                     </div>
                                     <div className="flex flex-col">
                                         <span className="font-medium text-sm">Nerd</span>
                                         <span className="text-xs text-gray-400">Precise & analytical reasoning</span>
                                     </div>
                                 </div>
                                 {model === ModelType.NERD && <Check size={16} />}
                             </button>

                             {/* Agent Mode (Pro) */}
                             <button 
                                onClick={() => handleModelChange(ModelType.PRO)} 
                                className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-700 text-left group ${model === ModelType.PRO ? 'bg-gray-700' : ''}`}
                             >
                                 <div className="flex items-center gap-3">
                                     <div className="p-2 rounded border border-purple-500/30 bg-purple-500/10 text-purple-400">
                                         <Sparkles size={16} />
                                     </div>
                                     <div className="flex flex-col">
                                         <span className="font-medium text-sm">Agent</span>
                                         <span className="text-xs text-gray-400">Advanced reasoning & images</span>
                                     </div>
                                 </div>
                                 {(user.plan === 'basic' || user.plan === 'free') ? (
                                     <div className="flex items-center gap-2">
                                        <div className="px-2 py-0.5 rounded-full border border-gray-600 text-[10px] font-medium text-gray-400 group-hover:bg-gray-600 transition-colors">
                                            Upgrade
                                        </div>
                                     </div>
                                 ) : (
                                    model === ModelType.PRO && <Check size={16} />
                                 )}
                             </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Credit Counter */}
                <div className="text-xs text-gray-400 border border-gray-700 px-3 py-1 rounded-full">
                    {user.credits} Credits
                </div>
                {/* User Menu / Avatar - Gray background, not transparent */}
                <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-sm cursor-pointer uppercase border border-gray-600 hover:border-gray-400 transition-colors">
                    {user.name.substring(0, 2)}
                </div>
            </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar w-full flex flex-col">
           {currentSession && currentSession.messages.length > 0 ? (
                <div className="flex-1 w-full pt-6 pb-4">
                    {currentSession.messages.map((msg, idx) => (
                        <ChatMessage 
                            key={idx} 
                            message={msg} 
                            isStreaming={isGenerating && idx === currentSession.messages.length - 1 && msg.role === 'model'}
                        />
                    ))}
                    <div ref={messagesEndRef} className="h-4" />
                </div>
           ) : (
                /* Empty State */
               <div className="flex-1 flex flex-col items-center justify-center h-full pt-10">
                   <div className="w-12 h-12 bg-white rounded-full mb-4 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-black">
                            <path d="M12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4Z" fill="currentColor" fillOpacity="0.1"/>
                            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM12 18.5C15.5899 18.5 18.5 15.5899 18.5 12C18.5 8.41015 15.5899 5.5 12 5.5C8.41015 5.5 5.5 8.41015 5.5 12C5.5 15.5899 8.41015 18.5 12 18.5Z" fill="currentColor"/>
                        </svg>
                   </div>
                   <h1 className="text-2xl font-semibold mb-8">Good to see you, {user.name}.</h1>
                   
                   {/* Suggestion Cards */}
                   <div className="grid grid-cols-2 gap-4 max-w-2xl w-full px-4">
                       <button onClick={() => handleSendMessage("Create a workout plan")} className="p-3 border border-gray-700 rounded-xl hover:bg-gray-800 text-left transition-colors">
                           <div className="text-sm font-medium">Create a workout plan</div>
                           <div className="text-xs text-gray-500">for resistance training</div>
                       </button>
                        <button onClick={() => handleSendMessage("Help me write an essay")} className="p-3 border border-gray-700 rounded-xl hover:bg-gray-800 text-left transition-colors">
                           <div className="text-sm font-medium">Help me write an essay</div>
                           <div className="text-xs text-gray-500">about technology trends</div>
                       </button>
                        <button onClick={() => handleSendMessage("Explain quantum physics")} className="p-3 border border-gray-700 rounded-xl hover:bg-gray-800 text-left transition-colors">
                           <div className="text-sm font-medium">Explain quantum physics</div>
                           <div className="text-xs text-gray-500">like I'm 5 years old</div>
                       </button>
                        <button onClick={() => handleSendMessage("Debug this Python code")} className="p-3 border border-gray-700 rounded-xl hover:bg-gray-800 text-left transition-colors">
                           <div className="text-sm font-medium">Debug this Python code</div>
                           <div className="text-xs text-gray-500">for a binary search tree</div>
                       </button>
                   </div>
               </div>
           )}
        </main>

        {/* Input Area */}
        <InputArea 
            onSend={handleSendMessage} 
            onStop={handleStopGenerating}
            isLoading={isGenerating} 
        />
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        user={user}
        onUpgrade={() => {
            setIsSettingsOpen(false);
            setIsUpgradeModalOpen(true);
        }}
        onLogout={handleLogout}
        onDeleteAllChats={handleDeleteAllChats}
        onArchiveAllChats={handleArchiveAllChats}
        onDeleteAccount={handleDeleteAccount}
        onUpdateSettings={handleUpdateSettings}
        onExportData={handleExportData}
      />

      <UpgradeModal 
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgrade={handleUpgrade}
        currentPlan={user.plan}
      />
    </div>
  );
}

export default App;