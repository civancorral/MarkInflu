// Auth types
export * from './auth';

// User & Profile types
export * from './user';

// Campaign types
export * from './campaign';

// Re-export database enums for convenience
export {
  UserRole,
  AccountStatus,
  StripeConnectStatus,
  CompanySize,
  ContentType,
  SocialPlatform,
  SnapshotPeriod,
  CampaignStatus,
  CampaignVisibility,
  BudgetType,
  InvitationStatus,
  ApplicationStatus,
  ContractStatus,
  MilestoneStatus,
  MilestoneTrigger,
  DeliverableStatus,
  VideoProvider,
  VideoStatus,
  VersionStatus,
  AnnotationType,
  CommentType,
  CommentPriority,
  EscrowStatus,
  PaymentStatus,
  PaymentType,
  DisputeStatus,
  DisputeReason,
  ChatType,
  MessageContentType,
  NotificationType,
} from '@markinflu/database';

// Common API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
