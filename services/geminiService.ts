import { Message, ModelType, Attachment } from "../types";

// Use Puter.js for free Gemini API access - no API key needed!
// Models:
// - gemini-2.5-flash (basic mode)
// - gemini-3-pro-preview (agent mode)
// - gemini-2.0-flash-exp:free (nerd mode - precise & analytical)
// Image generation:
// - gemini-2.5-flash-image-preview (Nano Banana - fast)
// - gemini-3-pro-image-preview (Nano Banana Pro - high quality)

// Helper to remove data URL prefix
const stripBase64Prefix = (dataUrl: string) => {
    return dataUrl.split(',')[1] || dataUrl;
};

// Helper to convert base64 to File object for Puter.js
const base64ToFile = (base64Data: string, mimeType: string, filename: string): File => {
    const byteString = atob(stripBase64Prefix(base64Data));
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new File([ab], filename, { type: mimeType });
};

// Check if Puter.js is available
const isPuterAvailable = (): boolean => {
    return typeof window !== 'undefined' && (window as any).puter && (window as any).puter.ai;
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
    if (!isPuterAvailable()) {
      throw new Error("Puter.js is not available. Please check your internet connection.");
    }

    const puter = (window as any).puter;
    
    // Build system instruction
    const baseInstruction = `You are a helpful, intelligent AI assistant named Nova. The user's name is ${userName}. Address them by name occasionally where appropriate.`;
    const finalSystemInstruction = systemInstructionText 
        ? `${baseInstruction}\n\nUser Custom Instructions:\n${systemInstructionText}`
        : baseInstruction;

    // Get the last message
    const lastMessage = messages[messages.length - 1];
    
    // Build conversation history for context
    const conversationHistory = messages.slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
    }));

    // Build the current message content
    let messageContent: any = lastMessage.content || '';
    let imageUrl: string | undefined;

    // Handle image attachments
    if (lastMessage.attachments && lastMessage.attachments.length > 0) {
        const imageAttachment = lastMessage.attachments.find(att => att.type === 'image');
        if (imageAttachment) {
            imageUrl = imageAttachment.data; // Base64 data URL
        }
    }

    // Call Puter.js AI chat with streaming
    const response = await puter.ai.chat(messageContent, {
        model: model,
        stream: true,
        systemMessage: finalSystemInstruction
    });

    // Handle streaming response
    for await (const part of response) {
        if (signal?.aborted) {
            break;
        }
        if (part?.text) {
            onChunk(part.text);
        }
    }

  } catch (error: any) {
    if (signal?.aborted) return;
    console.error("Error calling Puter.js AI:", error);
    
    let errorMessage = "\n\n[Error: Unable to get response. Please check your connection.]";

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
    try {
        if (!isPuterAvailable()) {
            throw new Error("Puter.js is not available.");
        }

        const puter = (window as any).puter;
        
        // Determine Model Logic using Puter.js Nano Banana models
        // Flash -> gemini-2.5-flash-image-preview (Nano Banana - fast)
        // Pro -> gemini-3-pro-image-preview (Nano Banana Pro - high quality)
        let modelName = 'gemini-2.5-flash-image-preview';
        
        if (modelType === ModelType.PRO) {
            modelName = 'gemini-3-pro-image-preview';
        }

        // Generate image using Puter.js
        const imageElement = await puter.ai.txt2img(prompt, {
            model: modelName
        });

        // Convert the returned image element to base64 data
        if (imageElement && imageElement.src) {
            return {
                type: 'image',
                mimeType: 'image/png',
                data: imageElement.src, // Puter returns data URL
                name: 'Generated Image'
            };
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