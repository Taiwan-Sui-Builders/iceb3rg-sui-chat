// Core types for Sui Chat application

export interface User {
    id: string; // Object ID
    name: string;
    portraitUrl: string;
    encryptionPublicKey: string;
    treasury: string; // Address
    address: string; // Wallet address
}

export interface ChatRoom {
    id: string; // Object ID
    name: string;
    host: string; // User ID
    isPrivate: boolean;
    messageCount: number;
    encryptedMessageKey?: string; // For private rooms
    memberCount?: number; // Computed from members
}

export interface Message {
    id: string; // Object ID
    chatId: string;
    text: string; // Encrypted for private rooms, supports Unicode emoji
    sender: string; // User ID
    timestamp: number; // Unix timestamp in ms
    tippedAmount: number; // In MIST (minimum 0.01 SUI = 10,000,000 MIST)
    imageUrl: string; // Walrus IPFS URL
    imageThumbnailUrl?: string; // Thumbnail URL for images
    fileUrl?: string; // For file attachments (Walrus IPFS URL)
    isEncrypted: boolean; // Frontend flag
    isHighlighted?: boolean; // True if message contains tip
}

export interface Pass {
    id: string; // Object ID
    chatId: string;
    encryptedMessageKey: string;
    createdAt: number;
}

export interface ChatMember {
    userId: string;
    joinedAt: number;
    isMuted: boolean;
}

export interface TipRanking {
    userId: string;
    userName: string;
    totalTipsReceived: number; // In MIST
    totalTipsSent: number; // In MIST
    rank: number;
}

export interface ChatRegistry {
    id: string; // Object ID (shared object)
    // Chat rooms registered via Dynamic Object Fields
}

// Constants
export const MIN_TIP_AMOUNT_MIST = 10_000_000; // 0.01 SUI
export const MESSAGE_RATE_LIMIT = 20; // messages per minute
export const MESSAGES_PER_PAGE = 50;
export const MAX_MESSAGES_DISPLAY = 500;
export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

// Package ID - should be set via environment variable
export const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || '';

// Module names
export const MODULES = {
    USER: 'user',
    CHAT: 'chat',
    MESSAGE: 'message',
    PASS: 'pass',
} as const;

