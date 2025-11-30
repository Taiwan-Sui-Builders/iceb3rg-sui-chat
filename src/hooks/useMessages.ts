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

    console.log('[useMessages] Chat room loaded:', {
        chatId,
        hasChatData: !!chatData,
        messageCount,
        chatDataStructure: chatData?.data?.content?.dataType
    });

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

    console.log('[useMessages] Dynamic fields loaded:', {
        chatId,
        hasDynamicFields: !!dynamicFields,
        dynamicFieldsCount: dynamicFields?.data?.length || 0,
        isLoading,
        error: error?.message
    });

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

    console.log('[useMessages] Extracted message indices:', {
        chatId,
        totalIndices: messageIndices.length,
        indices: messageIndices.length > 0 ? messageIndices.slice(0, 10) : 'none', // Log first 10
        messageCount,
        validIndices: messageIndices.filter(idx => idx >= 0 && idx < messageCount).length
    });

    // Sort indices descending (newest first) and limit
    messageIndices.sort((a, b) => b - a);
    const indicesToFetch = messageIndices.slice(0, MAX_MESSAGES_DISPLAY);

    console.log('[useMessages] Indices to fetch:', {
        chatId,
        totalIndices: messageIndices.length,
        indicesToFetch: indicesToFetch.length,
        indices: indicesToFetch.length > 0 ? indicesToFetch : 'none',
        maxDisplay: MAX_MESSAGES_DISPLAY
    });

    // Fetch message objects
    const {
        data: messagesData,
        isLoading: isLoadingMessages,
        error: messagesError,
    } = useQuery({
        queryKey: ['messages', chatId, indicesToFetch],
        queryFn: async () => {
            if (indicesToFetch.length === 0) {
                console.log('[useMessages] No indices to fetch');
                return [];
            }

            console.log('[useMessages] Fetching message objects:', {
                chatId,
                count: indicesToFetch.length,
                indices: indicesToFetch
            });

            // Fetch dynamic field objects
            // Note: We need to use getDynamicFieldObject for each message
            const messagePromises = indicesToFetch.map((index: number) =>
                client.getDynamicFieldObject({
                    parentId: chatId!,
                    name: {
                        type: 'u64',
                        value: index.toString(), // Convert to string for U64 type
                    },
                })
            );

            const results = await Promise.all(messagePromises);

            // Log first successful result structure for debugging
            const firstSuccess = results.find(r => r.data);
            if (firstSuccess?.data) {
                const data = firstSuccess.data as any;
                console.log('[useMessages] First successful result structure:', {
                    chatId,
                    index: indicesToFetch[results.indexOf(firstSuccess)],
                    dataKeys: Object.keys(data),
                    hasContent: !!data.content,
                    hasData: !!data.data,
                    contentType: data.content?.dataType,
                    dataContentType: data.data?.content?.dataType,
                    contentValue: data.content?.value ? Object.keys(data.content.value) : 'no value',
                    fullStructure: JSON.stringify(data, null, 2).substring(0, 500)
                });
            }

            console.log('[useMessages] Fetched message objects:', {
                chatId,
                requested: indicesToFetch.length,
                received: results.length,
                successful: results.filter(r => r.data).length,
                failed: results.filter(r => r.error).length,
                errors: results.filter(r => r.error).map(r => {
                    if (r.error && typeof r.error === 'object' && 'message' in r.error) {
                        return (r.error as any).message;
                    }
                    return String(r.error);
                })
            });

            const parsedMessages = results
                .map((result, idx) => {
                    if (result.data) {
                        return parseMessageObject(result.data, indicesToFetch[idx]);
                    }
                    return null;
                })
                .filter(Boolean) as Message[];

            console.log('[useMessages] Parsed messages:', {
                chatId,
                rawDataCount: results.filter(r => r.data).length,
                parsedCount: parsedMessages.length,
                messages: parsedMessages.length > 0
                    ? parsedMessages.map(m => ({
                        index: m.messageIndex,
                        sender: m.sender.slice(0, 8) + '...',
                        contentType: m.contentType,
                        contentLength: m.content.length
                    }))
                    : 'none'
            });

            return parsedMessages;
        },
        enabled: indicesToFetch.length > 0 && !!chatId,
    });

    const messages: Message[] = messagesData || [];

    const finalError = error || messagesError;

    if (finalError) {
        console.error('[useMessages] Error loading messages:', {
            chatId,
            dynamicFieldsError: error?.message,
            messagesError: messagesError?.message,
            messageCount,
            messagesCount: messages.length
        });
    }

    console.log('[useMessages] Final messages state:', {
        chatId,
        messageCount,
        messagesCount: messages.length,
        isLoading: isLoading || isLoadingMessages,
        hasMore: messageCount > messages.length,
        error: finalError?.message
    });

    return {
        messages,
        messageCount,
        isLoading: isLoading || isLoadingMessages,
        error: finalError,
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
                    value: messageIndex.toString(), // Convert to string for U64 type
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
