// Pass module contract interactions

import { Transaction, TransactionResult } from '@mysten/sui/transactions';
import { PACKAGE_ID, MODULES } from '../types';
import type { Pass } from '../types';

const PASS_MODULE = `${PACKAGE_ID}::${MODULES.PASS}`;

/**
 * Create a transaction to send a pass to a recipient (host only)
 * This is the only way to create a pass - it's sent directly to the recipient
 * Requires Chat object, recipient address, encrypted message key, and Clock object
 */
export function sendPassTransaction(
    tx: Transaction,
    chatId: string,
    recipientAddress: string,
    recipientEncryptedKey: string
): TransactionResult {
    return tx.moveCall({
        target: `${PASS_MODULE}::send_pass`,
        arguments: [
            tx.object(chatId),
            tx.pure.address(recipientAddress),
            tx.pure.string(recipientEncryptedKey),
            tx.object('0x6'), // Clock object
        ],
    });
}

/**
 * Parse Pass object from Sui object data
 */
export function parsePassObject(data: any): Pass | null {
    if (!data?.content || data.content.dataType !== 'moveObject') {
        return null;
    }

    const fields = data.content.fields as any;
    return {
        id: data.data.objectId,
        chatId: fields.chat || '',
        encryptedMessageKey: fields.encrypted_message_key || '',
        createdAt: Number(fields.created_at || 0),
    };
}

