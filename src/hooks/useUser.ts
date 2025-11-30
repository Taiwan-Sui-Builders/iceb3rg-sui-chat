// Hook for user data and operations

import { useSuiClientQuery, useCurrentAccount } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { parseUserObject } from '@/lib/sui/user';
import { PACKAGE_ID, MODULES } from '@/lib/types';
import type { User } from '@/lib/types';

const USER_TYPE = `${PACKAGE_ID}::${MODULES.USER}::User`;

/**
 * Hook to get current user's profile
 */
export function useUser() {
    const account = useCurrentAccount();

    const { data: userObject, isLoading, error } = useSuiClientQuery(
        'getOwnedObjects',
        {
            owner: account?.address || '',
            filter: {
                StructType: USER_TYPE,
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

    const user: User | null = userObject?.data?.[0]
        ? parseUserObject(userObject.data[0])
        : null;

    if (user && account?.address) {
        user.address = account.address;
    }

    return {
        user,
        isLoading,
        error,
        isRegistered: !!user,
    };
}

/**
 * Hook to get user by address
 */
export function useUserByAddress(address: string | null) {
    return useSuiClientQuery(
        'getOwnedObjects',
        {
            owner: address || '',
            filter: {
                StructType: USER_TYPE,
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

