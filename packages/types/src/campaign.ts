import {
  CampaignStatus,
  CampaignVisibility,
  BudgetType,
  ApplicationStatus,
  ContentType,
  SocialPlatform,
} from '@markinflu/database';

// ============================================
// CAMPAIGN TYPES
// ============================================

export interface CampaignBrief {
  objective: string;
  keyMessages: string[];
  dos: string[];
  donts: string[];
  hashtags: string[];
  mentions: string[];
  referenceLinks?: string[];
  moodboard?: string[];
}

export interface CampaignRequirements {
  minFollowers?: number;
  maxFollowers?: number;
  platforms?: SocialPlatform[];
  niches?: string[];
  countries?: string[];
  languages?: string[];
  minEngagementRate?: number;
  ageRange?: {
    min?: number;
    max?: number;
  };
  verifiedOnly?: boolean;
}

export interface DeliverableSpec {
  type: ContentType;
  quantity: number;
  duration?: string;
  deadline?: string;
  notes?: string;
}

export interface CampaignDeliverableSpecs {
  items: DeliverableSpec[];
}

// ============================================
// CAMPAIGN DTOs
// ============================================

export interface CreateCampaignDto {
  title: string;
  description: string;
  brief?: CampaignBrief;
  requirements?: CampaignRequirements;
  deliverableSpecs?: CampaignDeliverableSpecs;
  budgetMin?: number;
  budgetMax?: number;
  budgetType?: BudgetType;
  currency?: string;
  applicationDeadline?: Date;
  startDate?: Date;
  endDate?: Date;
  visibility?: CampaignVisibility;
  maxCreators?: number;
  coverImageUrl?: string;
}

export interface UpdateCampaignDto extends Partial<CreateCampaignDto> {
  status?: CampaignStatus;
}

export interface CampaignPublic {
  id: string;
  slug: string;
  title: string;
  description: string;
  brief: CampaignBrief | null;
  requirements: CampaignRequirements | null;
  deliverableSpecs: CampaignDeliverableSpecs | null;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetType: BudgetType;
  currency: string;
  applicationDeadline: Date | null;
  startDate: Date | null;
  endDate: Date | null;
  status: CampaignStatus;
  maxCreators: number;
  currentCreators: number;
  coverImageUrl: string | null;
  createdAt: Date;
  publishedAt: Date | null;
  // Relations
  brand: {
    id: string;
    companyName: string;
    logoUrl: string | null;
    industry: string[];
  };
  // Computed
  spotsRemaining: number;
  isExpired: boolean;
  hasApplied?: boolean; // For authenticated creators
}

// ============================================
// APPLICATION TYPES
// ============================================

export interface ApplicationProposal {
  deliverables: Array<{
    type: ContentType;
    quantity: number;
    price: number;
    notes?: string;
  }>;
  totalPrice: number;
  timeline: string;
  revisions?: number;
  notes?: string;
}

export interface CreateApplicationDto {
  campaignId: string;
  proposedRate?: number;
  pitch?: string;
  proposal?: ApplicationProposal;
  portfolioLinks?: string[];
}

export interface UpdateApplicationStatusDto {
  status: ApplicationStatus;
  internalNotes?: string;
  rejectionReason?: string;
}

export interface ApplicationWithDetails {
  id: string;
  status: ApplicationStatus;
  proposedRate: number | null;
  pitch: string | null;
  proposal: ApplicationProposal | null;
  portfolioLinks: string[];
  appliedAt: Date;
  shortlistedAt: Date | null;
  rejectedAt: Date | null;
  hiredAt: Date | null;
  // Relations
  creator: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    primaryNiche: string | null;
    isVerified: boolean;
    totalFollowers: number;
    avgEngagementRate: number;
  };
  campaign: {
    id: string;
    title: string;
    status: CampaignStatus;
  };
}

// ============================================
// SEARCH & FILTER TYPES
// ============================================

export interface CampaignSearchFilters {
  query?: string;
  industries?: string[];
  budgetMin?: number;
  budgetMax?: number;
  platforms?: SocialPlatform[];
  niches?: string[];
  countries?: string[];
  status?: CampaignStatus;
  hasSpots?: boolean;
}

export interface CampaignSearchParams extends CampaignSearchFilters {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'applicationDeadline' | 'budgetMax' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}
