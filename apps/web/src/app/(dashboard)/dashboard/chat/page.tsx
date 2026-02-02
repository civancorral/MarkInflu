'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import {
  MessageSquare,
  Send,
  Search,
  ArrowLeft,
  Paperclip,
  Check,
  CheckCheck,
  Reply,
  X,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChatParticipant {
  id: string;
  userId: string;
  unreadCount: number;
  user: {
    id: string;
    email: string;
    brandProfile?: { companyName: string; logoUrl: string | null } | null;
    creatorProfile?: { displayName: string; avatarUrl: string | null } | null;
  };
}

interface Chat {
  id: string;
  type: string;
  contractId: string | null;
  title: string | null;
  lastMessageAt: string | null;
  participants: ChatParticipant[];
  unreadCount: number;
  lastMessage: {
    id: string;
    content: string;
    contentType: string;
    senderUserId: string;
    createdAt: string;
  } | null;
}

interface Message {
  id: string;
  chatId: string;
  content: string;
  contentType: string;
  senderUserId: string;
  attachments: any;
  createdAt: string;
  replyToMessage?: {
    id: string;
    content: string;
    senderUserId: string;
  } | null;
  sender: {
    id: string;
    email: string;
    brandProfile?: { companyName: string; logoUrl: string | null } | null;
    creatorProfile?: { displayName: string; avatarUrl: string | null } | null;
  };
}

function getUserDisplayName(user: ChatParticipant['user']): string {
  if (user.brandProfile?.companyName) return user.brandProfile.companyName;
  if (user.creatorProfile?.displayName) return user.creatorProfile.displayName;
  return user.email.split('@')[0]!;
}

function getUserAvatar(user: ChatParticipant['user']): string | null {
  return user.brandProfile?.logoUrl || user.creatorProfile?.avatarUrl || null;
}

