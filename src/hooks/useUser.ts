// Hook for user profile data and operations

import { useSuiClientQuery, useCurrentAccount } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { parseProfileObject } from '@/lib/sui/profile';
import { PACKAGE_ID, MODULES } from '@/lib/types';
import type { Profile } from '@/lib/types';

const PROFILE_TYPE = `${PACKAGE_ID}::${MODULES.PROFILE}::Profile`;

/**
 * Hook to get current user's profile
 */
export function useUser() {
    const account = useCurrentAccount();

    const { data: profileObject, isLoading, error } = useSuiClientQuery(
        'getOwnedObjects',
        {
            owner: account?.address || '',
            filter: {
                StructType: PROFILE_TYPE,
            },
            options: {
                showContent: true,
                showType: true,
            },
        },
        {
            enabled: !!account?.address,
        }
    );

    const profile: Profile | null = profileObject?.data?.[0]
        ? parseProfileObject(profileObject.data[0])
        : null;

    return {
        profile,
        isLoading,
        error,
        isRegistered: !!profile,
    };
}

/**
 * Hook to get user profile by address
 */
export function useUserByAddress(address: string | null) {
    return useSuiClientQuery(
        'getOwnedObjects',
        {
            owner: address || '',
            filter: {
                StructType: PROFILE_TYPE,
            },
            options: {
                showContent: true,
                showType: true,
            },
        },
        {
            enabled: !!address,
        }
    );
}

/**
 * Hook to get user's UserChatIndex
 */
export function useUserChatIndex(chatIndexId: string | null) {
    return useSuiClientQuery(
        'getObject',
        {
            id: chatIndexId || '',
            options: {
                showContent: true,
                showType: true,
            },
        },
        {
            enabled: !!chatIndexId,
        }
    );
}
