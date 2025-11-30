// Message module contract interactions
// Messages are part of the Chat module in the new contract

import { Transaction, TransactionResult } from '@mysten/sui/transactions';
import { PACKAGE_ID, MODULES, APP_CONFIG_ID, MESSAGE_CONTENT_TYPE } from '../types';
import type { Message } from '../types';

const CHAT_MODULE = `${PACKAGE_ID}::${MODULES.CHAT}`;

/**
 * Create a transaction to send a message
 * Messages are stored as dynamic fields in the ChatRoom
 */
export function sendMessageTransaction(
    tx: Transaction,
    chatId: string,
    contentType: number, // 0: Text, 1: Image, 2: File
    content: string // Message text or blob ID
): TransactionResult {
    return tx.moveCall({
        target: `${CHAT_MODULE}::send_message`,
        arguments: [
            tx.object(APP_CONFIG_ID),
            tx.object(chatId),
            tx.pure.u8(contentType),
            tx.pure.string(content),
            tx.object('0x6'), // Clock object
        ],
    });
}

/**
 * Create a transaction to send a text message
 */
export function sendTextMessageTransaction(
    tx: Transaction,
    chatId: string,
    text: string
): TransactionResult {
    return sendMessageTransaction(tx, chatId, MESSAGE_CONTENT_TYPE.TEXT, text);
}

/**
 * Create a transaction to send an image message
 */
export function sendImageMessageTransaction(
    tx: Transaction,
    chatId: string,
    imageBlobId: string // Walrus blob ID
): TransactionResult {
    return sendMessageTransaction(tx, chatId, MESSAGE_CONTENT_TYPE.IMAGE, imageBlobId);
}

/**
 * Create a transaction to send a file message
 */
export function sendFileMessageTransaction(
    tx: Transaction,
    chatId: string,
    fileBlobId: string // Walrus blob ID
): TransactionResult {
    return sendMessageTransaction(tx, chatId, MESSAGE_CONTENT_TYPE.FILE, fileBlobId);
}

/**
 * Parse Message from dynamic field data
 * Messages are stored as dynamic fields with sequence numbers as keys
 */
export function parseMessageObject(data: any, messageIndex: number): Message | null {
    if (!data) {
        return null;
    }

    // Dynamic field objects have the value in data.content
    // The Message struct is stored directly as the value
    let fields: any;

    if (data.content?.dataType === 'moveObject') {
        fields = data.content.fields;
    } else if (data.content?.dataType === 'moveValue') {
        // If stored as moveValue, the fields might be directly in content
        fields = data.content.value || data.content;
    } else if (data.fields) {
        fields = data.fields;
    } else {
        return null;
    }

    return {
        sender: fields.sender || '',
        contentType: Number(fields.content_type ?? 0),
        content: fields.content || '',
        timestamp: Number(fields.timestamp || 0),
        messageIndex,
    };
}

/**
 * Helper to get message content type label
 */
export function getContentTypeLabel(contentType: number): string {
    switch (contentType) {
        case MESSAGE_CONTENT_TYPE.TEXT:
            return 'Text';
        case MESSAGE_CONTENT_TYPE.IMAGE:
            return 'Image';
        case MESSAGE_CONTENT_TYPE.FILE:
            return 'File';
        default:
            return 'Unknown';
    }
}
