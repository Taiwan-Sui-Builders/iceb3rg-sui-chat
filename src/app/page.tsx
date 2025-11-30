'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Header } from '@/components/common/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useUser } from '@/hooks/useUser';

export default function Home() {
  const router = useRouter();
  const account = useCurrentAccount();
  const { profile, isLoading, isRegistered } = useUser();

  useEffect(() => {
    if (!account) return;

    if (!isLoading) {
      if (isRegistered && profile) {
        router.push('/rooms');
      } else if (!isRegistered) {
        router.push('/register');
      }
    }
  }, [account, isLoading, isRegistered, profile, router]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header />
      <main className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </main>
    </div>
  )
}
