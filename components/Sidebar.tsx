import React from 'react';
import { Plus, Search, PanelLeftClose, Settings, User as UserIcon, LogOut, Sparkles } from 'lucide-react';
import { ChatSession, User } from '../types';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  user: User;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  toggleSidebar,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onOpenSettings,
  user
}) => {
  // Filter out archived sessions
  const visibleSessions = sessions.filter(s => !s.isArchived);

  // Group sessions by date
  const today = new Date().setHours(0, 0, 0, 0);
  
  const todaySessions = visibleSessions.filter(s => s.createdAt >= today);
  const previousSessions = visibleSessions.filter(s => s.createdAt < today);

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-sidebar text-gray-100 w-[260px] border-r border-white/5 transition-all duration-300 flex-shrink-0">
      {/* Header */}
      <div className="p-3 pb-0">
        <div className="flex justify-between items-center mb-4 px-2 pt-2">
            <button 
                onClick={toggleSidebar}
                className="p-2 hover:bg-gray-750 rounded-lg text-gray-400 hover:text-white transition-colors"
                title="Close sidebar"
            >
                <PanelLeftClose size={20} />
            </button>
            <button 
                onClick={onNewChat}
                className="p-2 hover:bg-gray-750 rounded-lg text-gray-400 hover:text-white transition-colors"
                title="New chat"
            >
                 <Plus size={20} />
            </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3">
        
        {/* Section: Today */}
        {todaySessions.length > 0 && (
            <div className="mb-6">
                <h3 className="px-3 text-xs font-semibold text-gray-500 mb-2">Today</h3>
                <div className="flex flex-col gap-0.5">
                    {todaySessions.map(session => (
                    <button
                        key={session.id}
                        onClick={() => onSelectSession(session.id)}
                        className={`text-left px-3 py-2 rounded-lg text-sm truncate w-full transition-colors ${
                        currentSessionId === session.id ? 'bg-gray-750' : 'hover:bg-gray-750/50'
                        }`}
                    >
                        {session.title}
                    </button>
                    ))}
                </div>
            </div>
        )}

        {/* Section: Previous */}
        {previousSessions.length > 0 && (
            <div className="mb-6">
                <h3 className="px-3 text-xs font-semibold text-gray-500 mb-2">Previous 7 Days</h3>
                <div className="flex flex-col gap-0.5">
                    {previousSessions.map(session => (
                    <button
                        key={session.id}
                        onClick={() => onSelectSession(session.id)}
                        className={`text-left px-3 py-2 rounded-lg text-sm truncate w-full transition-colors ${
                        currentSessionId === session.id ? 'bg-gray-750' : 'hover:bg-gray-750/50'
                        }`}
                    >
                        {session.title}
                    </button>
                    ))}
                </div>
            </div>
        )}
        
        {visibleSessions.length === 0 && (
             <div className="px-3 py-10 text-center text-sm text-gray-500">
                {sessions.length > 0 ? "All chats archived." : "No history yet."}
             </div>
        )}

      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/10">
         <button className="flex items-center gap-3 px-3 py-3 w-full hover:bg-gray-750 rounded-xl transition-colors text-left group">
            <div className="relative">
                 <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold uppercase">
                     {user.name.substring(0, 2)}
                 </div>
            </div>
            <div className="flex-1 overflow-hidden">
                <div className="font-medium text-sm truncate">{user.name}</div>
                <div className="text-xs text-gray-400 capitalize">{user.plan} Plan</div>
            </div>
        </button>
         <button 
            onClick={onOpenSettings}
            className="flex items-center gap-3 px-3 py-2 mt-1 w-full text-sm text-gray-400 hover:text-white hover:bg-gray-750 rounded-lg transition-colors"
         >
            <Settings size={18} />
            <span>Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
