// User module contract interactions

import { Transaction, TransactionResult } from '@mysten/sui/transactions';
import { PACKAGE_ID, MODULES } from '../types';
import type { User } from '../types';

const USER_MODULE = `${PACKAGE_ID}::${MODULES.USER}`;

/**
 * Create a transaction to create a new user
 */
export function createUserTransaction(
    tx: Transaction,
    params: {
        name: string;
        portraitUrl: string;
        encryptionPublicKey: string;
        treasury: string;
    }
): TransactionResult {
    return tx.moveCall({
        target: `${USER_MODULE}::create_user`,
        arguments: [
            tx.pure.string(params.name),
            tx.pure.string(params.portraitUrl),
            tx.pure.string(params.encryptionPublicKey),
            tx.pure.address(params.treasury),
        ],
    });
}

/**
 * Create a transaction to update user name
 */
export function updateUserNameTransaction(
    tx: Transaction,
    userObjectId: string,
    newName: string
): TransactionResult {
    return tx.moveCall({
        target: `${USER_MODULE}::update_name`,
        arguments: [
            tx.object(userObjectId),
            tx.pure.string(newName),
        ],
    });
}

/**
 * Create a transaction to update portrait URL
 */
export function updateUserPortraitTransaction(
    tx: Transaction,
    userObjectId: string,
    newPortraitUrl: string
): TransactionResult {
    return tx.moveCall({
        target: `${USER_MODULE}::update_portrait_url`,
        arguments: [
            tx.object(userObjectId),
            tx.pure.string(newPortraitUrl),
        ],
    });
}

/**
 * Create a transaction to update treasury address
 */
export function updateTreasuryTransaction(
    tx: Transaction,
    userObjectId: string,
    newTreasury: string
): TransactionResult {
    return tx.moveCall({
        target: `${USER_MODULE}::update_treasury`,
        arguments: [
            tx.object(userObjectId),
            tx.pure.address(newTreasury),
        ],
    });
}

/**
 * Create a transaction to update encryption public key
 */
export function updateEncryptionKeyTransaction(
    tx: Transaction,
    userObjectId: string,
    newEncryptionPublicKey: string
): TransactionResult {
    return tx.moveCall({
        target: `${USER_MODULE}::update_encryption_public_key`,
        arguments: [
            tx.object(userObjectId),
            tx.pure.string(newEncryptionPublicKey),
        ],
    });
}

/**
 * Create a transaction to create UserRegistry
 */
export function createUserRegistryTransaction(
    tx: Transaction
): TransactionResult {
    return tx.moveCall({
        target: `${USER_MODULE}::create_registry`,
        arguments: [],
    });
}

/**
 * Create a transaction to register user in UserRegistry
 */
export function registerUserTransaction(
    tx: Transaction,
    registryId: string,
    userObjectId: string
): TransactionResult {
    return tx.moveCall({
        target: `${USER_MODULE}::register_user`,
        arguments: [
            tx.object(registryId),
            tx.object(userObjectId),
        ],
    });
}

/**
 * Create a transaction to unregister user from UserRegistry
 */
export function unregisterUserTransaction(
    tx: Transaction,
    registryId: string
): TransactionResult {
    return tx.moveCall({
        target: `${USER_MODULE}::unregister_user`,
        arguments: [tx.object(registryId)],
    });
}

/**
 * Parse User object from Sui object data
 */
export function parseUserObject(data: any): User | null {
    if (!data?.content || data.content.dataType !== 'moveObject') {
        return null;
    }

    const fields = data.content.fields as any;
    return {
        id: data.data.objectId,
        name: fields.name || '',
        portraitUrl: fields.portrait_url || '',
        encryptionPublicKey: fields.encryption_public_key || '',
        treasury: fields.treasury || '',
        address: '', // Will be set from owner
    };
}

