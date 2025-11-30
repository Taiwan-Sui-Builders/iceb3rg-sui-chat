// Hook for chat rooms data and operations

import { useSuiClient, useSuiClientQuery } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { parseChatObject } from '@/lib/sui/chat';
import { PACKAGE_ID, MODULES } from '@/lib/types';
import type { ChatRoom } from '@/lib/types';

const CHAT_TYPE = `${PACKAGE_ID}::${MODULES.CHAT}::Chat`;

// ChatRegistry object ID - should be set via environment variable or fetched
const CHAT_REGISTRY_ID = process.env.NEXT_PUBLIC_CHAT_REGISTRY_ID || '';

/**
 * Hook to get all chat rooms
 * Queries ChatRegistry dynamic fields to get all registered chat rooms
 * Note: ChatRegistry must be implemented in the smart contract
 */
export function useChatRooms() {
    const client = useSuiClient();

    // Query ChatRegistry dynamic fields to get all chat room IDs
    const {
        data: dynamicFields,
        isLoading: isLoadingFields,
        error: fieldsError,
        refetch: refetchFields
    } = useSuiClientQuery(
        'getDynamicFields',
        {
            parentId: CHAT_REGISTRY_ID,
        },
        {
            enabled: !!CHAT_REGISTRY_ID,
        }
    );

    // Extract chat room IDs from dynamic fields
    const chatRoomIds = dynamicFields?.data
        ? dynamicFields.data.map((field: any) => {
            // Extract chat room ID from dynamic field
            // This depends on how ChatRegistry stores room IDs
            // If ChatRegistry stores Chat objects directly, use field.objectId
            // If it stores IDs, use field.name?.value
            return field.objectId || field.name?.value;
        }).filter(Boolean)
        : [];

    // Fetch all chat room objects
    const {
        data: roomsData,
        isLoading: isLoadingRooms,
        error: roomsError,
        refetch: refetchRooms
    } = useQuery({
        queryKey: ['chatRooms', chatRoomIds],
        queryFn: async () => {
            if (chatRoomIds.length === 0) return [];

            // Fetch all chat room objects in parallel
            const roomPromises = chatRoomIds.map((id: string) =>
                client.getObject({
                    id,
                    options: {
                        showContent: true,
                        showType: true,
                    },
                })
            );

            return await Promise.all(roomPromises);
        },
        enabled: chatRoomIds.length > 0,
    });

    const rooms: ChatRoom[] = roomsData
        ? roomsData
            .map((item: any) => parseChatObject(item))
            .filter(Boolean) as ChatRoom[]
        : [];

    const refetch = async () => {
        await refetchFields();
        await refetchRooms();
    };

    return {
        rooms,
        isLoading: isLoadingFields || isLoadingRooms,
        error: fieldsError || roomsError,
        refetch,
    };
}

/**
 * Hook to get a single chat room by ID
 */
export function useChatRoom(chatId: string | null) {
    return useSuiClientQuery(
        'getObject',
        {
            id: chatId || '',
            options: {
                showContent: true,
                showType: true,
            },
        },
        {
            enabled: !!chatId,
        }
    );
}

