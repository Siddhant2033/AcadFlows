import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

interface Conversation {
  _id: string;
  participants: {
    userId: string;
    userType: string;
  }[];
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
  const { theme } = useTheme();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
    }
  }, [selectedConversation, page]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/communication/messages/conversations');
      setConversations(response.data.data.items);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/communication/messages/${selectedConversation}?page=${page}&limit=50`);
      const data = response.data.data;
      if (page === 1) {
        setMessages(data.items);
      } else {
        setMessages(prev => [...data.items, ...prev]);
      }
      setHasMore(data.items.length === 50);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
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

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.userId !== user?.id);
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString();
  };

  const filteredConversations = conversations.filter(conv => {
    const participant = getOtherParticipant(conv);
    if (!participant) return false;
    return participant.userType.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className={`rounded-lg shadow overflow-hidden transition-colors duration-200 ${
      theme ? 'bg-white' : 'dark:bg-[#1E293B]'
    }`}>
      <div className="flex h-[600px]">
        {/* Conversations List */}
        <div className={`w-1/3 border-r transition-colors duration-200 ${
          theme ? 'border-gray-200' : 'dark:border-[#334155]'
        }`}>
          <div className={`p-4 border-b transition-colors duration-200 ${
            theme ? 'border-gray-200' : 'dark:border-[#334155]'
          }`}>
            <h3 className={`font-semibold transition-colors duration-200 ${
              theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
            }`}>
              Messages
            </h3>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className={`mt-2 w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
              }`}
            />
          </div>

          <div className="overflow-y-auto h-[calc(100%-80px)]">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8">
                <p className={`text-sm transition-colors duration-200 ${
                  theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                }`}>
                  No conversations
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const participant = getOtherParticipant(conversation);
                if (!participant) return null;
                return (
                  <button
                    key={conversation._id}
                    onClick={() => setSelectedConversation(conversation._id)}
                    className={`w-full p-4 text-left border-b transition-all duration-200 ${
                      selectedConversation === conversation._id
                        ? theme ? 'bg-primary-50' : 'dark:bg-primary-900/20'
                        : theme ? 'hover:bg-gray-50' : 'dark:hover:bg-[#1E293B]/50'
                    } ${theme ? 'border-gray-100' : 'dark:border-[#334155]'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`font-medium transition-colors duration-200 ${
                          theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                        }`}>
                          {participant.userType.charAt(0).toUpperCase() + participant.userType.slice(1)}
                        </p>
                        <p className={`text-sm truncate max-w-[180px] transition-colors duration-200 ${
                          theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                        }`}>
                          {conversation.lastMessage}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-xs transition-colors duration-200 ${
                          theme ? 'text-gray-400' : 'dark:text-[#64748B]'
                        }`}>
                          {formatTime(conversation.lastMessageAt)}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-primary-600 text-white rounded-full">
                            {conversation.unreadCount}
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

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Messages Header */}
              <div className={`p-4 border-b transition-colors duration-200 ${
                theme ? 'border-gray-200' : 'dark:border-[#334155]'
              }`}>
                {(() => {
                  const conv = conversations.find(c => c._id === selectedConversation);
                  const participant = conv ? getOtherParticipant(conv) : null;
                  return (
                    <div>
                      <p className={`font-medium transition-colors duration-200 ${
                        theme ? 'text-gray-900' : 'dark:text-[#F1F5F9]'
                      }`}>
                        {participant ? participant.userType.charAt(0).toUpperCase() + participant.userType.slice(1) : 'Unknown'}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {page < 5 && hasMore && (
                  <button
                    onClick={() => setPage(p => p + 1)}
                    className="w-full text-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Load older messages
                  </button>
                )}
                {messages.map((message) => {
                  const isOwn = message.senderId === user?.id;
                  return (
                    <div
                      key={message._id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          isOwn
                            ? 'bg-primary-600 text-white'
                            : theme
                            ? 'bg-gray-100 text-gray-900'
                            : 'dark:bg-[#0F172A] dark:text-[#F1F5F9]'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          isOwn ? 'text-primary-100' : theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
                        }`}>
                          {formatTime(message.createdAt)}
                          {isOwn && message.isRead && ' ✓'}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className={`p-4 border-t transition-colors duration-200 ${
                theme ? 'border-gray-200' : 'dark:border-[#334155]'
              }`}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className={`flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                      theme ? 'bg-white border-gray-300 text-gray-900' : 'dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#F1F5F9]'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className={`text-sm transition-colors duration-200 ${
                theme ? 'text-gray-500' : 'dark:text-[#94A3B8]'
              }`}>
                Select a conversation to start messaging
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}