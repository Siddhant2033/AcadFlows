import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  tenantId: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  title: string;
  message: string;
  link?: string;
  linkText?: string;
  read: boolean;
  readAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAnnouncement extends Document {
  tenantId: string;
  title: string;
  content: string;
  type: 'general' | 'academic' | 'event' | 'emergency' | 'holiday';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetAudience: 'all' | 'students' | 'teachers' | 'guardians' | 'specific';
  targetUserIds?: string[];
  targetGrades?: string[];
  targetSections?: string[];
  attachments?: {
    name: string;
    url: string;
    size?: number;
  }[];
  publishedAt: Date;
  expiresAt?: Date;
  isPublished: boolean;
  createdBy: string;
  readBy: {
    userId: string;
    readAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage extends Document {
  tenantId: string;
  senderId: string;
  senderType: 'admin' | 'teacher' | 'guardian' | 'student';
  recipientId: string;
  recipientType: 'admin' | 'teacher' | 'guardian' | 'student';
  subject?: string;
  content: string;
  attachments?: {
    name: string;
    url: string;
    size?: number;
  }[];
  isRead: boolean;
  readAt?: Date;
  parentMessageId?: string;
  conversationId: string;
  isDeleted: boolean;
  deletedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversation extends Document {
  tenantId: string;
  participants: {
    userId: string;
    userType: 'admin' | 'teacher' | 'guardian' | 'student';
    lastReadAt?: Date;
  }[];
  lastMessage?: string;
  lastMessageAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Notification Schema
const notificationSchema = new Schema<INotification>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'error', 'system'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: String,
    linkText: String,
    read: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Announcement Schema
const announcementSchema = new Schema<IAnnouncement>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['general', 'academic', 'event', 'emergency', 'holiday'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    targetAudience: {
      type: String,
      enum: ['all', 'students', 'teachers', 'guardians', 'specific'],
      default: 'all',
    },
    targetUserIds: [String],
    targetGrades: [String],
    targetSections: [String],
    attachments: [{
      name: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      size: Number,
    }],
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: Date,
    isPublished: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
    readBy: [{
      userId: {
        type: String,
        required: true,
      },
      readAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Message Schema
const messageSchema = new Schema<IMessage>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: String,
      required: true,
      index: true,
    },
    senderType: {
      type: String,
      enum: ['admin', 'teacher', 'guardian', 'student'],
      required: true,
    },
    recipientId: {
      type: String,
      required: true,
      index: true,
    },
    recipientType: {
      type: String,
      enum: ['admin', 'teacher', 'guardian', 'student'],
      required: true,
    },
    subject: String,
    content: {
      type: String,
      required: true,
    },
    attachments: [{
      name: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      size: Number,
    }],
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    parentMessageId: {
      type: String,
      index: true,
    },
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedBy: String,
  },
  {
    timestamps: true,
  }
);

// Conversation Schema
const conversationSchema = new Schema<IConversation>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    participants: [{
      userId: {
        type: String,
        required: true,
      },
      userType: {
        type: String,
        enum: ['admin', 'teacher', 'guardian', 'student'],
        required: true,
      },
      lastReadAt: Date,
    }],
    lastMessage: String,
    lastMessageAt: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationSchema.index({ tenantId: 1, userId: 1, read: 1 });
notificationSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });

announcementSchema.index({ tenantId: 1, publishedAt: -1 });
announcementSchema.index({ tenantId: 1, isPublished: 1, expiresAt: 1 });
announcementSchema.index({ tenantId: 1, type: 1, priority: 1 });

messageSchema.index({ tenantId: 1, conversationId: 1, createdAt: -1 });
messageSchema.index({ tenantId: 1, senderId: 1, isDeleted: 1 });
messageSchema.index({ tenantId: 1, recipientId: 1, isRead: 1, isDeleted: 1 });

conversationSchema.index({ tenantId: 1, participants: 1 });
conversationSchema.index({ tenantId: 1, 'participants.userId': 1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export const Announcement = mongoose.model<IAnnouncement>('Announcement', announcementSchema);
export const Message = mongoose.model<IMessage>('Message', messageSchema);
export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);