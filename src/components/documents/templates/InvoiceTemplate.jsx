import { format } from 'date-fns';

/* ── KTM brand tokens ──────────────────────────────────────────────────── */
const GOLD_GRADIENT = 'linear-gradient(160deg, #F7E17A 0%, #D4A63A 48%, #9A6E10 100%)';
const GOLD_TEXT_STYLE = {
  background: GOLD_GRADIENT,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

function SpeedMark() {
  const bars = [
    { w: 18, h: 3.5 },
    { w: 14, h: 3.5 },
    { w: 10, h: 3.5 },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {bars.map((b, i) => (
        <span
          key={i}
          style={{
            display: 'block',
            width: b.w,
            height: b.h,
            borderRadius: 2,
            transform: 'skewX(-18deg)',
            background: GOLD_GRADIENT,
          }}
        />
      ))}
    </div>
  );
}

function KtmMark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <SpeedMark />
      <div>
        <div
          style={{
            fontFamily: "'Oswald', 'Bebas Neue', Impact, sans-serif",
            fontSize: 28,
            fontWeight: 700,
            fontStyle: 'italic',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            ...GOLD_TEXT_STYLE,
          }}
        >
          KTM
        </div>
        <div
          style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: 7.5,
            fontWeight: 500,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: '#9A7A30',
            marginTop: 2,
          }}
        >
          CARGO EXPRESS
        </div>
      </div>
    </div>
  );
}

