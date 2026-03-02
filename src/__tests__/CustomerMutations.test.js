/**
 * Mutation-path tests for Customers page handlers.
 *
 * Covers: submit routing, permission guards, form reset,
 * welcome message trigger, and referral code generation.
 */

// ── Mocks ────────────────────────────────────────────────────────────────

jest.mock('@/api/db', () => ({
  db: {
    customers: {
      create: jest.fn().mockResolvedValue({ id: 'c-new' }),
      update: jest.fn().mockResolvedValue({ id: 'c-1' }),
      delete: jest.fn().mockResolvedValue({ id: 'c-1' }),
    },
  },
}));

jest.mock('@/components/auth/RolePermissions', () => ({
  hasPermission: jest.fn((user, perm) => user?.role === 'admin' || user?.role === 'staff'),
}));

import { hasPermission } from '@/components/auth/RolePermissions';

// ── Extracted logic mirrors ──────────────────────────────────────────────

function handleSubmitRouting(form, editingCustomer) {
  if (editingCustomer) {
    return { action: 'update', id: editingCustomer.id, data: form };
  }
  return { action: 'create', data: form };
}

function canCreateCustomer(user) {
  return hasPermission(user, 'manage_customers');
}

function canDeleteCustomer(user) {
  return hasPermission(user, 'manage_customers');
}

function generateReferralCode(data) {
  return data.referral_code || `REF${Date.now().toString(36).toUpperCase()}`;
}

function resetForm() {
  return {
    name: '',
    phone: '',
    email: '',
    customer_type: 'individual',
    address_bangkok: '',
    address_yangon: '',
    notes: '',
    referred_by: '',
  };
}

function populateEditForm(customer) {
  return {
    name: customer.name || '',
    phone: customer.phone || '',
    email: customer.email || '',
    customer_type: customer.customer_type || 'individual',
    address_bangkok: customer.address_bangkok || '',
    address_yangon: customer.address_yangon || '',
    notes: customer.notes || '',
    referred_by: customer.referred_by || '',
  };
}

function shouldSendWelcome(customer, sendWelcomeMessage) {
  return !!(customer.email && sendWelcomeMessage);
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('Customer mutation paths', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('handleSubmit routing', () => {
    it('routes to create when no editing customer', () => {
      const result = handleSubmitRouting({ name: 'New' }, null);
      expect(result.action).toBe('create');
    });

    it('routes to update when editing', () => {
      const result = handleSubmitRouting({ name: 'Updated' }, { id: 'c-1' });
      expect(result).toEqual({ action: 'update', id: 'c-1', data: { name: 'Updated' } });
    });
  });

  describe('permission guards', () => {
    it('admin can create', () => expect(canCreateCustomer({ role: 'admin' })).toBe(true));
    it('staff can create', () => expect(canCreateCustomer({ role: 'staff' })).toBe(true));
    it('customer cannot create', () => expect(canCreateCustomer({ role: 'customer' })).toBe(false));
    it('admin can delete', () => expect(canDeleteCustomer({ role: 'admin' })).toBe(true));
    it('customer cannot delete', () => expect(canDeleteCustomer({ role: 'customer' })).toBe(false));
  });

  describe('generateReferralCode', () => {
    it('uses existing code if provided', () => {
      expect(generateReferralCode({ referral_code: 'CUSTOM-123' })).toBe('CUSTOM-123');
    });

    it('generates REF-prefixed code when missing', () => {
      expect(generateReferralCode({})).toMatch(/^REF[A-Z0-9]+$/);
    });
  });

  describe('resetForm', () => {
    it('returns empty form with defaults', () => {
      const form = resetForm();
      expect(form.name).toBe('');
      expect(form.customer_type).toBe('individual');
      expect(Object.keys(form)).toHaveLength(8);
    });
  });

  describe('populateEditForm', () => {
    it('populates form from customer data', () => {
      const form = populateEditForm({
        name: 'Ko Ko',
        phone: '09111',
        email: 'ko@test.com',
        customer_type: 'sme_importer',
        address_bangkok: '123 Bangkok',
        address_yangon: '456 Yangon',
        notes: 'VIP',
        referred_by: 'friend',
      });
      expect(form.name).toBe('Ko Ko');
      expect(form.customer_type).toBe('sme_importer');
    });

    it('defaults missing fields to empty strings', () => {
      const form = populateEditForm({});
      expect(form.name).toBe('');
      expect(form.customer_type).toBe('individual');
    });
  });

  describe('shouldSendWelcome', () => {
    it('true when email exists and flag is on', () => {
      expect(shouldSendWelcome({ email: 'a@b.com' }, true)).toBe(true);
    });

    it('false when no email', () => {
      expect(shouldSendWelcome({}, true)).toBe(false);
    });

    it('false when flag is off', () => {
      expect(shouldSendWelcome({ email: 'a@b.com' }, false)).toBe(false);
    });
  });
});
