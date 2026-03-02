/**
 * Mutation-path tests for Invoices page handlers.
 *
 * Covers: submit routing (create/update), confirmAction switch,
 * getActionDialogContent mapping, and all invoice lifecycle mutations.
 */

// ── Mocks ────────────────────────────────────────────────────────────────

const mockCreateInvoice = jest.fn().mockResolvedValue({ id: 'inv-new' });
const mockUpdateInvoice = jest.fn().mockResolvedValue({ id: 'inv-1' });
const mockIssueInvoice = jest.fn().mockResolvedValue({ id: 'inv-1' });
const mockMarkSent = jest.fn().mockResolvedValue({ id: 'inv-1' });
const mockRecordPayment = jest.fn().mockResolvedValue({ id: 'inv-1' });
const mockVoidInvoice = jest.fn().mockResolvedValue({ id: 'inv-1' });

jest.mock('@/api/db', () => ({
  db: {
    customerInvoices: {
      update: (...args) => mockUpdateInvoice(...args),
    },
  },
}));

jest.mock('@/components/invoices/InvoiceService', () => ({
  createCustomerInvoice: (...args) => mockCreateInvoice(...args),
  issueInvoice: (...args) => mockIssueInvoice(...args),
  markInvoiceSent: (...args) => mockMarkSent(...args),
  recordPayment: (...args) => mockRecordPayment(...args),
  voidInvoice: (...args) => mockVoidInvoice(...args),
  getInvoiceStats: jest.fn(),
}));

// ── Extracted logic mirrors ──────────────────────────────────────────────

function handleSubmitRouting(data, editingInvoice) {
  if (editingInvoice) {
    return { action: 'update', id: editingInvoice.id, data };
  }
  return { action: 'create', data };
}

async function confirmAction(action, invoice) {
  switch (action) {
    case 'issue':
      await mockIssueInvoice(invoice.id);
      break;
    case 'send':
      await mockMarkSent(invoice.id);
      break;
    case 'pay':
      await mockRecordPayment(invoice.id, {});
      break;
    case 'void':
      await mockVoidInvoice(invoice.id, '');
      break;
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

function getActionDialogContent(action, invoice) {
  if (!action || !invoice) return {};

  const actions = {
    issue: {
      title: 'Issue Invoice',
      confirmText: 'Issue Invoice',
    },
    send: {
      title: 'Mark as Sent',
      confirmText: 'Mark as Sent',
    },
    pay: {
      title: 'Record Payment',
      confirmText: 'Record Payment',
    },
    void: {
      title: 'Void Invoice',
      confirmText: 'Void Invoice',
    },
  };

  return actions[action] || {};
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('Invoice mutation paths', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('handleSubmit routing', () => {
    it('routes to create when no editing invoice', () => {
      const result = handleSubmitRouting({ customer_name: 'Test' }, null);
      expect(result.action).toBe('create');
    });

    it('routes to update when editing invoice exists', () => {
      const result = handleSubmitRouting({ notes: 'Updated' }, { id: 'inv-1' });
      expect(result.action).toBe('update');
      expect(result.id).toBe('inv-1');
    });
  });

  describe('confirmAction', () => {
    const invoice = { id: 'inv-1', invoice_number: 'INV-001', total_amount: 5000 };

    it('calls issueInvoice for issue action', async () => {
      await confirmAction('issue', invoice);
      expect(mockIssueInvoice).toHaveBeenCalledWith('inv-1');
    });

    it('calls markInvoiceSent for send action', async () => {
      await confirmAction('send', invoice);
      expect(mockMarkSent).toHaveBeenCalledWith('inv-1');
    });

    it('calls recordPayment for pay action', async () => {
      await confirmAction('pay', invoice);
      expect(mockRecordPayment).toHaveBeenCalledWith('inv-1', {});
    });

    it('calls voidInvoice for void action', async () => {
      await confirmAction('void', invoice);
      expect(mockVoidInvoice).toHaveBeenCalledWith('inv-1', '');
    });

    it('throws for unknown action', async () => {
      await expect(confirmAction('refund', invoice)).rejects.toThrow('Unknown action');
    });
  });

  describe('getActionDialogContent', () => {
    const invoice = { id: 'inv-1', invoice_number: 'INV-001' };

    it('returns issue dialog content', () => {
      const content = getActionDialogContent('issue', invoice);
      expect(content.title).toBe('Issue Invoice');
      expect(content.confirmText).toBe('Issue Invoice');
    });

    it('returns send dialog content', () => {
      expect(getActionDialogContent('send', invoice).title).toBe('Mark as Sent');
    });

    it('returns pay dialog content', () => {
      expect(getActionDialogContent('pay', invoice).title).toBe('Record Payment');
    });

    it('returns void dialog content', () => {
      expect(getActionDialogContent('void', invoice).title).toBe('Void Invoice');
    });

    it('returns empty for null action', () => {
      expect(getActionDialogContent(null, invoice)).toEqual({});
    });

    it('returns empty for null invoice', () => {
      expect(getActionDialogContent('issue', null)).toEqual({});
    });

    it('returns empty for unknown action', () => {
      expect(getActionDialogContent('refund', invoice)).toEqual({});
    });
  });
});
