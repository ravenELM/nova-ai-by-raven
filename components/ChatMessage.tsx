import React from 'react';
import { Copy, ThumbsUp, ThumbsDown, RefreshCw, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming }) => {
  const isUser = message.role === 'user';
  const isGeneratingImage = message.isGeneratingImage;

  // Add a blinking cursor character if streaming text
  const displayContent = isStreaming ? message.content + ' ▍' : message.content;

  return (
    <div className={`group w-full text-gray-100 ${isUser ? 'bg-transparent' : 'bg-transparent'} `}>
      <div className="text-base gap-4 md:gap-6 md:max-w-3xl lg:max-w-[40rem] xl:max-w-[48rem] mx-auto p-4 flex">
        
        {/* Avatar Area */}
        {isUser ? (
             /* User Message: Right Aligned Bubble Style */
             <div className="w-full flex justify-end">
                <div className="flex flex-col items-end max-w-[85%]">
                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2 justify-end">
                            {message.attachments.map((att, i) => (
                                <div key={i} className="overflow-hidden rounded-lg border border-gray-700 bg-gray-800">
                                    {att.type === 'image' ? (
                                        <img src={att.data} alt="attachment" className="max-w-[200px] max-h-[200px] object-cover" />
                                    ) : (
                                        <div className="flex items-center gap-2 p-3">
                                            <FileText size={20} className="text-gray-400" />
                                            <span className="text-sm text-gray-200">{att.name}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* Text Content */}
                    {message.content && (
                        <div className="bg-[#2f2f2f] px-5 py-2.5 rounded-3xl whitespace-pre-wrap">
                            {message.content}
                        </div>
                    )}
                </div>
             </div>
        ) : (
             /* Model Message: Left Aligned, Icon + Text */
             <>
                <div className="flex-shrink-0 flex flex-col relative items-end">
                    <div className="w-8 h-8 rounded-full border border-gray-600 flex items-center justify-center overflow-hidden">
                        {/* Gemini Sparkle Logo */}
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-400">
                             <path d="M10.6625 0.5C11.5369 5.56708 14.9781 9.45331 19.5 10.6625C14.9781 11.8717 11.5369 15.7579 10.6625 20.825C9.78808 15.7579 6.34692 11.8717 1.825 10.6625C6.34692 9.45331 9.78808 5.56708 10.6625 0.5Z" fill="url(#gemini-gradient)"/>
                             <defs>
                                <linearGradient id="gemini-gradient" x1="1.825" y1="0.5" x2="19.5" y2="20.825" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#4E96FF"/>
                                    <stop offset="1" stopColor="#AA78FF"/>
                                </linearGradient>
                             </defs>
                         </svg>
                    </div>
                </div>
                
                <div className="relative flex-1 overflow-hidden">
                    {/* Image Generation State */}
                    {isGeneratingImage ? (
                        <div className="mb-2">
                             <p className="text-gray-300 text-sm mb-3">Creating image</p>
                             <div className="w-full max-w-[400px] aspect-square rounded-2xl bg-gradient-to-br from-[#4b3b55] via-[#5b3b4f] to-[#503b55] animate-pulse relative overflow-hidden border border-white/10">
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                             </div>
                        </div>
                    ) : (
                        <>
                             {/* Generated Images or Attachments from Model */}
                             {message.attachments && message.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {message.attachments.map((att, i) => (
                                        <div key={i} className="overflow-hidden rounded-xl border border-white/10 shadow-md">
                                            {att.type === 'image' ? (
                                                <img src={att.data} alt="generated result" className="max-w-[400px] w-full h-auto object-cover" />
                                            ) : (
                                                <div className="flex items-center gap-2 p-3 bg-gray-800">
                                                    <FileText size={20} className="text-gray-400" />
                                                    <span className="text-sm text-gray-200">{att.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                             )}

                             <div className="prose prose-invert max-w-none leading-7">
                                {message.content || isStreaming ? (
                                     <ReactMarkdown>{displayContent}</ReactMarkdown>
                                ) : !message.attachments?.length ? (
                                     <span className="w-2 h-4 bg-gray-400 inline-block animate-pulse"></span>
                                ) : null}
                            </div>
                        </>
                    )}
                    
                    {!isStreaming && !isGeneratingImage && (
                         <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1 rounded-md hover:bg-gray-700 text-gray-400 hover:text-gray-200">
                                <Copy size={16} />
                            </button>
                             <button className="p-1 rounded-md hover:bg-gray-700 text-gray-400 hover:text-gray-200">
                                <RefreshCw size={16} />
                            </button>
                            <button className="p-1 rounded-md hover:bg-gray-700 text-gray-400 hover:text-gray-200">
                                <ThumbsUp size={16} />
                            </button>
                             <button className="p-1 rounded-md hover:bg-gray-700 text-gray-400 hover:text-gray-200">
                                <ThumbsDown size={16} />
                            </button>
                        </div>
                    )}
                </div>
             </>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;