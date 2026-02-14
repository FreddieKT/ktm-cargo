import {
  PROCUREMENT_INVOICE_QUERY_KEY,
  invalidateProcurementInvoiceQueries,
} from './procurementQueryKeys';

describe('procurement invoice query keys', () => {
  it('uses customer-invoices as canonical invoice query key', () => {
    expect(PROCUREMENT_INVOICE_QUERY_KEY).toEqual(['customer-invoices']);
  });

  it('invalidates canonical invoice key for procurement invoice updates', () => {
    const queryClient = { invalidateQueries: jest.fn() };

    invalidateProcurementInvoiceQueries(queryClient);

    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['customer-invoices'],
    });
    expect(queryClient.invalidateQueries).not.toHaveBeenCalledWith({
      queryKey: ['invoices'],
    });
  });
});
