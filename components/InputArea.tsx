import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, ArrowUp, Mic, Headphones, Square, X, FileText, Image as ImageIcon } from 'lucide-react';
import { Attachment } from '../types';

interface InputAreaProps {
  onSend: (message: string, attachments: Attachment[]) => void;
  onStop: () => void;
  isLoading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSend, onStop, isLoading }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false; // Stop automatically after speaking a sentence
        recognition.interimResults = false;
        recognition.lang = 'en-US'; // Default to English

        recognition.onstart = () => setIsListening(true);
        
        recognition.onend = () => setIsListening(false);
        
        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInput(prev => {
              const trimmed = prev.trim();
              return trimmed ? `${trimmed} ${transcript}` : transcript;
            });
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      const newAttachments: Attachment[] = [];

      for (const file of files) {
        const reader = new FileReader();
        
        await new Promise<void>((resolve) => {
          reader.onload = (event) => {
             if (event.target?.result) {
                 const base64 = event.target.result as string;
                 const type = file.type.startsWith('image/') ? 'image' : 'file';
                 newAttachments.push({
                     type,
                     mimeType: file.type,
                     data: base64,
                     name: file.name
                 });
             }
             resolve();
          };
          reader.readAsDataURL(file);
        });
      }
      
      setAttachments(prev => [...prev, ...newAttachments]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
      setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;
    onSend(input, attachments);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="w-full pt-2 pb-4">
      <div className="mx-auto md:max-w-3xl lg:max-w-[40rem] xl:max-w-[48rem] px-4">
        <div className={`relative flex w-full flex-col rounded-[26px] p-2 border transition-colors shadow-lg ${isListening ? 'bg-gray-800 border-red-500/50' : 'bg-gray-750 border-transparent focus-within:border-gray-600'}`}>
          
          {/* Attachment Previews */}
          {attachments.length > 0 && (
              <div className="flex gap-2 p-2 overflow-x-auto">
                  {attachments.map((att, idx) => (
                      <div key={idx} className="relative group shrink-0">
                          <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-600 bg-gray-800 flex items-center justify-center">
                              {att.type === 'image' ? (
                                  <img src={att.data} alt={att.name} className="w-full h-full object-cover" />
                              ) : (
                                  <FileText className="text-gray-400" size={24} />
                              )}
                          </div>
                          <button 
                            onClick={() => removeAttachment(idx)}
                            className="absolute -top-1 -right-1 bg-gray-900 rounded-full p-0.5 text-gray-400 hover:text-white border border-gray-600"
                          >
                              <X size={12} />
                          </button>
                      </div>
                  ))}
              </div>
          )}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening..." : "Ask anything"}
            rows={1}
            className="w-full resize-none bg-transparent px-4 py-3 min-h-[44px] max-h-[200px] outline-none text-white placeholder-gray-400 overflow-y-auto"
            style={{ overflowWrap: 'anywhere' }}
          />

          <input 
             type="file" 
             multiple 
             ref={fileInputRef} 
             className="hidden" 
             onChange={handleFileSelect}
             accept="image/*,application/pdf,text/*"
          />

          <div className="flex justify-between items-center px-2 pb-1">
             <div className="flex items-center gap-2">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors" 
                    title="Attach file"
                >
                    <Paperclip size={20} />
                </button>
             </div>
             
             <div className="flex items-center gap-2">
                 {/* Mic Button */}
                 {!input.trim() && !isLoading && attachments.length === 0 && (
                    <button 
                      onClick={toggleListening}
                      className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                      title={isListening ? "Stop recording" : "Use Microphone"}
                    >
                        {isListening ? <Square size={18} fill="currentColor" /> : <Mic size={20} />}
                    </button>
                 )}

                {/* Send / Stop Button */}
                <button 
                    onClick={isLoading ? onStop : handleSend}
                    disabled={(!input.trim() && attachments.length === 0) && !isLoading}
                    className={`p-2 rounded-full transition-all duration-200 ${
                        input.trim() || attachments.length > 0 || isLoading
                        ? 'bg-white text-black' 
                        : 'bg-[#676767] text-[#2f2f2f] cursor-default'
                    }`}
                >
                    {isLoading ? (
                         <Square size={20} fill="currentColor" className="text-black"/>
                    ) : (
                         (input.trim() || attachments.length > 0) ? <ArrowUp size={20} strokeWidth={3} /> : <Headphones size={20} />
                    )}
                </button>
             </div>
          </div>
        </div>
        <div className="text-center text-xs text-gray-500 mt-2">
             Gemini can make mistakes. Check important info.
        </div>
      </div>
    </div>
  );
};

export default InputArea;