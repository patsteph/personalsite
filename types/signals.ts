/**
 * Signal types for the Signals section of the website
 * This includes Newsletters and Articles that are recommended by the author
 */

/**
 * Base Signal type containing shared properties
 */
export interface SignalBase {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  dateAdded: string;
  featured: boolean;
  tags: string[];
}

/**
 * Newsletter type for recommended newsletter subscriptions
 */
export interface Newsletter extends SignalBase {
  type: 'newsletter';
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  publisher: string;
  subscriptionUrl: string;
  sampleUrl?: string;
  affiliateCode?: string;
}

/**
 * Article type for recommended external articles
 */
export interface Article extends SignalBase {
  type: 'article';
  author: string;
  source: string;
  publishDate: string;
  readingTime?: number; // in minutes
  affiliateCode?: string;
}

/**
 * Combined Signal type (either Newsletter or Article)
 */
export type Signal = Newsletter | Article;

/**
 * SignalCollection for grouping related signals
 */
export interface SignalCollection {
  id: string;
  title: string;
  description: string;
  signals: Signal[];
  dateCreated: string;
  dateUpdated: string;
}