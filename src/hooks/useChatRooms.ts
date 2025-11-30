// Hook for chat rooms data and operations

import { useSuiClient, useSuiClientQuery } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { parseChatObject } from '@/lib/sui/chat';
import { PACKAGE_ID, MODULES } from '@/lib/types';
import type { ChatRoom } from '@/lib/types';

const CHAT_TYPE = `${PACKAGE_ID}::${MODULES.CHAT}::ChatRoom`;

/**
 * Hook to get all chat rooms from a user's UserChatIndex
 * This fetches chat rooms from the user's chat index
 */
export function useChatRooms(chatIndexId: string | null) {
    const client = useSuiClient();

    // First, get the UserChatIndex to get list of chat IDs
    const {
        data: chatIndexData,
        isLoading: isLoadingIndex,
        error: indexError,
        refetch: refetchIndex
    } = useSuiClientQuery(
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

    // Extract chat room IDs from UserChatIndex
    const chatRoomIds: string[] = chatIndexData?.data?.content?.dataType === 'moveObject'
        ? (chatIndexData.data.content.fields as any)?.chat_ids || []
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
        await refetchIndex();
        await refetchRooms();
    };

    return {
        rooms,
        isLoading: isLoadingIndex || isLoadingRooms,
        error: indexError || roomsError,
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
