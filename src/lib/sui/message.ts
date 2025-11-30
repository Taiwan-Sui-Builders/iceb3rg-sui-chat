// Message module contract interactions

import { Transaction, TransactionResult } from '@mysten/sui/transactions';
import { PACKAGE_ID, MODULES, MIN_TIP_AMOUNT_MIST } from '../types';
import type { Message } from '../types';

const CHAT_MODULE = `${PACKAGE_ID}::${MODULES.CHAT}`;

/**
 * Create a transaction to create a message (public chat)
 * Requires sender User ID and Clock object
 * Argument order: chat, text, sender, image_url, clock, ctx
 */
export function createMessageTransaction(
    tx: Transaction,
    chatId: string,
    text: string,
    senderUserId: string,
    imageUrl: string = ''
): TransactionResult {
    return tx.moveCall({
        target: `${CHAT_MODULE}::create_message`,
        arguments: [
            tx.object(chatId),
            tx.pure.string(text),
            tx.pure.id(senderUserId),
            tx.pure.string(imageUrl),
            tx.object('0x6'), // Clock object
        ],
    });
}

/**
 * Create a transaction to create a message with tip (public chat)
 * Requires sender User ID, tip Coin object, host User object, and Clock object
 * Argument order: chat, text, sender, image_url, payment, host_user, clock, ctx
 */
export function createMessageWithTipTransaction(
    tx: Transaction,
    chatId: string,
    text: string,
    senderUserId: string,
    imageUrl: string,
    tipCoin: string, // Coin object ID
    hostUserObjectId: string
): TransactionResult {
    return tx.moveCall({
        target: `${CHAT_MODULE}::create_message_with_tip`,
        arguments: [
            tx.object(chatId),
            tx.pure.string(text),
            tx.pure.id(senderUserId),
            tx.pure.string(imageUrl),
            tx.object(tipCoin),
            tx.object(hostUserObjectId),
            tx.object('0x6'), // Clock object
        ],
    });
}

/**
 * Create a transaction to create a message in private chat with pass
 * Requires sender User ID, Pass object, and Clock object
 * Argument order: chat, text, sender, image_url, pass, clock, ctx
 */
export function createMessageWithPassTransaction(
    tx: Transaction,
    chatId: string,
    text: string,
    senderUserId: string,
    imageUrl: string,
    passId: string
): TransactionResult {
    return tx.moveCall({
        target: `${CHAT_MODULE}::create_message_with_pass`,
        arguments: [
            tx.object(chatId),
            tx.pure.string(text),
            tx.pure.id(senderUserId),
            tx.pure.string(imageUrl),
            tx.object(passId),
            tx.object('0x6'), // Clock object
        ],
    });
}

/**
 * Create a transaction to create a message with tip in private chat
 * Requires sender User ID, Pass object, tip Coin object, host User object, and Clock object
 * Argument order: chat, text, sender, image_url, payment, pass, host_user, clock, ctx
 */
export function createMessageWithTipAndPassTransaction(
    tx: Transaction,
    chatId: string,
    text: string,
    senderUserId: string,
    imageUrl: string,
    tipCoin: string, // Coin object ID
    passId: string,
    hostUserObjectId: string
): TransactionResult {
    return tx.moveCall({
        target: `${CHAT_MODULE}::create_message_with_tip_and_pass`,
        arguments: [
            tx.object(chatId),
            tx.pure.string(text),
            tx.pure.id(senderUserId),
            tx.pure.string(imageUrl),
            tx.object(tipCoin),
            tx.object(passId),
            tx.object(hostUserObjectId),
            tx.object('0x6'), // Clock object
        ],
    });
}

/**
 * Parse Message object from Sui object data
 */
export function parseMessageObject(data: any): Message | null {
    if (!data?.content || data.content.dataType !== 'moveObject') {
        return null;
    }

    const fields = data.content.fields as any;
    const tippedAmount = Number(fields.tipped_amount || 0);

    return {
        id: data.data.objectId,
        chatId: fields.chat || '',
        text: fields.text || '',
        sender: fields.sender || '',
        timestamp: Number(fields.timestamp || 0),
        tippedAmount,
        imageUrl: fields.image_url || '',
        isEncrypted: false, // Will be set based on room type
        isHighlighted: tippedAmount >= MIN_TIP_AMOUNT_MIST,
    };
}

