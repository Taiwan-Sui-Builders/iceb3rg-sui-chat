// Hook for messages data and operations

import { useSuiClientQuery } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { parseMessageObject } from '@/lib/sui/message';
import { PACKAGE_ID, MODULES, MESSAGES_PER_PAGE, MAX_MESSAGES_DISPLAY } from '@/lib/types';
import type { Message } from '@/lib/types';

const MESSAGE_TYPE = `${PACKAGE_ID}::${MODULES.MESSAGE}::Message`;

/**
 * Hook to get messages for a chat room
 */
export function useMessages(chatId: string | null, isPrivate: boolean = false) {
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
    const { data: dynamicFields, isLoading, error, refetch } = useSuiClientQuery(
        'getDynamicFields',
        {
            parentId: chatId || '',
        },
        {
            enabled: !!chatId,
        }
    );

    // Filter for message keys and parse messages
    const messages: Message[] = [];
    if (dynamicFields?.data) {
        const messageFields = dynamicFields.data
            .filter((field: any) => {
                const name = field.name;
                return name?.type === `${PACKAGE_ID}::${MODULES.CHAT}::MessageKey`;
            })
            .slice(0, MAX_MESSAGES_DISPLAY); // Limit to max display

        // Sort by count (descending for newest first)
        messageFields.sort((a: any, b: any) => {
            const aCount = a.name?.value?.count || 0;
            const bCount = b.name?.value?.count || 0;
            return bCount - aCount;
        });

        // Fetch each message object
        // Note: In production, you'd batch these queries
        for (const field of messageFields.slice(0, MESSAGES_PER_PAGE)) {
            // This is a simplified version - you'd need to fetch the actual message object
            // For now, we'll need to implement proper message fetching
        }
    }

    return {
        messages,
        messageCount,
        isLoading,
        error,
        refetch,
        hasMore: messageCount > messages.length,
    };
}

/**
 * Hook to get a single message by ID
 */
export function useMessage(messageId: string | null) {
    return useSuiClientQuery(
        'getObject',
        {
            id: messageId || '',
            options: {
                showContent: true,
                showType: true,
            },
        },
        {
            enabled: !!messageId,
        }
    );
}

