// Chat module contract interactions

import { Transaction, TransactionResult } from '@mysten/sui/transactions';
import { PACKAGE_ID, MODULES } from '../types';
import type { ChatRoom, ChatMember } from '../types';

const CHAT_MODULE = `${PACKAGE_ID}::${MODULES.CHAT}`;

/**
 * Create a transaction to create a public chat
 * Requires User object to be passed
 */
export function createPublicChatTransaction(
    tx: Transaction,
    name: string,
    userObjectId: string
): TransactionResult {
    return tx.moveCall({
        target: `${CHAT_MODULE}::create_public_chat`,
        arguments: [
            tx.pure.string(name),
            tx.object(userObjectId),
        ],
    });
}

/**
 * Create a transaction to create a private chat
 * Requires User object to be passed
 */
export function createPrivateChatTransaction(
    tx: Transaction,
    name: string,
    encryptedMessageKey: string,
    userObjectId: string
): TransactionResult {
    return tx.moveCall({
        target: `${CHAT_MODULE}::create_private_chat`,
        arguments: [
            tx.pure.string(name),
            tx.pure.string(encryptedMessageKey),
            tx.object(userObjectId),
        ],
    });
}

/**
 * Create a transaction to create ChatRegistry
 */
export function createChatRegistryTransaction(
    tx: Transaction
): TransactionResult {
    return tx.moveCall({
        target: `${CHAT_MODULE}::create_registry`,
        arguments: [],
    });
}

/**
 * Create a transaction to register chat in ChatRegistry
 */
export function registerChatTransaction(
    tx: Transaction,
    registryId: string,
    chatId: string,
    chatName: string,
    hostUserObjectId: string
): TransactionResult {
    return tx.moveCall({
        target: `${CHAT_MODULE}::register_chat`,
        arguments: [
            tx.object(registryId),
            tx.object(chatId),
            tx.pure.string(chatName),
            tx.object(hostUserObjectId),
        ],
    });
}

/**
 * Create a transaction to unregister chat from ChatRegistry
 */
export function unregisterChatTransaction(
    tx: Transaction,
    registryId: string,
    chatId: string,
    chatName: string,
    hostUserObjectId: string
): TransactionResult {
    return tx.moveCall({
        target: `${CHAT_MODULE}::unregister_chat`,
        arguments: [
            tx.object(registryId),
            tx.object(chatId),
            tx.pure.string(chatName),
            tx.object(hostUserObjectId),
        ],
    });
}

/**
 * Create a transaction to join a public chat
 * Requires User object and Clock object
 */
export function joinPublicChatTransaction(
    tx: Transaction,
    chatId: string,
    userObjectId: string
): TransactionResult {
    return tx.moveCall({
        target: `${CHAT_MODULE}::join_public_chat`,
        arguments: [
            tx.object(chatId),
            tx.object(userObjectId),
            tx.object('0x6'), // Clock object
        ],
    });
}

/**
 * Create a transaction to join a private chat with pass
 * Requires User object, Pass object, and Clock object
 */
export function joinPrivateChatTransaction(
    tx: Transaction,
    chatId: string,
    userObjectId: string,
    passId: string
): TransactionResult {
    return tx.moveCall({
        target: `${CHAT_MODULE}::join_private_chat`,
        arguments: [
            tx.object(chatId),
            tx.object(userObjectId),
            tx.object(passId),
            tx.object('0x6'), // Clock object
        ],
    });
}

/**
 * Create a transaction to update chat name (host only)
 */
export function updateChatNameTransaction(
    tx: Transaction,
    chatId: string,
    newName: string,
    hostUserObjectId: string
): TransactionResult {
    return tx.moveCall({
        target: `${CHAT_MODULE}::update_name`,
        arguments: [
            tx.object(chatId),
            tx.pure.string(newName),
            tx.object(hostUserObjectId),
        ],
    });
}

/**
 * Create a transaction to transfer host
 * Requires host User object
 */
export function transferHostTransaction(
    tx: Transaction,
    chatId: string,
    newHostUserId: string,
    hostUserObjectId: string
): TransactionResult {
    return tx.moveCall({
        target: `${CHAT_MODULE}::transfer_host`,
        arguments: [
            tx.object(chatId),
            tx.pure.id(newHostUserId),
            tx.object(hostUserObjectId),
        ],
    });
}

/**
 * Create a transaction to ban a user (host only)
 * Requires host User object and Clock object
 */
export function banUserTransaction(
    tx: Transaction,
    chatId: string,
    bannedUserId: string,
    hostUserObjectId: string
): TransactionResult {
    return tx.moveCall({
        target: `${CHAT_MODULE}::ban_user`,
        arguments: [
            tx.object(chatId),
            tx.pure.id(bannedUserId),
            tx.object(hostUserObjectId),
            tx.object('0x6'), // Clock object
        ],
    });
}

/**
 * Create a transaction to unban a user (host only)
 * Requires host User object
 */
export function unbanUserTransaction(
    tx: Transaction,
    chatId: string,
    unbannedUserId: string,
    hostUserObjectId: string
): TransactionResult {
    return tx.moveCall({
        target: `${CHAT_MODULE}::unban_user`,
        arguments: [
            tx.object(chatId),
            tx.pure.id(unbannedUserId),
            tx.object(hostUserObjectId),
        ],
    });
}

/**
 * Parse Chat object from Sui object data
 */
export function parseChatObject(data: any): ChatRoom | null {
    if (!data?.content || data.content.dataType !== 'moveObject') {
        return null;
    }

    const fields = data.content.fields as any;
    return {
        id: data.data.objectId,
        name: fields.name || '',
        host: fields.host || '',
        isPrivate: fields.is_private || false,
        messageCount: Number(fields.message_count || 0),
        encryptedMessageKey: fields.encrypted_message_key || undefined,
    };
}

/**
 * Parse ChatMember from Dynamic Object Field
 */
export function parseChatMember(data: any): ChatMember | null {
    if (!data?.content || data.content.dataType !== 'moveObject') {
        return null;
    }

    const fields = data.content.fields as any;
    return {
        userId: fields.user || '',
        joinedAt: Number(fields.joined_at || 0),
        isMuted: fields.is_muted || false,
    };
}

