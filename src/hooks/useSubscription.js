/**
 * useSubscription — React hook for subscription state and tier gating.
 *
 * Usage:
 *   const { tier, isLoading, canUse, remaining } = useSubscription();
 *
 *   if (!canUse('reportsEnabled')) {
 *     return <UpgradePrompt />;
 *   }
 */

import { useQuery } from '@tanstack/react-query';
import { getSubscriptionStatus } from '@/lib/stripe';
import { resolveTier, checkLimit } from '@/lib/subscriptionTiers';

/**
 * @returns {{
 *   tier: import('@/lib/subscriptionTiers').TIERS['free'],
 *   tierName: string,
 *   status: string,
 *   currentPeriodEnd: string|null,
 *   isLoading: boolean,
 *   isPro: boolean,
 *   isEnterprise: boolean,
 *   isFree: boolean,
 *   isPastDue: boolean,
 *   canUse: (limitKey: string, currentUsage?: number) => boolean,
 *   remaining: (limitKey: string, currentUsage?: number) => number|boolean,
 * }}
 */
export function useSubscription() {
  const { data, isLoading } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: getSubscriptionStatus,
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
    retry: 1,
  });

  const status = data?.status || 'none';
  const tierKey = data?.tier || 'free';
  const tier = resolveTier(status, tierKey);

  /**
   * Check whether the current tier allows a feature / has remaining capacity.
   * @param {string} limitKey — key from tier.limits
   * @param {number} [currentUsage=0]
   * @returns {boolean}
   */
  const canUse = (limitKey, currentUsage = 0) => {
    return checkLimit(tier, limitKey, currentUsage).allowed;
  };

  /**
   * Get remaining capacity for a numeric limit.
   * @param {string} limitKey
   * @param {number} [currentUsage=0]
   * @returns {number|boolean}
   */
  const remaining = (limitKey, currentUsage = 0) => {
    return checkLimit(tier, limitKey, currentUsage).remaining;
  };

  return {
    tier,
    tierName: tier.name,
    status,
    currentPeriodEnd: data?.currentPeriodEnd || null,
    isLoading,
    isPro: tier.id === 'pro',
    isEnterprise: tier.id === 'enterprise',
    isFree: tier.id === 'free',
    isPastDue: status === 'past_due',
    canUse,
    remaining,
  };
}
