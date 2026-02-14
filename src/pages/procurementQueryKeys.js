export const PROCUREMENT_INVOICE_QUERY_KEY = ['customer-invoices'];

export function invalidateProcurementInvoiceQueries(queryClient) {
  return queryClient.invalidateQueries({ queryKey: PROCUREMENT_INVOICE_QUERY_KEY });
}
