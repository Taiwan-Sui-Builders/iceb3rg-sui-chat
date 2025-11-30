// Registration page

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useSignPersonalMessage } from '@mysten/dapp-kit';
import toast from 'react-hot-toast';
import { Header } from '@/components/common/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { createProfileTransaction } from '@/lib/sui/profile';
import { useEncryptionKeypair } from '@/hooks/useEncryption';
import { toBase64 } from '@/lib/crypto';

export default function RegisterPage() {
  const router = useRouter();
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction();
  const { mutate: signPersonalMessage } = useSignPersonalMessage();
  const { loadKeypair, getPublicKeyBase64 } = useEncryptionKeypair();

  const [customId, setCustomId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarBlobId, setAvatarBlobId] = useState('');
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  const handleRegister = async () => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!customId.trim()) {
      toast.error('Custom ID is required');
      return;
    }

    if (!displayName.trim()) {
      toast.error('Display name is required');
      return;
    }

    setIsGeneratingKey(true);

    try {
      // Step 1: Sign a message to derive encryption key
      signPersonalMessage(
        {
          message: new TextEncoder().encode('sui-chat:derive-encryption-key:v1'),
        },
        {
          onSuccess: async (result) => {
            try {
              // Step 2: Derive encryption keypair from signature
              const signature = new Uint8Array(result.bytes);
              const keypair = await loadKeypair(signature);
              const publicKeyBase64 = getPublicKeyBase64();

              if (!publicKeyBase64) {
                toast.error('Failed to generate encryption key');
                setIsGeneratingKey(false);
                return;
              }

              // Step 3: Create profile transaction
              const tx = new Transaction();
              // Convert base64 public key to Uint8Array
              const publicKeyBytes = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));

              createProfileTransaction(tx, {
                customId: customId.trim(),
                displayName: displayName.trim(),
                avatarBlobId: avatarBlobId.trim() || '',
                publicKey: publicKeyBytes,
              });

              // Step 4: Execute transaction
              signAndExecuteTransaction(
                {
                  transaction: tx,
                },
                {
                  onSuccess: () => {
                    toast.success('Registration successful!');
                    // Store encryption keypair securely (encrypted localStorage)
                    // TODO: Implement secure storage
                    router.push('/rooms');
                  },
                  onError: (error) => {
                    toast.error(`Registration failed: ${error.message}`);
                    setIsGeneratingKey(false);
                  },
                }
              );
            } catch (error: any) {
              toast.error(`Failed to generate key: ${error.message}`);
              setIsGeneratingKey(false);
            }
          },
          onError: (error) => {
            toast.error(`Failed to sign message: ${error.message}`);
            setIsGeneratingKey(false);
          },
        }
      );
    } catch (error: any) {
      toast.error(`Registration error: ${error.message}`);
      setIsGeneratingKey(false);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-8">
            <h1 className="text-2xl font-semibold mb-4 text-black dark:text-zinc-50">
              Registration Required
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Please connect your wallet to register.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-8">
          <h1 className="text-2xl font-semibold mb-6 text-black dark:text-zinc-50">
            Register
          </h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Custom ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                maxLength={100}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                placeholder="Enter a unique ID"
                required
              />
              <p className="mt-1 text-xs text-zinc-500">
                A unique identifier for your profile. Max 100 characters.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={100}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                placeholder="Enter your display name"
                required
              />
              <p className="mt-1 text-xs text-zinc-500">
                Max 100 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Avatar Blob ID
              </label>
              <input
                type="text"
                value={avatarBlobId}
                onChange={(e) => setAvatarBlobId(e.target.value)}
                maxLength={500}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                placeholder="Walrus blob ID for avatar"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Walrus storage blob ID for your avatar image. Max 500 characters.
              </p>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                onClick={handleRegister}
                disabled={isPending || isGeneratingKey || !customId.trim() || !displayName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {(isPending || isGeneratingKey) ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Registering...</span>
                  </>
                ) : (
                  'Register'
                )}
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

