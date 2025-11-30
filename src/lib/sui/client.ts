// Sui client setup and utilities

import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { useSuiClient } from '@mysten/dapp-kit';

// Get Sui client instance
export function getSuiClient(network: 'devnet' | 'testnet' = 'devnet'): SuiClient {
    return new SuiClient({ url: getFullnodeUrl(network) });
}

// Hook to get Sui client from context
export function useSuiClientInstance() {
    return useSuiClient();
}

// Helper to convert MIST to SUI
export function mistToSui(mist: number | string): number {
    const mistNum = typeof mist === 'string' ? parseInt(mist, 10) : mist;
    return mistNum / 1_000_000_000;
}

// Helper to convert SUI to MIST
export function suiToMist(sui: number): number {
    return Math.floor(sui * 1_000_000_000);
}

// Helper to format address (truncate for display)
export function formatAddress(address: string, length: number = 8): string {
    if (!address) return '';
    if (address.length <= length * 2) return address;
    return `${address.slice(0, length)}...${address.slice(-length)}`;
}

// Helper to get object type from full type string
export function getObjectType(fullType: string): string {
    return fullType.split('::').pop() || fullType;
}

