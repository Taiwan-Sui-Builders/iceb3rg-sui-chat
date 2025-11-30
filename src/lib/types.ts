// Core types for Sui Chat application

export interface Profile {
    id: string; // Object ID
    owner: string; // Wallet address
    customId: string; // Unique custom ID
    displayName: string;
    avatarBlobId: string; // Walrus blob ID
    publicKey: Uint8Array | string; // Public key for encryption
    chatIndexId: string; // UserChatIndex object ID
    createdAt: number; // Unix timestamp in ms
    bio?: string; // Optional bio (dynamic field)
    social?: Record<string, string>; // Social media links (dynamic fields)
}

export interface UserChatIndex {
    id: string; // Object ID (shared object)
    owner: string; // Wallet address
    chatIds: string[]; // Array of chat room IDs
    blocked: string[]; // Array of blocked addresses
}

export interface ChatRoom {
    id: string; // Object ID (shared object)
    name: string;
    creator: string; // Creator wallet address
    isEncrypted: boolean;
    members: string[]; // Array of member addresses
    messageCount: number;
    createdAt: number; // Unix timestamp in ms
    encryptedKey?: Uint8Array | string; // Encrypted key for this user (if encrypted room)
}

export interface Message {
    sender: string; // Sender wallet address
    contentType: number; // 0: Text, 1: Image, 2: File
    content: string; // Message content or blob ID
    timestamp: number; // Unix timestamp in ms
    messageIndex: number; // Index in the chat room
}

export interface ChatMember {
    address: string; // Wallet address
    joinedAt?: number; // Optional join timestamp
}

// Re-export constants from constants.ts
export {
    PACKAGE_ID,
    APP_CONFIG_ID,
    PROFILE_REGISTRY_ID,
    MODULES,
    MESSAGE_RATE_LIMIT,
    MESSAGES_PER_PAGE,
    MAX_MESSAGES_DISPLAY,
    MAX_IMAGE_SIZE_MB,
    MAX_IMAGE_SIZE_BYTES,
    MESSAGE_CONTENT_TYPE,
    SUI_NETWORK,
    validateConstants,
    areConstantsConfigured,
} from './constants';

