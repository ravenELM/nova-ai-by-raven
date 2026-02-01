import React, { useState, useEffect } from 'react';
import { X, Globe, Moon, Shield, Database, Smartphone, Lock, User as UserIcon, Monitor, ChevronRight, Download, Archive } from 'lucide-react';
import { User, UserSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpgrade: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onDeleteAllChats: () => void;
  onArchiveAllChats: () => void;
  onUpdateSettings: (settings: UserSettings) => void;
  onExportData: () => void;
}

type Tab = 'General' | 'Personalization' | 'Data' | 'Account' | 'Security';

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, 
    onClose, 
    user, 
    onUpgrade, 
    onLogout, 
    onDeleteAccount, 
    onDeleteAllChats,
    onArchiveAllChats,
    onUpdateSettings,
    onExportData
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('General');
  const [localSettings, setLocalSettings] = useState<UserSettings>(user.settings);
  const [customInstructionsInput, setCustomInstructionsInput] = useState(user.settings.customInstructions);
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);

  useEffect(() => {
      setLocalSettings(user.settings);
      setCustomInstructionsInput(user.settings.customInstructions);
  }, [user]);

  const handleSettingChange = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      const newSettings = { ...localSettings, [key]: value };
      setLocalSettings(newSettings);
      onUpdateSettings(newSettings);
  };

  if (!isOpen) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'General':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-200">Theme</span>
              <div className="flex items-center gap-2">
                 <select 
                    value={localSettings.theme}
                    onChange={(e) => handleSettingChange('theme', e.target.value as any)}
                    className="bg-[#2f2f2f] text-sm text-white border border-gray-600 rounded-md p-1 outline-none"
                 >
                     <option value="system">System</option>
                     <option value="dark">Dark</option>
                     <option value="light">Light</option>
                 </select>
              </div>
            </div>
             <div className="flex justify-between items-center border-t border-gray-700 pt-4">
              <span className="text-gray-200">Always show code when using data analyst</span>
              <button 
                onClick={() => handleSettingChange('alwaysShowCode', !localSettings.alwaysShowCode)}
                className={`w-10 h-6 rounded-full relative transition-colors ${localSettings.alwaysShowCode ? 'bg-green-600' : 'bg-gray-600'}`}
              >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${localSettings.alwaysShowCode ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
            <div className="flex justify-between items-center border-t border-gray-700 pt-4">
              <span className="text-gray-200">Language</span>
              <select 
                    value={localSettings.language}
                    onChange={(e) => handleSettingChange('language', e.target.value)}
                    className="bg-[#2f2f2f] text-sm text-white border border-gray-600 rounded-md p-1 outline-none"
                 >
                     <option value="Auto-detect">Auto-detect</option>
                     <option value="English">English</option>
                     <option value="Spanish">Spanish</option>
                     <option value="French">French</option>
                     <option value="Romanian">Romanian</option>
                 </select>
            </div>
             <div className="flex justify-between items-center border-t border-gray-700 pt-4">
              <span className="text-gray-200">Archive all chats</span>
              <button 
                onClick={() => {
                    if(confirm("Archive all chats? They will be hidden from the sidebar.")) {
                        onArchiveAllChats();
                    }
                }}
                className="px-3 py-1.5 border border-gray-600 rounded-lg text-sm hover:bg-gray-700 flex items-center gap-2"
              >
                  <Archive size={14}/> Archive all
              </button>
            </div>
            <div className="flex justify-between items-center border-t border-gray-700 pt-4">
              <span className="text-gray-200">Delete all chats</span>
              <button 
                onClick={() => {
                    if(confirm("Are you sure you want to delete all chats? This cannot be undone.")) {
                        onDeleteAllChats();
                    }
                }}
                className="px-3 py-1.5 bg-red-600/10 border border-red-900/50 text-red-500 rounded-lg text-sm hover:bg-red-600/20"
              >
                  Delete all
              </button>
            </div>
          </div>
        );
      case 'Account':
        return (
           <div className="space-y-6">
               <div className="flex justify-between items-center">
                   <span className="text-gray-200">Email</span>
                   <span className="text-sm text-gray-400">{user.email}</span>
               </div>
               <div className="flex justify-between items-center border-t border-gray-700 pt-4">
                   <span className="text-gray-200">Subscription</span>
                   <div className="flex items-center gap-3">
                       <span className="text-sm text-gray-400 capitalize">{user.plan} Plan</span>
                       {(user.plan === 'free' || user.plan === 'basic') && (
                           <button 
                             onClick={onUpgrade}
                             className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                           >
                               Upgrade plan
                           </button>
                       )}
                   </div>
               </div>
           </div>
        );
      case 'Personalization':
        return (
            <div className="space-y-6">
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsEditingInstructions(!isEditingInstructions)}>
                        <div>
                            <div className="text-gray-200">Custom instructions</div>
                            <div className="text-sm text-gray-500">Customize how Gemini responds</div>
                        </div>
                        <button className="flex items-center text-gray-400 hover:text-white">
                            <span className="text-sm mr-2">{localSettings.customInstructions ? 'On' : 'Off'}</span>
                            <ChevronRight size={16} className={`transform transition-transform ${isEditingInstructions ? 'rotate-90' : ''}`} />
                        </button>
                    </div>
                    
                    {isEditingInstructions && (
                        <div className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-700 space-y-3">
                            <p className="text-sm text-gray-400">What would you like Gemini to know about you to provide better responses?</p>
                            <textarea 
                                value={customInstructionsInput}
                                onChange={(e) => setCustomInstructionsInput(e.target.value)}
                                placeholder="E.g., I'm a developer, I prefer concise answers, always write code in Python..."
                                className="w-full h-32 bg-[#2f2f2f] rounded-lg p-3 text-sm text-white focus:outline-none border border-gray-600 focus:border-blue-500 resize-none"
                            />
                            <div className="flex justify-end gap-2">
                                <button 
                                    onClick={() => {
                                        setCustomInstructionsInput(user.settings.customInstructions);
                                        setIsEditingInstructions(false);
                                    }}
                                    className="px-3 py-1.5 text-sm text-gray-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => {
                                        handleSettingChange('customInstructions', customInstructionsInput);
                                        setIsEditingInstructions(false);
                                    }}
                                    className="px-3 py-1.5 bg-white text-black text-sm rounded-lg font-medium"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center border-t border-gray-700 pt-4">
                    <div>
                        <div className="text-gray-200">Memory</div>
                        <div className="text-sm text-gray-500">Gemini will remember what you tell it</div>
                    </div>
                    <button 
                        onClick={() => handleSettingChange('enableMemory', !localSettings.enableMemory)}
                        className={`w-10 h-6 rounded-full relative transition-colors ${localSettings.enableMemory ? 'bg-green-600' : 'bg-gray-600'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${localSettings.enableMemory ? 'right-1' : 'left-1'}`}></div>
                    </button>
                </div>
            </div>
        );
      case 'Data':
        return (
            <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <div>
                        <div className="text-gray-200">Chat history & training</div>
                        <div className="text-sm text-gray-500">Save new chats to this browser</div>
                    </div>
                    <button 
                        onClick={() => handleSettingChange('enableHistory', !localSettings.enableHistory)}
                        className={`w-10 h-6 rounded-full relative transition-colors ${localSettings.enableHistory ? 'bg-green-600' : 'bg-gray-600'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${localSettings.enableHistory ? 'right-1' : 'left-1'}`}></div>
                    </button>
                </div>
                <div className="flex justify-between items-center border-t border-gray-700 pt-4">
                    <div>
                        <div className="text-gray-200">Shared links</div>
                        <div className="text-sm text-gray-500">Manage links you have created</div>
                    </div>
                    <button className="px-3 py-1.5 border border-gray-600 rounded-lg text-sm hover:bg-gray-700">Manage</button>
                </div>
                <div className="flex justify-between items-center border-t border-gray-700 pt-4">
                    <div>
                        <div className="text-gray-200">Export data</div>
                        <div className="text-sm text-gray-500">Request a copy of your personal data</div>
                    </div>
                    <button 
                        onClick={onExportData}
                        className="px-3 py-1.5 border border-gray-600 rounded-lg text-sm hover:bg-gray-700 flex items-center gap-2"
                    >
                        <Download size={14}/> Export
                    </button>
                </div>
                <div className="flex justify-between items-center border-t border-gray-700 pt-4">
                    <div>
                        <div className="text-gray-200">Delete account</div>
                        <div className="text-sm text-gray-500">Permanently delete your account and data</div>
                    </div>
                     <button 
                        onClick={() => {
                            if(confirm("Are you sure? This will delete your account and all data permanently.")) {
                                onDeleteAccount();
                            }
                        }}
                        className="px-3 py-1.5 bg-red-600/10 border border-red-900/50 text-red-500 rounded-lg text-sm hover:bg-red-600/20"
                    >
                         Delete
                     </button>
                </div>
            </div>
        );
      case 'Security':
        return (
            <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <div>
                        <div className="text-gray-200">Multi-factor authentication</div>
                        <div className="text-sm text-gray-500">Require an extra security step to log in</div>
                    </div>
                     <button className="px-3 py-1.5 border border-gray-600 rounded-lg text-sm hover:bg-gray-700">Enable</button>
                </div>
                <div className="flex justify-between items-center border-t border-gray-700 pt-4">
                    <div>
                        <div className="text-gray-200">Log out of all devices</div>
                        <div className="text-sm text-gray-500">Log out of all active sessions</div>
                    </div>
                    <button 
                        onClick={onLogout}
                        className="px-3 py-1.5 border border-gray-600 rounded-lg text-sm hover:bg-gray-700"
                    >
                        Log out all
                    </button>
                </div>
            </div>
        );
      default:
        return <div className="text-gray-500 italic">This section is under construction.</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#212121] w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-800 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 flex justify-between items-center border-b border-gray-800">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 bg-transparent p-2 space-y-1 border-r border-gray-800 overflow-y-auto">
            <button 
                onClick={() => setActiveTab('General')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${activeTab === 'General' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
            >
                <Monitor size={16} /> General
            </button>
            <button 
                onClick={() => setActiveTab('Personalization')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${activeTab === 'Personalization' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
            >
                <UserIcon size={16} /> Personalization
            </button>
             <button 
                onClick={() => setActiveTab('Data')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${activeTab === 'Data' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
            >
                <Database size={16} /> Data controls
            </button>
             <button 
                onClick={() => setActiveTab('Security')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${activeTab === 'Security' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
            >
                <Shield size={16} /> Security
            </button>
             <button 
                onClick={() => setActiveTab('Account')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${activeTab === 'Account' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
            >
                <UserIcon size={16} /> Account
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
             {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;