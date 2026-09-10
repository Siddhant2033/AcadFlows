import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { Card, Button, Input, Badge } from '../components/ui';
import { DashboardLayout, PageHeader } from '../components/layout';
import { formatTimeAgo } from '../lib/format';
import { cn } from '../lib/cn';

interface Conversation {
  _id: string;
  participants: { userId: string; userType: string }[];
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface Message {
  _id: string;
  senderId: string;
  senderType: string;
  recipientId: string;
  recipientType: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/communication/messages/conversations');
      setConversations(response.data.data.items || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedConversation) return;
    setLoadingMessages(true);
    try {
      const response = await api.get(
        `/communication/messages/${selectedConversation}?page=1&limit=100`,
      );
      setMessages(response.data.data.items || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      await api.post(`/communication/messages/${selectedConversation}/reply`, {
        content: newMessage.trim(),
      });
      setNewMessage('');
      await fetchMessages();
      await fetchConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getOtherParticipant = (conversation: Conversation) =>
    conversation.participants.find(p => p.userId !== user?.id);

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    }
    return d.toLocaleDateString('en-IN');
  };

  const filteredConversations = conversations.filter(conv => {
    const participant = getOtherParticipant(conv);
    if (!participant) return false;
    return participant.userType.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const selectedConv = conversations.find(c => c._id === selectedConversation);
  const selectedParticipant = selectedConv ? getOtherParticipant(selectedConv) : null;

  return (
    <DashboardLayout bare>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Page header */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6">
          <PageHeader
            title="Messages"
            description="Your conversations with teachers, guardians, and staff"
            breadcrumb={[
              { label: 'Dashboard', path: '/dashboard' },
              { label: 'Messages' },
            ]}
            className="mb-4"
          />
        </div>

        {/* Two-pane layout */}
        <div className="flex-1 min-h-0 px-4 sm:px-6 lg:px-8 pb-6">
          <Card padding="none" className="h-full overflow-hidden flex">
            {/* LEFT: Conversations list */}
            <div
              className={cn(
                'flex flex-col w-full md:w-80 lg:w-96 flex-shrink-0',
                'border-r border-border',
                selectedConversation && 'hidden md:flex',
              )}
            >
              {/* Search */}
              <div className="p-3 border-b border-border">
                <Input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search conversations..."
                  leftIcon="🔍"
                />
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-[3px] border-border border-t-primary-500" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <p className="text-4xl mb-2">💬</p>
                    <p className="text-sm text-muted">No conversations</p>
                    <p className="text-xs text-muted mt-1">
                      Start by replying to a message
                    </p>
                  </div>
                ) : (
                  filteredConversations.map(conv => {
                    const participant = getOtherParticipant(conv);
                    if (!participant) return null;
                    const isActive = selectedConversation === conv._id;

                    return (
                      <button
                        key={conv._id}
                        type="button"
                        onClick={() => setSelectedConversation(conv._id)}
                        className={cn(
                          'w-full text-left px-4 py-3 border-b border-border',
                          'transition-colors duration-150',
                          'hover:bg-elevated/60',
                          isActive
                            ? 'bg-primary-500/10 border-l-4 border-l-primary-500'
                            : 'border-l-4 border-l-transparent',
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent-500/15 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-accent-600 dark:text-accent-400">
                              {participant.userType.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="text-sm font-medium text-foreground capitalize truncate">
                                {participant.userType}
                              </p>
                              <span className="text-[10px] text-muted flex-shrink-0">
                                {formatTime(conv.lastMessageAt)}
                              </span>
                            </div>
                            <p className="text-xs text-muted truncate mt-0.5">
                              {conv.lastMessage || 'No messages yet'}
                            </p>
                          </div>
                          {conv.unreadCount > 0 && (
                            <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] font-semibold flex items-center justify-center flex-shrink-0">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT: Message thread */}
            <div
              className={cn(
                'flex-1 flex flex-col min-w-0',
                !selectedConversation && 'hidden md:flex',
              )}
            >
              {selectedConversation ? (
                <>
                  {/* Thread header */}
                  <div className="px-4 py-3 border-b border-border flex items-center gap-3 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedConversation(null)}
                      className="md:hidden p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-elevated"
                      aria-label="Back to conversations"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>

                    <div className="w-10 h-10 rounded-full bg-accent-500/15 flex items-center justify-center">
                      <span className="text-sm font-semibold text-accent-600 dark:text-accent-400">
                        {selectedParticipant?.userType.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground capitalize">
                        {selectedParticipant?.userType}
                      </p>
                      <p className="text-xs text-muted">Direct message</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-background/40">
                    {loadingMessages ? (
                      <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-6 w-6 border-[3px] border-border border-t-primary-500" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-4xl mb-2">👋</p>
                        <p className="text-sm text-muted">
                          Start the conversation below
                        </p>
                      </div>
                    ) : (
                      messages.map(message => {
                        const isOwn = message.senderId === user?.id;
                        return (
                          <div
                            key={message._id}
                            className={cn(
                              'flex',
                              isOwn ? 'justify-end' : 'justify-start',
                            )}
                          >
                            <div
                              className={cn(
                                'max-w-[75%] px-4 py-2.5 rounded-2xl',
                                isOwn
                                  ? 'bg-primary-500 text-white rounded-br-sm'
                                  : 'bg-surface border border-border text-foreground rounded-bl-sm',
                              )}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                              <p
                                className={cn(
                                  'text-[10px] mt-1 text-right',
                                  isOwn
                                    ? 'text-white/70'
                                    : 'text-muted',
                                )}
                              >
                                {formatTime(message.createdAt)}
                                {isOwn && message.isRead && ' ✓✓'}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Composer */}
                  <form
                    onSubmit={sendMessage}
                    className="p-3 border-t border-border flex gap-2 flex-shrink-0 bg-surface"
                  >
                    <Input
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1"
                      disabled={sending}
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={sending || !newMessage.trim()}
                      loading={sending}
                      leftIcon="➤"
                    >
                      Send
                    </Button>
                  </form>
                </>
              ) : (
                /* Empty state */
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-6xl mb-4">💬</p>
                    <p className="text-sm text-muted">
                      Select a conversation to start messaging
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}