export default function ChatPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const initialChatId = searchParams.get('chatId');

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(initialChatId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const currentUserId = session?.user?.id;

  // Fetch chat list
  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch('/api/chat');
      if (res.ok) {
        const json = await res.json();
        setChats(json.data || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch messages for selected chat
  const fetchMessages = useCallback(async (chatId: string) => {
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/chat/${chatId}/messages`);
      if (res.ok) {
        const json = await res.json();
        setMessages((json.data || []).reverse());
      }
    } catch {
      toast.error('Error al cargar mensajes');
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Load messages when chat selected
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat);
      // Mark as read
      fetch(`/api/chat/${selectedChat}/read`, { method: 'PATCH' }).catch(() => {});
    }
  }, [selectedChat, fetchMessages]);

  // Poll for new messages
  useEffect(() => {
    if (selectedChat) {
      pollingRef.current = setInterval(() => {
        fetchMessages(selectedChat);
        fetchChats();
      }, 5000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [selectedChat, fetchMessages, fetchChats]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedChat || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/chat/${selectedChat}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage.trim(),
          replyToMessageId: replyTo?.id,
        }),
      });

      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setNewMessage('');
        setReplyTo(null);
        fetchChats(); // Update last message in list
      } else {
        toast.error('Error al enviar mensaje');
      }
    } catch {
      toast.error('Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Get other participant for display
  const getOtherParticipant = (chat: Chat) => {
    return chat.participants.find((p) => p.userId !== currentUserId);
  };

  const getChatDisplayName = (chat: Chat) => {
    if (chat.title) return chat.title;
    const other = getOtherParticipant(chat);
    return other ? getUserDisplayName(other.user) : 'Chat';
  };

  // Filter chats
  const filteredChats = chats.filter((chat) => {
    if (!searchQuery) return true;
    const name = getChatDisplayName(chat).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const selectedChatData = chats.find((c) => c.id === selectedChat);

  return (
    <div className="-m-4 lg:-m-8 flex h-[calc(100vh-4rem)]">
      {/* Chat List */}
      <div
        className={cn(
          'w-full flex-shrink-0 border-r border-border bg-card lg:w-80',
          selectedChat ? 'hidden lg:flex lg:flex-col' : 'flex flex-col',
        )}
      >
        {/* Header */}
        <div className="border-b border-border p-4">
          <h1 className="mb-3 text-lg font-semibold">Mensajes</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar conversación..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Sin resultados' : 'No tienes conversaciones aún'}
              </p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const other = getOtherParticipant(chat);
              const avatar = other ? getUserAvatar(other.user) : null;
              const name = getChatDisplayName(chat);
              const isSelected = chat.id === selectedChat;

              return (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat.id)}
                  className={cn(
                    'flex w-full items-start gap-3 border-b border-border/50 p-4 text-left transition-colors hover:bg-accent/50',
                    isSelected && 'bg-accent',
                  )}
                >
                  {/* Avatar */}
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      name.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className={cn('truncate text-sm', chat.unreadCount > 0 && 'font-semibold')}>
                        {name}
                      </p>
                      {chat.lastMessage && (
                        <span className="flex-shrink-0 text-xs text-muted-foreground">
                          {formatRelativeTime(new Date(chat.lastMessage.createdAt))}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="truncate text-xs text-muted-foreground">
                        {chat.lastMessage
                          ? chat.lastMessage.senderUserId === currentUserId
                            ? `Tú: ${chat.lastMessage.content}`
                            : chat.lastMessage.content
                          : 'Sin mensajes'}
                      </p>
                      {chat.unreadCount > 0 && (
                        <span className="ml-2 flex h-5 min-w-[1.25rem] flex-shrink-0 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Conversation Area */}
      <div
        className={cn(
          'flex flex-1 flex-col',
          !selectedChat ? 'hidden lg:flex' : 'flex',
        )}
      >
        {!selectedChat ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <MessageSquare className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <h2 className="text-lg font-medium text-muted-foreground">
              Selecciona una conversación
            </h2>
            <p className="mt-1 text-sm text-muted-foreground/70">
              Elige un chat del panel izquierdo para comenzar
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <button
                onClick={() => setSelectedChat(null)}
                className="rounded-lg p-1 hover:bg-accent lg:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              {selectedChatData && (
                <>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {(() => {
                      const other = getOtherParticipant(selectedChatData);
                      const avatar = other ? getUserAvatar(other.user) : null;
                      const name = getChatDisplayName(selectedChatData);
                      return avatar ? (
                        <img src={avatar} alt={name} className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        name.charAt(0).toUpperCase()
                      );
                    })()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {getChatDisplayName(selectedChatData)}
                    </p>
                    {selectedChatData.type === 'CONTRACT' && (
                      <p className="text-xs text-muted-foreground">Chat de contrato</p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {messagesLoading && messages.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    No hay mensajes aún. ¡Envía el primero!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg, i) => {
                    const isMine = msg.senderUserId === currentUserId;
                    const showAvatar =
                      !isMine &&
                      (i === 0 || messages[i - 1]?.senderUserId !== msg.senderUserId);
                    const senderName = getUserDisplayName(msg.sender);

                    return (
                      <div
                        key={msg.id}
                        className={cn('flex gap-2', isMine ? 'justify-end' : 'justify-start')}
                      >
                        {/* Avatar */}
                        {!isMine && (
                          <div className="w-8 flex-shrink-0">
                            {showAvatar && (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                                {senderName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div className={cn('group max-w-[70%]')}>
                          {/* Reply preview */}
                          {msg.replyToMessage && (
                            <div
                              className={cn(
                                'mb-1 rounded-lg border-l-2 border-brand-500 bg-muted/50 px-3 py-1 text-xs text-muted-foreground',
                                isMine ? 'ml-auto' : '',
                              )}
                            >
                              {msg.replyToMessage.content.slice(0, 80)}
                            </div>
                          )}

                          <div
                            className={cn(
                              'relative rounded-2xl px-4 py-2 text-sm',
                              isMine
                                ? 'bg-brand-500 text-white'
                                : 'bg-muted text-foreground',
                            )}
                          >
                            {!isMine && showAvatar && (
                              <p className="mb-0.5 text-xs font-semibold opacity-70">
                                {senderName}
                              </p>
                            )}
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            <div
                              className={cn(
                                'mt-1 flex items-center gap-1 text-[10px]',
                                isMine ? 'justify-end text-white/70' : 'text-muted-foreground',
                              )}
                            >
                              {formatRelativeTime(new Date(msg.createdAt))}
                              {isMine && <CheckCheck className="h-3 w-3" />}
                            </div>
                          </div>

                          {/* Reply action */}
                          <button
                            onClick={() => {
                              setReplyTo(msg);
                              inputRef.current?.focus();
                            }}
                            className="mt-0.5 hidden text-xs text-muted-foreground hover:text-foreground group-hover:inline-flex items-center gap-1"
                          >
                            <Reply className="h-3 w-3" /> Responder
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Reply Preview */}
            {replyTo && (
              <div className="flex items-center gap-2 border-t border-border bg-muted/30 px-4 py-2">
                <Reply className="h-4 w-4 text-brand-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-brand-500">
                    Respondiendo a {getUserDisplayName(replyTo.sender)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {replyTo.content.slice(0, 100)}
                  </p>
                </div>
                <button onClick={() => setReplyTo(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-border p-4">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe un mensaje..."
                  rows={1}
                  className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-xl border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sending}
                  className={cn(
                    'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors',
                    newMessage.trim()
                      ? 'bg-brand-500 text-white hover:bg-brand-600'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
