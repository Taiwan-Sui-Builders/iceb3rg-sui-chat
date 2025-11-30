'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { Header } from '@/components/common/Header'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { useChatRoom } from '@/hooks/useChatRooms'
import { useMessages } from '@/hooks/useMessages'
import { useUser } from '@/hooks/useUser'
import { useSponsoredTransaction } from '@/hooks'
import { parseChatObject } from '@/lib/sui/chat'
import { sendTextMessageTransaction } from '@/lib/sui/message'
import { createTransactionLogger } from '@/lib/sui/transaction-logger'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Send, Lock, Globe, Users, MessageSquare, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ChatRoomPage() {
  const router = useRouter()
  const params = useParams()
  const account = useCurrentAccount()
  const { isRegistered } = useUser()

  // Ensure chatId is always defined (even if null) before hooks use it
  const chatId = (params?.id as string | undefined) || null

  const { data: chatRoomData, isLoading: isLoadingRoom, error: roomError } = useChatRoom(chatId)
  const { messages, messageCount, isLoading: isLoadingMessages, error: messagesError, refetch: refetchMessages } = useMessages(chatId)
  const { execute: executeSponsoredTx, isPending } = useSponsoredTransaction()

  // Log messages hook usage
  useEffect(() => {
    console.log('[ChatRoomPage] useMessages hook status:', {
      chatId,
      messagesCount: messages.length,
      messageCount,
      isLoading: isLoadingMessages,
      error: messagesError?.message,
      hasMore: messageCount > messages.length
    })
  }, [chatId, messages, messageCount, isLoadingMessages, messagesError])

  const [messageText, setMessageText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Redirect if not registered
  useEffect(() => {
    if (account && !isRegistered) {
      router.push('/register')
    }
  }, [account, isRegistered, router])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    console.log('[ChatRoomPage] === Starting send message ===')
    console.log('[ChatRoomPage] Account:', account?.address)
    console.log('[ChatRoomPage] Chat ID:', chatId)
    console.log('[ChatRoomPage] Message:', messageText.trim())

    if (!account || !chatId || !messageText.trim()) {
      console.error('[ChatRoomPage] Error: Missing account, chatId, or message')
      return
    }

    setIsSending(true)

    try {
      console.log('[ChatRoomPage] Step 1: Creating send message transaction...')
      const tx = new Transaction()
      sendTextMessageTransaction(tx, chatId, messageText.trim())
      console.log('[ChatRoomPage] Step 1: Transaction created')

      const logger = createTransactionLogger('sendMessage')
      logger.logStart({ chatId, message: messageText.trim() }, tx)

      console.log('[ChatRoomPage] Step 2: Executing sponsored transaction...')
      const result = await executeSponsoredTx(tx)
      console.log('[ChatRoomPage] Step 2: Transaction result:', {
        success: result.success,
        digest: result.digest,
        error: result.error,
      })

      if (result.success) {
        logger.logSuccess(result)
        console.log('[ChatRoomPage] === Message sent successfully! ===')
        toast.success('Message sent!')
        setMessageText('')
        // Refetch messages after a short delay to allow transaction to be indexed
        console.log('[ChatRoomPage] Scheduling message refetch in 2 seconds...')
        setTimeout(() => {
          console.log('[ChatRoomPage] Refetching messages...')
          refetchMessages()
        }, 2000)
      } else {
        logger.logError(new Error(result.error || 'Unknown error'), { chatId, message: messageText.trim() })
        console.error('[ChatRoomPage] === Message send failed ===', result.error)
        toast.error(`Failed to send message: ${result.error}`)
      }
    } catch (error: any) {
      console.error('[ChatRoomPage] === Error ===', error.message)
      console.error('[ChatRoomPage] Stack:', error.stack)
      toast.error(`Error sending message: ${error.message}`)
    } finally {
      setIsSending(false)
      console.log('[ChatRoomPage] === End ===')
    }
  }

  const isLoading = isLoadingRoom || isLoadingMessages
  const error = roomError || messagesError

  // Parse chat room data (after all hooks)
  const chatRoom = chatRoomData ? parseChatObject(chatRoomData) : null

  // Don't render content if redirecting (after all hooks)
  if (account && !isRegistered) {
    return null
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Please sign in to view this chat room.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    )
  }

  if (error || !chatRoom) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <ErrorMessage
            message={error?.message || 'Chat room not found'}
            onRetry={() => {
              if (error) {
                router.refresh()
              }
            }}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="max-w-4xl mx-auto w-full px-4 py-4 flex flex-col flex-1">
        {/* Header */}
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/rooms')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Rooms
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{chatRoom.name}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{messageCount} messages</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{chatRoom.members.length} members</span>
                    </div>
                    {chatRoom.createdAt && (
                      <span>
                        Created {new Date(chatRoom.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                {chatRoom.isEncrypted ? (
                  <Badge variant="secondary">
                    <Lock className="h-3 w-3 mr-1" />
                    Encrypted
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <Globe className="h-3 w-3 mr-1" />
                    Public
                  </Badge>
                )}
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Messages */}
        <Card className="flex-1 flex flex-col mb-4">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No messages yet. Be the first to send a message!</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message.messageIndex}-${index}`}
                  className={`flex ${message.sender === account.address ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${message.sender === account.address
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                      }`}
                  >
                    <div className="text-xs opacity-70 mb-1">
                      {message.sender === account.address ? 'You' : `${message.sender.slice(0, 8)}...`}
                    </div>
                    <div className="break-words">{message.content}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </CardContent>
        </Card>

        {/* Message Input */}
        <Card>
          <CardContent className="pt-6">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex gap-2"
            >
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                disabled={isSending || isPending}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={!messageText.trim() || isSending || isPending}
              >
                {isSending || isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
