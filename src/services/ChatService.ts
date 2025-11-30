// ChatService.ts - Service for managing vendor chats

import axios from 'axios';

// Chat message type
export interface ChatMessage {
    messageId: string;
    chatId: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
}

// Chat type
export interface Chat {
    chatId: string;
    vendorId: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messages: ChatMessage[];
}

// Create chat request
export interface CreateChatRequest {
    vendorId: string;
    title: string;
}

// Send message request
export interface SendMessageRequest {
    content: string;
}

const API_BASE = '/api';

export class ChatService {
    private axios = axios.create({
        baseURL: API_BASE,
    });

    /**
     * Get all chats
     */
    async getAllChats(): Promise<Chat[]> {
        try {
            const response = await this.axios.get<Chat[]>('/chats');
            return response.data;
        } catch (error) {
            console.error('Error fetching chats:', error);
            return [];
        }
    }

    /**
     * Create a new chat for a vendor
     */
    async createChat(request: CreateChatRequest): Promise<Chat | null> {
        try {
            const response = await this.axios.post<Chat>('/chats', request);
            return response.data;
        } catch (error) {
            console.error('Error creating chat:', error);
            return null;
        }
    }

    /**
     * Get chat for a specific vendor
     */
    async getVendorChat(vendorId: string): Promise<Chat | null> {
        try {
            const response = await this.axios.get<Chat>(`/vendors/${vendorId}/chat`);
            return response.data;
        } catch (error) {
            console.error('Error fetching vendor chat:', error);
            return null;
        }
    }

    /**
     * Send a message to a chat and get AI response
     */
    async sendMessage(chatId: string, content: string): Promise<ChatMessage | null> {
        try {
            const response = await this.axios.post<ChatMessage>(`/chats/${chatId}/messages`, {
                content
            });
            return response.data;
        } catch (error) {
            console.error('Error sending message:', error);
            return null;
        }
    }

    /**
     * Ensure a chat exists for a vendor, create if not
     */
    async ensureVendorChat(vendorId: string, vendorName: string): Promise<Chat | null> {
        // First try to get existing chat
        const existingChat = await this.getVendorChat(vendorId);
        if (existingChat) {
            return existingChat;
        }

        // Create new chat if doesn't exist
        const newChat = await this.createChat({
            vendorId: vendorId,
            title: `${vendorName}_chat`
        });

        return newChat;
    }
}

// Singleton instance
export const chatService = new ChatService();
