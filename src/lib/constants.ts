/**
 * Frontend constants loaded from environment variables
 * All constants should be prefixed with NEXT_PUBLIC_ to be available in the browser
 */

// ========== Sui Network Configuration ==========
export const SUI_NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK || 'devnet') as 'devnet' | 'testnet' | 'mainnet';

// ========== Smart Contract Configuration ==========
/**
 * Package ID of the deployed smart contract
 * Example: 0x1234567890abcdef...
 */
export const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || '';

/**
 * AppConfig shared object ID
 * This is the shared object that stores application configuration
 */
export const APP_CONFIG_ID = process.env.NEXT_PUBLIC_APP_CONFIG_ID || '';

/**
 * ProfileRegistry shared object ID
 * This is the shared object that stores all user profiles
 */
export const PROFILE_REGISTRY_ID = process.env.NEXT_PUBLIC_PROFILE_REGISTRY_ID || '';

// ========== Module Names ==========
export const MODULES = {
    PROFILE: 'profile',
    CHAT: 'chat',
    CONFIG: 'config',
} as const;

// ========== Application Constants ==========
/**
 * Maximum number of messages that can be displayed at once
 */
export const MAX_MESSAGES_DISPLAY = 500;

/**
 * Number of messages to load per page
 */
export const MESSAGES_PER_PAGE = 50;

/**
 * Rate limit for sending messages (messages per minute)
 */
export const MESSAGE_RATE_LIMIT = 20;

/**
 * Maximum image size in MB
 */
export const MAX_IMAGE_SIZE_MB = 5;

/**
 * Maximum image size in bytes
 */
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

// ========== Message Content Types ==========
export const MESSAGE_CONTENT_TYPE = {
    TEXT: 0,
    IMAGE: 1,
    FILE: 2,
} as const;

// ========== Validation ==========
/**
 * Validates that required environment variables are set
 * Throws an error if any required variable is missing
 */
export function validateConstants(): void {
    const required = [
        { name: 'NEXT_PUBLIC_PACKAGE_ID', value: PACKAGE_ID },
        { name: 'NEXT_PUBLIC_APP_CONFIG_ID', value: APP_CONFIG_ID },
        { name: 'NEXT_PUBLIC_PROFILE_REGISTRY_ID', value: PROFILE_REGISTRY_ID },
    ];

    const missing = required.filter(({ value }) => !value);

    if (missing.length > 0) {
        const missingNames = missing.map(({ name }) => name).join(', ');
        throw new Error(
            `Missing required environment variables: ${missingNames}\n` +
            'Please set these in your .env.local file'
        );
    }
}

// ========== Type Guards ==========
/**
 * Check if all required constants are configured
 */
export function areConstantsConfigured(): boolean {
    return !!(
        PACKAGE_ID &&
        APP_CONFIG_ID &&
        PROFILE_REGISTRY_ID
    );
}

