// Profile module contract interactions

import { Transaction, TransactionResult } from '@mysten/sui/transactions';
import { PACKAGE_ID, MODULES, APP_CONFIG_ID, PROFILE_REGISTRY_ID } from '../types';
import type { Profile } from '../types';

const PROFILE_MODULE = `${PACKAGE_ID}::${MODULES.PROFILE}`;

/**
 * Create a transaction to create a new profile
 */
export function createProfileTransaction(
    tx: Transaction,
    params: {
        customId: string;
        displayName: string;
        avatarBlobId: string;
        publicKey: Uint8Array | string;
    }
): TransactionResult {
    const publicKeyBytes = typeof params.publicKey === 'string'
        ? Array.from(new TextEncoder().encode(params.publicKey))
        : Array.from(params.publicKey);

    return tx.moveCall({
        target: `${PROFILE_MODULE}::create_profile`,
        arguments: [
            tx.object(APP_CONFIG_ID),
            tx.object(PROFILE_REGISTRY_ID),
            tx.pure.string(params.customId),
            tx.pure.string(params.displayName),
            tx.pure.string(params.avatarBlobId),
            tx.pure.vector('u8', publicKeyBytes),
            tx.object('0x6'), // Clock object
        ],
    });
}

/**
 * Create a transaction to update profile (display name, avatar, public key)
 */
export function updateProfileTransaction(
    tx: Transaction,
    profileId: string,
    params: {
        displayName: string;
        avatarBlobId: string;
        publicKey: Uint8Array | string;
    }
): TransactionResult {
    const publicKeyBytes = typeof params.publicKey === 'string'
        ? Array.from(new TextEncoder().encode(params.publicKey))
        : Array.from(params.publicKey);

    return tx.moveCall({
        target: `${PROFILE_MODULE}::update_profile`,
        arguments: [
            tx.object(APP_CONFIG_ID),
            tx.object(profileId),
            tx.pure.string(params.displayName),
            tx.pure.string(params.avatarBlobId),
            tx.pure.vector('u8', publicKeyBytes),
        ],
    });
}

/**
 * Create a transaction to set bio
 */
export function setBioTransaction(
    tx: Transaction,
    profileId: string,
    bioStr: string
): TransactionResult {
    return tx.moveCall({
        target: `${PROFILE_MODULE}::set_bio`,
        arguments: [
            tx.object(APP_CONFIG_ID),
            tx.object(profileId),
            tx.pure.string(bioStr),
        ],
    });
}

/**
 * Create a transaction to set social media link
 */
export function setSocialTransaction(
    tx: Transaction,
    profileId: string,
    appName: string,
    url: string
): TransactionResult {
    return tx.moveCall({
        target: `${PROFILE_MODULE}::set_social`,
        arguments: [
            tx.object(APP_CONFIG_ID),
            tx.object(profileId),
            tx.pure.string(appName),
            tx.pure.string(url),
        ],
    });
}

/**
 * Create a transaction to remove social media link
 */
export function removeSocialTransaction(
    tx: Transaction,
    profileId: string,
    appName: string
): TransactionResult {
    return tx.moveCall({
        target: `${PROFILE_MODULE}::remove_social`,
        arguments: [
            tx.object(APP_CONFIG_ID),
            tx.object(profileId),
            tx.pure.string(appName),
        ],
    });
}

/**
 * Parse Profile object from Sui object data
 */
export function parseProfileObject(data: any): Profile | null {
    if (!data) {
        return null;
    }

    // Handle different data structures from getOwnedObjects
    let fields: any;
    let objectId: string;

    // Check if data has content (from getObject)
    if (data.content && data.content.dataType === 'moveObject') {
        fields = data.content.fields;
        objectId = data.data?.objectId || data.content?.fields?.id || '';
    }
    // Check if data is directly the object (from getOwnedObjects)
    else if (data.data) {
        objectId = data.data.objectId || '';
        if (data.data.content && data.data.content.dataType === 'moveObject') {
            fields = data.data.content.fields;
        } else if (data.content && data.content.fields) {
            fields = data.content.fields;
        } else {
            return null;
        }
    }
    // Try direct fields access
    else if (data.fields) {
        fields = data.fields;
        objectId = data.objectId || data.id || '';
    }
    else {
        return null;
    }

    if (!fields || !objectId) {
        return null;
    }

    const publicKey = fields.public_key;

    return {
        id: objectId,
        owner: fields.owner || '',
        customId: fields.custom_id || '',
        displayName: fields.display_name || '',
        avatarBlobId: fields.avatar_blob_id || '',
        publicKey: publicKey ? (typeof publicKey === 'string' ? publicKey : new Uint8Array(publicKey)) : new Uint8Array(),
        chatIndexId: fields.chat_index_id || '',
        createdAt: Number(fields.created_at || 0),
    };
}

