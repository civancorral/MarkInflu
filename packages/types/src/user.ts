import {
  UserRole,
  ContentType,
  SocialPlatform,
  CompanySize,
} from '@markinflu/database';

// ============================================
// CREATOR PROFILE TYPES
// ============================================

export interface CreatorRates {
  [platform: string]: {
    [format: string]: {
      price: number;
      currency: string;
      notes?: string;
    };
  };
}

export interface CreatorProfileDto {
  displayName: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  tagline?: string;
  location?: string;
  city?: string;
  country?: string;
  timezone?: string;
  languages: string[];
  primaryNiche?: string;
  secondaryNiches: string[];
  contentTypes: ContentType[];
  rates?: CreatorRates;
  minimumBudget?: number;
  currency?: string;
  isAvailable?: boolean;
  preferredBrands?: string[];
  excludedBrands?: string[];
  keywords?: string[];
  avatarUrl?: string;
  coverImageUrl?: string;
  portfolioUrls?: string[];
}

export interface CreatorProfilePublic {
  id: string;
  displayName: string;
  bio: string | null;
  tagline: string | null;
  location: string | null;
  country: string | null;
  languages: string[];
  primaryNiche: string | null;
  secondaryNiches: string[];
  contentTypes: ContentType[];
  rates: CreatorRates | null;
  minimumBudget: number | null;
  currency: string;
  isAvailable: boolean;
  isVerified: boolean;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  socialAccounts: SocialAccountPublic[];
  // Computed
  totalFollowers: number;
  avgEngagementRate: number;
}

export interface SocialAccountPublic {
  platform: SocialPlatform;
  username: string;
  profileUrl: string;
  followers: number;
  engagementRate: number | null;
  avgLikes: number | null;
  avgComments: number | null;
  avgViews: number | null;
  isVerified: boolean;
}

// ============================================
// BRAND PROFILE TYPES
// ============================================

export interface BrandProfileDto {
  companyName: string;
  legalName?: string;
  taxId?: string;
  industry: string[];
  companySize?: CompanySize;
  website?: string;
  logoUrl?: string;
  brandColors?: {
    primary: string;
    secondary?: string;
  };
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: AddressDto;
  billingEmail?: string;
  billingAddress?: AddressDto;
}

export interface AddressDto {
  street?: string;
  city?: string;
  state?: string;
  country: string;
  zip?: string;
}

// ============================================
// AGENCY PROFILE TYPES
// ============================================

export interface AgencyProfileDto {
  agencyName: string;
  website?: string;
  logoUrl?: string;
  description?: string;
  managedCreators?: string[]; // Creator profile IDs
}

// ============================================
// SOCIAL ACCOUNT TYPES
// ============================================

export interface ConnectSocialAccountDto {
  platform: SocialPlatform;
  username: string;
  profileUrl: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface UpdateSocialMetricsDto {
  followers?: number;
  following?: number;
  postsCount?: number;
  engagementRate?: number;
  avgLikes?: number;
  avgComments?: number;
  avgViews?: number;
}

// ============================================
// SEARCH & FILTER TYPES
// ============================================

export interface CreatorSearchFilters {
  query?: string;
  niches?: string[];
  platforms?: SocialPlatform[];
  countries?: string[];
  languages?: string[];
  minFollowers?: number;
  maxFollowers?: number;
  minEngagementRate?: number;
  maxBudget?: number;
  contentTypes?: ContentType[];
  isVerified?: boolean;
  isAvailable?: boolean;
}

export interface CreatorSearchParams extends CreatorSearchFilters {
  page?: number;
  limit?: number;
  sortBy?: 'followers' | 'engagementRate' | 'createdAt' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
