// Hook for messages data and operations

import { useSuiClient, useSuiClientQuery } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { parseMessageObject } from '@/lib/sui/message';
import { MESSAGES_PER_PAGE, MAX_MESSAGES_DISPLAY } from '@/lib/types';
import type { Message } from '@/lib/types';

/**
 * Hook to get messages for a chat room
 * Messages are stored as dynamic fields with sequence numbers (u64) as keys
 */
export function useMessages(chatId: string | null) {
    const client = useSuiClient();

    // Get chat room to get message count
    const { data: chatData } = useSuiClientQuery(
        'getObject',
        {
            id: chatId || '',
            options: {
                showContent: true,
            },
        },
        {
            enabled: !!chatId,
        }
    );

    const messageCount =
        chatData?.data?.content?.dataType === 'moveObject'
            ? Number((chatData.data.content.fields as any)?.message_count || 0)
            : 0;

    // Fetch messages using dynamic fields
    // Messages are stored with u64 sequence numbers as keys
    const { data: dynamicFields, isLoading, error, refetch } = useSuiClientQuery(
        'getDynamicFields',
        {
            parentId: chatId || '',
        },
        {
            enabled: !!chatId,
        }
    );

    // Extract message indices from dynamic fields
    // Dynamic fields with u64 keys are the messages
    const messageIndices: number[] = [];
    if (dynamicFields?.data) {
        dynamicFields.data.forEach((field: any) => {
            const name = field.name;
            // Check if this is a u64 key (message index)
            // The name can be in different formats depending on SDK version
            if (name) {
                let index: number | null = null;

                if (typeof name === 'number') {
                    index = name;
                } else if (name.type === 'u64' || name.type === '0x1::string::String') {
                    // Handle different name formats
                    if (typeof name.value === 'number') {
                        index = name.value;
                    } else if (typeof name.value === 'string') {
                        const parsed = parseInt(name.value, 10);
                        if (!isNaN(parsed)) {
                            index = parsed;
                        }
                    }
                } else if (typeof name.value === 'number') {
                    index = name.value;
                }

                if (index !== null && index >= 0 && index < messageCount) {
                    messageIndices.push(index);
                }
            }
        });
    }

    // Sort indices descending (newest first) and limit
    messageIndices.sort((a, b) => b - a);
    const indicesToFetch = messageIndices.slice(0, MAX_MESSAGES_DISPLAY);

    // Fetch message objects
    const {
        data: messagesData,
        isLoading: isLoadingMessages,
        error: messagesError,
    } = useQuery({
        queryKey: ['messages', chatId, indicesToFetch],
        queryFn: async () => {
            if (indicesToFetch.length === 0) return [];

            // Fetch dynamic field objects
            // Note: We need to use getDynamicFieldObject for each message
            const messagePromises = indicesToFetch.map((index: number) =>
                client.getDynamicFieldObject({
                    parentId: chatId!,
                    name: {
                        type: 'u64',
                        value: index,
                    },
                })
            );

            const results = await Promise.all(messagePromises);
            return results
                .map((result, idx) => {
                    if (result.data) {
                        return parseMessageObject(result.data, indicesToFetch[idx]);
                    }
                    return null;
                })
                .filter(Boolean) as Message[];
        },
        enabled: indicesToFetch.length > 0 && !!chatId,
    });

    const messages: Message[] = messagesData || [];

    return {
        messages,
        messageCount,
        isLoading: isLoading || isLoadingMessages,
        error: error || messagesError,
        refetch,
        hasMore: messageCount > messages.length,
    };
}

/**
 * Hook to get a single message by index
 */
export function useMessage(chatId: string | null, messageIndex: number | null) {
    const client = useSuiClient();

    return useQuery({
        queryKey: ['message', chatId, messageIndex],
        queryFn: async () => {
            if (!chatId || messageIndex === null) return null;

            const result = await client.getDynamicFieldObject({
                parentId: chatId,
                name: {
                    type: 'u64',
                    value: messageIndex,
                },
            });

            if (result.data) {
                return parseMessageObject(result.data, messageIndex);
            }
            return null;
        },
        enabled: !!chatId && messageIndex !== null,
    });
}
