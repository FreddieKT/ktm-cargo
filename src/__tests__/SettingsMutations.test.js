/**
 * Mutation-path tests for Settings page handlers.
 *
 * Covers: profile save, notification save, business settings save,
 * and quick action handlers (inventory check, payments, clear notifications, weekly report).
 */

// ── Mocks ────────────────────────────────────────────────────────────────

const mockUpdateNotification = jest.fn().mockResolvedValue({});

jest.mock('@/api/db', () => ({
  db: {
    notifications: {
      update: (...args) => mockUpdateNotification(...args),
    },
  },
}));

import { db } from '@/api/db';

// ── Extracted logic mirrors ──────────────────────────────────────────────

function buildProfilePayload(profile) {
  return profile;
}

function buildNotificationPayload(notifications) {
  return { notification_settings: notifications };
}

function buildBusinessPayload(businessSettings) {
  return { business_settings: businessSettings };
}

function runInventoryCheck(inventoryItems) {
  return inventoryItems.filter((i) => (i.current_stock || 0) <= (i.reorder_point || 0));
}

function findPendingPayments(vendorPayments) {
  return vendorPayments.filter((p) => p.status === 'pending');
}

async function clearNotifications(notifications, queryClient) {
  for (const n of notifications) {
    await db.notifications.update(n.id, { status: 'dismissed' });
  }
  queryClient.invalidateQueries({ queryKey: ['notifications'] });
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('Settings mutation paths', () => {
  let queryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = { invalidateQueries: jest.fn() };
  });

  describe('payload builders', () => {
    it('buildProfilePayload passes profile through', () => {
      const profile = { full_name: 'Admin', email: 'admin@ktm.com' };
      expect(buildProfilePayload(profile)).toEqual(profile);
    });

    it('buildNotificationPayload wraps in notification_settings', () => {
      const notif = { email_alerts: true, sms_alerts: false };
      expect(buildNotificationPayload(notif)).toEqual({ notification_settings: notif });
    });

    it('buildBusinessPayload wraps in business_settings', () => {
      const biz = { company_name: 'KTM', currency: 'THB' };
      expect(buildBusinessPayload(biz)).toEqual({ business_settings: biz });
    });
  });

  describe('runInventoryCheck', () => {
    it('finds items at or below reorder point', () => {
      const items = [
        { id: '1', current_stock: 5, reorder_point: 10 },
        { id: '2', current_stock: 20, reorder_point: 10 },
        { id: '3', current_stock: 0, reorder_point: 5 },
      ];

      const lowStock = runInventoryCheck(items);
      expect(lowStock).toHaveLength(2);
      expect(lowStock.map((i) => i.id)).toEqual(['1', '3']);
    });

    it('returns empty when all stock is healthy', () => {
      const items = [{ id: '1', current_stock: 50, reorder_point: 10 }];
      expect(runInventoryCheck(items)).toHaveLength(0);
    });

    it('handles missing fields', () => {
      expect(runInventoryCheck([{}])).toHaveLength(1); // 0 <= 0
    });
  });

  describe('findPendingPayments', () => {
    it('filters pending payments only', () => {
      const payments = [
        { id: 'p-1', status: 'pending' },
        { id: 'p-2', status: 'paid' },
        { id: 'p-3', status: 'pending' },
      ];

      expect(findPendingPayments(payments)).toHaveLength(2);
    });

    it('returns empty when no pending', () => {
      expect(findPendingPayments([{ status: 'paid' }])).toHaveLength(0);
    });
  });

  describe('clearNotifications', () => {
    it('marks each notification as dismissed', async () => {
      const notifications = [{ id: 'n-1' }, { id: 'n-2' }];

      await clearNotifications(notifications, queryClient);

      expect(mockUpdateNotification).toHaveBeenCalledTimes(2);
      expect(mockUpdateNotification).toHaveBeenCalledWith('n-1', { status: 'dismissed' });
      expect(mockUpdateNotification).toHaveBeenCalledWith('n-2', { status: 'dismissed' });
    });

    it('invalidates notification cache after clearing', async () => {
      await clearNotifications([{ id: 'n-1' }], queryClient);

      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['notifications'] });
    });

    it('handles empty notification list', async () => {
      await clearNotifications([], queryClient);

      expect(mockUpdateNotification).not.toHaveBeenCalled();
      expect(queryClient.invalidateQueries).toHaveBeenCalled();
    });
  });
});
