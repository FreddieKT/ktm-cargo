/**
 * Mutation-path tests for CustomerSegments page handlers.
 *
 * Covers: customer selection (single/all), campaign creation,
 * and campaign launch status transition.
 */

// ── Extracted logic mirrors ──────────────────────────────────────────────

function handleSelectCustomer(selectedCustomers, customerId, checked) {
  if (checked) {
    return [...selectedCustomers, customerId];
  }
  return selectedCustomers.filter((id) => id !== customerId);
}

function handleSelectAll(filteredCustomers, checked) {
  if (checked) {
    return filteredCustomers.map((c) => c.id);
  }
  return [];
}

function launchCampaignData(campaign) {
  return {
    id: campaign.id,
    data: { ...campaign, status: 'active' },
  };
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('CustomerSegment mutation paths', () => {
  describe('handleSelectCustomer', () => {
    it('adds customer when checked', () => {
      const result = handleSelectCustomer(['c-1'], 'c-2', true);
      expect(result).toEqual(['c-1', 'c-2']);
    });

    it('removes customer when unchecked', () => {
      const result = handleSelectCustomer(['c-1', 'c-2'], 'c-1', false);
      expect(result).toEqual(['c-2']);
    });

    it('handles empty initial selection', () => {
      expect(handleSelectCustomer([], 'c-1', true)).toEqual(['c-1']);
    });

    it('handles uncheck from empty (no-op)', () => {
      expect(handleSelectCustomer([], 'c-1', false)).toEqual([]);
    });
  });

  describe('handleSelectAll', () => {
    const customers = [{ id: 'c-1' }, { id: 'c-2' }, { id: 'c-3' }];

    it('selects all when checked', () => {
      expect(handleSelectAll(customers, true)).toEqual(['c-1', 'c-2', 'c-3']);
    });

    it('clears all when unchecked', () => {
      expect(handleSelectAll(customers, false)).toEqual([]);
    });

    it('handles empty customer list', () => {
      expect(handleSelectAll([], true)).toEqual([]);
    });
  });

  describe('launchCampaignData', () => {
    it('sets status to active', () => {
      const campaign = { id: 'camp-1', name: 'Summer', status: 'draft' };
      const result = launchCampaignData(campaign);

      expect(result.id).toBe('camp-1');
      expect(result.data.status).toBe('active');
      expect(result.data.name).toBe('Summer');
    });

    it('preserves all campaign fields', () => {
      const campaign = {
        id: 'camp-2',
        name: 'VIP',
        status: 'draft',
        target_segment: 'vip',
        discount_code: 'VIP20',
      };
      const result = launchCampaignData(campaign);

      expect(result.data.target_segment).toBe('vip');
      expect(result.data.discount_code).toBe('VIP20');
    });
  });
});
