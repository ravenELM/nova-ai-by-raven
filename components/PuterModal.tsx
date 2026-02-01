import React, { useState } from 'react';
import { X, User, ArrowRight, Check } from 'lucide-react';
import { PuterProvider } from './PuterProvider';

interface PuterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
  showPuterOnNewChat: boolean;
  setShowPuterOnNewChat: (show: boolean) => void;
  puterConnected: boolean;
}

const PuterModal: React.FC<PuterModalProps> = ({ 
  isOpen, 
  onClose, 
  onConnect,
  showPuterOnNewChat,
  setShowPuterOnNewChat,
  puterConnected
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'account'>('general');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#212121] w-full max-w-lg rounded-2xl shadow-2xl border border-gray-800 flex flex-col max-h-[85vh]">
        <div className="p-4 flex justify-between items-center border-b border-gray-800">
          <h2 className="text-lg font-semibold">Puter Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 bg-transparent p-2 space-y-1 border-r border-gray-800">
            <button 
              onClick={() => setActiveTab('general')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${activeTab === 'general' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
            >
              General
            </button>
            <button 
              onClick={() => setActiveTab('account')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${activeTab === 'account' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
            >
              Puter Account
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-gray-200">Show puter on new chat</div>
                    <div className="text-sm text-gray-500">Show these settings before starting a new chat</div>
                  </div>
                  <button 
                    onClick={() => setShowPuterOnNewChat(!showPuterOnNewChat)}
                    className={`w-10 h-6 rounded-full relative transition-colors ${showPuterOnNewChat ? 'bg-green-600' : 'bg-gray-600'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showPuterOnNewChat ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <User size={40} className="text-gray-500"/>
                </div>
                {puterConnected ? (
                  <div className='flex flex-col items-center justify-center gap-2'>
                    <div className="text-lg font-semibold">Puter is Connected</div>
                    <div className="text-sm text-gray-500">You can now use Puter features in your chats.</div>
                    <div className="flex items-center gap-2 text-green-500 mt-2">
                      <Check size={16} />
                      <span>Connected</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-lg font-semibold">Connect to Puter</div>
                    <div className="text-sm text-gray-500 mb-6">Sign in to your Puter account to access your files and apps.</div>
                    <PuterProvider>
                        <button 
                        onClick={onConnect}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors"
                        >
                            <span>Sign in with Puter</span>
                            <ArrowRight size={16}/>
                        </button>
                    </PuterProvider>
                    <div className="text-xs text-gray-500 mt-4">Puter is a cloud-based operating system.</div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PuterModal;
