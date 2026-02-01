import { GoogleGenAI } from "@google/genai";
import { Message, ModelType, Attachment } from "../types";

const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to remove data URL prefix
const stripBase64Prefix = (dataUrl: string) => {
    return dataUrl.split(',')[1] || dataUrl;
};

export const streamChatResponse = async (
  messages: Message[],
  model: ModelType,
  userName: string,
  systemInstructionText: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal
) => {
  try {
    const ai = getAiClient();
    const baseInstruction = `You are a helpful, intelligent AI assistant named Gemini. The user's name is ${userName}. Address them by name occasionally where appropriate.`;
    const finalSystemInstruction = systemInstructionText 
        ? `${baseInstruction}\n\nUser Custom Instructions:\n${systemInstructionText}`
        : baseInstruction;

    // Map history to API format
    const historyParts = messages.slice(0, -1).map(m => {
        const parts: any[] = [];
        
        if (m.attachments && m.attachments.length > 0) {
            m.attachments.forEach(att => {
                parts.push({
                    inlineData: {
                        mimeType: att.mimeType,
                        data: stripBase64Prefix(att.data)
                    }
                });
            });
        }
        
        if (m.content) {
            parts.push({ text: m.content });
        }

        return {
            role: m.role,
            parts: parts
        };
    });

    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: finalSystemInstruction,
      },
      history: historyParts,
    });

    const lastMessage = messages[messages.length - 1];
    
    // Construct the final message content
    const messageParts: any[] = [];
    if (lastMessage.attachments && lastMessage.attachments.length > 0) {
        lastMessage.attachments.forEach(att => {
            messageParts.push({
                inlineData: {
                    mimeType: att.mimeType,
                    data: stripBase64Prefix(att.data)
                }
            });
        });
    }
    if (lastMessage.content) {
        messageParts.push({ text: lastMessage.content });
    }

    const result = await chat.sendMessageStream({
      message: messageParts,
    });

    for await (const chunk of result) {
      if (signal?.aborted) {
          break;
      }
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }
  } catch (error: any) {
    if (signal?.aborted) return;
    console.error("Error calling Gemini API:", error);
    
    let errorMessage = "\n\n[Error: Unable to get response from Gemini API. Please check your connection and API key.]";

    // Handle Rate Limits / Quota Issues
    if (
        error?.status === 429 || 
        error?.status === 'RESOURCE_EXHAUSTED' || 
        error?.message?.includes('quota') ||
        error?.message?.includes('429')
    ) {
        errorMessage = "\n\n[Error: You have exceeded the API rate limit. Please wait a moment before trying again.]";
    }
    
    onChunk(errorMessage);
  }
};

export const generateImage = async (prompt: string, modelType: ModelType): Promise<Attachment | null> => {
    // 1. Determine Model Logic
    // Flash -> gemini-2.5-flash-image (Nano Banana)
    // Pro -> gemini-3-pro-image-preview (Nano Banana Pro)
    let modelName = 'gemini-2.5-flash-image';
    
    if (modelType === ModelType.PRO) {
        modelName = 'gemini-3-pro-image-preview';

        // 2. Pro model requires User API Key selection check
        if (typeof window !== 'undefined' && (window as any).aistudio) {
            try {
                const hasKey = await (window as any).aistudio.hasSelectedApiKey();
                if (!hasKey) {
                    const success = await (window as any).aistudio.openSelectKey();
                    if (!success) {
                        throw new Error("API Key selection is required for high-quality image generation.");
                    }
                }
            } catch (e) {
                console.error("Error checking API key:", e);
                // Fallback or proceed if environment is different (e.g. dev)
            }
        }
    }

    // 3. Create fresh client instance just before call
    const ai = getAiClient();

    // Configure image options based on model
    const imageConfig: any = {
        aspectRatio: "1:1"
    };
    
    // imageSize is only supported by the Pro model
    if (modelName === 'gemini-3-pro-image-preview') {
        imageConfig.imageSize = "1K";
    }

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: {
                parts: [{ text: prompt }]
            },
            config: {
                imageConfig
            }
        });

        // 4. Extract Image from Response
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return {
                        type: 'image',
                        mimeType: part.inlineData.mimeType || 'image/png',
                        data: `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`,
                        name: 'Generated Image'
                    };
                }
            }
        }
        return null;

    } catch (error: any) {
        console.error("Image generation error:", error);
         if (
            error?.status === 429 || 
            error?.status === 'RESOURCE_EXHAUSTED' || 
            error?.message?.includes('quota') ||
            error?.message?.includes('429')
        ) {
            throw new Error("API rate limit exceeded. Please try again later.");
        }
        throw error;
    }
};

export const generateTitle = async (firstMessage: string): Promise<string> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a very short, concise title (max 4 words) for a chat that starts with: "${firstMessage}". Do not use quotes.`,
        });
        return response.text?.trim() || "New Chat";
    } catch (e) {
        return "New Chat";
    }
}