export default function InvoiceTemplate({ data, settings }) {
  const { invoice, customer } = data;
  const companyName = settings?.company_name || 'KTM Cargo Express';
  const companyAddress = settings?.address || 'Bangkok, Thailand';
  const companyPhone = settings?.phone || '';
  const companyEmail = settings?.email || '';
  const logoUrl = settings?.logo_url;
  const bankName = settings?.bank_name || '';
  const bankAccount = settings?.bank_account || '';
  const bankAccountName = settings?.bank_account_name || '';

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (_e) {
      return dateString;
    }
  };

  return (
    <div className="max-w-[210mm] mx-auto bg-white text-slate-900 text-sm leading-relaxed">
      {/* Header */}
      <div
        className="flex justify-between items-start pb-8 mb-8"
        style={{ borderBottom: '2px solid #D4A63A' }}
      >
        <div className="flex gap-4 items-center">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-20 h-20 object-contain" />
          ) : (
            <KtmMark />
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{companyName}</h1>
            <p className="text-slate-500 max-w-xs text-xs mt-1">{companyAddress}</p>
            <div className="flex gap-3 text-xs text-slate-400 mt-1">
              {companyPhone && <span>{companyPhone}</span>}
              {companyEmail && <span>{companyEmail}</span>}
            </div>
          </div>
        </div>
        <div className="text-right">
          <h2
            className="text-4xl font-bold tracking-widest uppercase"
            style={{ color: 'rgba(212,166,58,0.18)' }}
          >
            Invoice
          </h2>
          <p className="text-lg font-bold text-slate-900 mt-1">{invoice.invoice_number}</p>
          <div className="mt-3 space-y-1 text-xs">
            <div className="flex justify-end gap-4">
              <span className="text-slate-400">Date:</span>
              <span className="font-medium">{formatDate(invoice.invoice_date)}</span>
            </div>
            <div className="flex justify-end gap-4">
              <span className="text-slate-400">Due Date:</span>
              <span className="font-medium">{formatDate(invoice.due_date)}</span>
            </div>
            <div className="flex justify-end gap-4">
              <span className="text-slate-400">Status:</span>
              <span
                className={`font-bold uppercase ${invoice.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}
              >
                {invoice.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bill To / Shipment Details */}
      <div className="flex justify-between mb-10">
        <div>
          <h3
            className="text-xs font-bold uppercase tracking-wider mb-2"
            style={{ color: '#9A7A30' }}
          >
            Bill To
          </h3>
          <p className="font-bold text-base">{invoice.customer_name}</p>
          <div className="text-slate-500 mt-1 space-y-0.5 text-xs">
            {invoice.customer_email && <p>{invoice.customer_email}</p>}
            {invoice.customer_phone && <p>{invoice.customer_phone}</p>}
            {customer?.address && <p className="max-w-xs">{customer.address}</p>}
          </div>
        </div>
        <div className="text-right">
          <h3
            className="text-xs font-bold uppercase tracking-wider mb-2"
            style={{ color: '#9A7A30' }}
          >
            Shipment Details
          </h3>
          <div className="space-y-1 text-slate-500 text-xs">
            {invoice.tracking_number && (
              <p>
                Tracking #:{' '}
                <span className="font-medium text-slate-900">{invoice.tracking_number}</span>
              </p>
            )}
            {invoice.order_number && (
              <p>
                Order #: <span className="font-medium text-slate-900">{invoice.order_number}</span>
              </p>
            )}
            <p>
              Service:{' '}
              <span className="font-medium text-slate-900 capitalize">
                {invoice.service_type?.replace(/_/g, ' ')}
              </span>
            </p>
            {invoice.weight_kg > 0 && (
              <p>
                Weight: <span className="font-medium text-slate-900">{invoice.weight_kg} kg</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Line items table */}
      <table className="w-full mb-8">
        <thead>
          <tr style={{ borderBottom: '2px solid #D4A63A' }}>
            <th className="text-left py-3 font-bold text-xs uppercase tracking-wider text-slate-700">
              Description
            </th>
            <th className="text-right py-3 font-bold text-xs uppercase tracking-wider w-32 text-slate-700">
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="text-slate-700">
          {invoice.product_cost > 0 && (
            <tr className="border-b border-slate-100">
              <td className="py-4">
                <p className="font-medium text-slate-900">Product Cost</p>
                <p className="text-xs text-slate-400">Cost of goods purchased</p>
              </td>
              <td className="py-4 text-right">฿{invoice.product_cost.toLocaleString()}</td>
            </tr>
          )}
          {invoice.shipping_amount > 0 && (
            <tr className="border-b border-slate-100">
              <td className="py-4">
                <p className="font-medium text-slate-900">Shipping Charges</p>
                {invoice.weight_kg > 0 && invoice.price_per_kg > 0 && (
                  <p className="text-xs text-slate-400">
                    {invoice.weight_kg} kg × ฿{invoice.price_per_kg}/kg
                  </p>
                )}
              </td>
              <td className="py-4 text-right">฿{invoice.shipping_amount.toLocaleString()}</td>
            </tr>
          )}
          {invoice.commission_amount > 0 && (
            <tr className="border-b border-slate-100">
              <td className="py-4">
                <p className="font-medium text-slate-900">Service Commission</p>
              </td>
              <td className="py-4 text-right">฿{invoice.commission_amount.toLocaleString()}</td>
            </tr>
          )}
          {invoice.insurance_amount > 0 && (
            <tr className="border-b border-slate-100">
              <td className="py-4">
                <p className="font-medium text-slate-900">Insurance</p>
                <p className="text-xs text-slate-400">Shipping insurance coverage</p>
              </td>
              <td className="py-4 text-right">฿{invoice.insurance_amount.toLocaleString()}</td>
            </tr>
          )}
          {invoice.packaging_fee > 0 && (
            <tr className="border-b border-slate-100">
              <td className="py-4">
                <p className="font-medium text-slate-900">Packaging Fee</p>
              </td>
              <td className="py-4 text-right">฿{invoice.packaging_fee.toLocaleString()}</td>
            </tr>
          )}
          {invoice.tax_amount > 0 && (
            <tr className="border-b border-slate-100">
              <td className="py-4">
                <p className="font-medium text-slate-900">
                  Tax / VAT{invoice.tax_rate > 0 ? ` (${invoice.tax_rate}%)` : ''}
                </p>
              </td>
              <td className="py-4 text-right">฿{invoice.tax_amount.toLocaleString()}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-12">
        <div className="w-64 space-y-3">
          {invoice.subtotal > 0 && invoice.subtotal !== invoice.total_amount && (
            <div className="flex justify-between text-slate-500 text-xs border-b border-slate-100 pb-2">
              <span>Subtotal</span>
              <span>฿{invoice.subtotal.toLocaleString()}</span>
            </div>
          )}
          {invoice.discount_amount > 0 && (
            <div className="flex justify-between text-slate-500 text-xs border-b border-slate-100 pb-2">
              <span>Discount</span>
              <span className="text-emerald-600">-฿{invoice.discount_amount.toLocaleString()}</span>
            </div>
          )}
          <div
            className="flex justify-between items-center pt-2 pb-3 px-4 rounded-lg"
            style={{
              background: 'rgba(212,166,58,0.06)',
              border: '1px solid rgba(212,166,58,0.2)',
            }}
          >
            <span className="font-bold text-base">Total</span>
            <span className="font-bold text-2xl" style={GOLD_TEXT_STYLE}>
              ฿{(invoice.total_amount || 0).toLocaleString()}
            </span>
          </div>
          {invoice.amount_paid > 0 && invoice.status !== 'paid' && (
            <div className="flex justify-between text-xs text-slate-500 pt-1">
              <span>Amount Paid</span>
              <span className="text-emerald-600">฿{invoice.amount_paid.toLocaleString()}</span>
            </div>
          )}
          {invoice.balance_due > 0 && invoice.status !== 'paid' && (
            <div className="flex justify-between text-xs font-bold text-slate-700 border-t border-slate-200 pt-2">
              <span>Balance Due</span>
              <span>฿{invoice.balance_due.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment Info & Notes */}
      <div
        className="grid grid-cols-2 gap-8 pt-8"
        style={{ borderTop: '1px solid rgba(212,166,58,0.25)' }}
      >
        <div>
          <h4
            className="font-bold text-xs uppercase tracking-wider mb-2"
            style={{ color: '#9A7A30' }}
          >
            Payment Info
          </h4>
          {bankName || bankAccount ? (
            <>
              {bankName && <p className="text-sm font-medium">{bankName}</p>}
              {bankAccount && <p className="text-sm text-slate-600 mt-0.5">{bankAccount}</p>}
              {bankAccountName && (
                <p className="text-xs text-slate-400 mt-0.5">{bankAccountName}</p>
              )}
            </>
          ) : (
            <p className="text-sm font-medium">Bank Transfer / PromptPay</p>
          )}
          <p className="text-xs text-slate-400 mt-2">
            Please include invoice number in transfer details.
          </p>
        </div>
        {invoice.notes && (
          <div>
            <h4
              className="font-bold text-xs uppercase tracking-wider mb-2"
              style={{ color: '#9A7A30' }}
            >
              Notes
            </h4>
            <p className="text-xs text-slate-500 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-xs" style={{ color: 'rgba(212,166,58,0.5)' }}>
        <p>Thank you for your business!</p>
        <p className="mt-1">
          {companyName} • {companyAddress}
        </p>
      </div>
    </div>
  );
}
