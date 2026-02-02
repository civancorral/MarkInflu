// Re-export of database enums to avoid build circular dependency issues
// These should match the Prisma schema enums exactly

export enum UserRole {
  BRAND = 'BRAND',
  CREATOR = 'CREATOR',
  AGENCY = 'AGENCY',
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export enum CompanySize {
  SOLO = 'SOLO',
  SMALL_2_10 = 'SMALL_2_10',
  MEDIUM_11_50 = 'MEDIUM_11_50',
  LARGE_51_200 = 'LARGE_51_200',
  ENTERPRISE_201_PLUS = 'ENTERPRISE_201_PLUS',
}

export enum ContentType {
  POST = 'POST',
  STORY = 'STORY',
  REEL = 'REEL',
  VIDEO = 'VIDEO',
  LIVE = 'LIVE',
  ARTICLE = 'ARTICLE',
  PODCAST = 'PODCAST',
}

export enum SocialPlatform {
  INSTAGRAM = 'INSTAGRAM',
  TIKTOK = 'TIKTOK',
  YOUTUBE = 'YOUTUBE',
  TWITTER = 'TWITTER',
  FACEBOOK = 'FACEBOOK',
  LINKEDIN = 'LINKEDIN',
  TWITCH = 'TWITCH',
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum CampaignVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  INVITE_ONLY = 'INVITE_ONLY',
}

export enum BudgetType {
  FIXED = 'FIXED',
  RANGE = 'RANGE',
  NEGOTIABLE = 'NEGOTIABLE',
}

export enum ApplicationStatus {
  APPLIED = 'APPLIED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  SHORTLISTED = 'SHORTLISTED',
  REJECTED = 'REJECTED',
  HIRED = 'HIRED',
  WITHDRAWN = 'WITHDRAWN',
}
