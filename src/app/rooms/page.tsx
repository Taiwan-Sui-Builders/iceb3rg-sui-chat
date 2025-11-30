// Chat rooms list page

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentAccount } from '@mysten/dapp-kit';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Header } from '@/components/common/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { useChatRooms } from '@/hooks/useChatRooms';
import { useUser } from '@/hooks/useUser';
import type { ChatRoom } from '@/lib/types';

type SortOption = 'name' | 'members' | 'messages';
type FilterOption = 'all' | 'public' | 'private';

export default function RoomsPage() {
  const router = useRouter();
  const account = useCurrentAccount();
  const { profile, isRegistered } = useUser();
  const chatIndexId = profile?.chatIndexId || null;
  const { rooms, isLoading, error, refetch } = useChatRooms(chatIndexId);

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('messages');

  // Redirect if not registered
  if (account && !isRegistered) {
    router.push('/register');
    return null;
  }

  // Filter and sort rooms
  const filteredAndSortedRooms = useMemo(() => {
    let filtered = rooms;

    // Filter by type
    if (filter === 'public') {
      filtered = filtered.filter((room) => !room.isEncrypted);
    } else if (filter === 'private') {
      filtered = filtered.filter((room) => room.isEncrypted);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((room) =>
        room.name.toLowerCase().includes(query)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'members':
          return (b.memberCount || 0) - (a.memberCount || 0);
        case 'messages':
          return b.messageCount - a.messageCount;
        default:
          return 0;
      }
    });

    return sorted;
  }, [rooms, filter, searchQuery, sortBy]);

  if (!account) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-8 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">
              Please connect your wallet to view chat rooms.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Chat Rooms
          </h1>
          <Link
            href="/rooms/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Room
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rooms by name..."
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterOption)}
                className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
              >
                <option value="all">All Rooms</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
              >
                <option value="messages">Most Active</option>
                <option value="members">Most Members</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Rooms List */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {error && (
          <ErrorMessage
            message={error.message || 'Failed to load chat rooms'}
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedRooms.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-zinc-600 dark:text-zinc-400">
                  No rooms found. Create the first room!
                </p>
              </div>
            ) : (
              filteredAndSortedRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function RoomCard({ room }: { room: ChatRoom }) {
  return (
    <Link
      href={`/rooms/${room.id}`}
      className="block bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-black dark:text-zinc-50 truncate">
          {room.name}
        </h3>
        {room.isEncrypted && (
          <span className="ml-2 px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
            Encrypted
          </span>
        )}
      </div>
      <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
        <p>Messages: {room.messageCount}</p>
        <p>Members: {room.members.length}</p>
      </div>
    </Link>
  );
}

