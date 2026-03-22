# P0 Critical Bug Fixes — Design Spec

**Date:** 2026-03-22
**Scope:** Fix all 4 P0 data-integrity bugs in a single PR
**Approach:** Database-level fixes only — frontend dead code removed; error handling updated where DB changes surface new errors to the UI
**Verification:** Manual testing after each fix
**Migration convention:** Applied manually via Supabase SQL Editor in order; no down migrations used in this project
**Environments:** Apply migrations dev → staging → production. Verify in each environment before proceeding to the next.

---

## Problem Summary

Four P0 bugs put production data integrity at risk:

1. Duplicate invoice numbers via in-memory fallback function still present in code
2. Concurrent invoice creation with no DB-level unique constraint enforced
3. Payment recording race condition corrupting balance_due (read-then-write, no lock)
4. Non-atomic PO rebalance — **already fixed** (verify and document only)

---

## Fix 1: Invoice Number Deduplication

**Files:** `src/components/invoices/InvoiceService.js:36,74-106`

**Root cause:** `generateInvoiceNumberFallback()` (lines 99–106) and its `invoiceSequenceFallback` counter (line 36) still exist in the codebase. The fallback is reachable when `getNextInvoiceNumber({ allowFallback: true })` is called. If called, it resets on page reload and produces duplicate `INV-YYYYMM-XXXX` numbers.

**Current state:** The production call at line 137 correctly uses `{ allowFallback: false }` and already throws on RPC failure. The fallback is dead code in normal production flow but is a latent risk.

**Fix:**
1. Verify migration #17 (`add_invoice_number_sequence.sql`) is applied: Supabase Dashboard → Database → Functions → confirm `next_invoice_number` exists. If missing, apply the migration first.
2. Delete `generateInvoiceNumberFallback()` function (lines 99–106) entirely.
3. Delete `invoiceSequenceFallback` variable declaration at line 36.
4. Delete the fallback path in `getNextInvoiceNumber` (lines 74–90 — the `// Fallback path` block that calls `generateInvoiceNumberFallback()`).
5. The `allowFallback` parameter in `getNextInvoiceNumber` now has no effect — simplify: remove the `allowFallback` option entirely since the only correct behavior is hard-fail.
6. Check whether `generateInvoiceNumber()` (line 108, marked deprecated) calls `generateInvoiceNumberFallback()`. If so, delete it. If callers exist, update them to use `getNextInvoiceNumber()`.
7. Update the test file: in `src/__tests__/InvoiceService.test.js`, remove `generateInvoiceNumberFallback` from the import (line 51) and delete the three test cases for it (lines 74–93). These tests cover deleted functionality and will cause an import error if left in place.

**Post-fix behavior:** `getNextInvoiceNumber()` calls `supabase.rpc('next_invoice_number')`. If the RPC fails for any reason, it throws — invoice creation is blocked. No local counter fallback exists under any condition.

**Verification (dev environment only):**
- Create two invoices within 1 second from two browser tabs. Confirm different `INV-YYYYMM-XXXX` numbers.
- Temporarily rename `next_invoice_number` in Supabase Dashboard. Attempt invoice creation. Confirm the error throws and no partial invoice row is created. Restore the function name immediately after.

---

## Fix 2: Concurrent Invoice Creation

**File:** `src/components/invoices/InvoiceService.js:199-206`

**Root cause:** "invoice exists?" check and INSERT are two separate operations. Concurrent calls can both pass the check and both insert.

**Context:** Migration `add_unique_invoice_constraints.sql` already adds:
- `UNIQUE(shipment_id)` constraint `unique_invoice_per_shipment` on `customer_invoices`
- `UNIQUE(order_id)` constraint `unique_invoice_per_order` on `customer_invoices`

These constraints prevent duplicate invoices at the DB level. **Verify this migration is applied before treating Fix 2 as unresolved.**

**Note:** `add_unique_invoice_constraints.sql` exists in the `migrations/` folder but is not listed in `migrations/README.md`. As part of Fix 2, add it to README.md as entry #23a (or between #22 and #23) so fresh environment setups apply it correctly.

**Fix:**
1. Verify constraints applied: Supabase Dashboard → Tables → `customer_invoices` → Constraints → confirm `unique_invoice_per_shipment` and `unique_invoice_per_order` exist. If missing, apply `add_unique_invoice_constraints.sql`.
2. Add `add_unique_invoice_constraints.sql` to `migrations/README.md` — insert it between the current Phase 4 entry #22 and Phase 5 entry #23, renumbering Phase 5 entries from #23 to #24 and #24 to #25 accordingly. The new record_payment_atomic RPC migration (Fix 3) becomes #25.
3. In `InvoiceService.js`, wrap the invoice INSERT call (around line 199–206) in a try/catch. If the caught error has Postgres code `23505`, throw: `"An invoice already exists for this shipment."` Do not surface the raw Postgres error to the UI.
2. In `InvoiceService.js`, wrap the invoice INSERT call (around line 199–206) in a try/catch. If the caught error has Postgres code `23505`, throw: `"An invoice already exists for this shipment."` Do not surface the raw Postgres error to the UI.

**Verification:**
- Create an invoice for a shipment.
- Attempt to create a second invoice for the same shipment.
- Confirm a clear, readable error message appears — not a raw Postgres error string.
- Confirm only one invoice row exists in the DB for that shipment.

---

## Fix 3: Payment Recording Race Condition

**File:** `src/components/invoices/InvoiceService.js:330-395`

**Root cause:** `recordPayment()` reads `currentInvoice` (line 331), computes new balances client-side, then writes via `db.customerInvoices.update()` (line 382). There is no row lock between read and write. A concurrent payment call can read the same stale balance and both writes commit, resulting in an incorrect `balance_due`.

The post-write check at line 391 (`if (invoice.amount_paid !== newAmountPaid)`) is ineffective — it compares a value just written to what was just written, so it always matches.

**Fix:**
1. New migration: `add_record_payment_atomic_rpc.sql` — add as entry **#24** in `migrations/README.md` Phase 5 (after `add_subscription_fields.sql` which is #23).

**RPC contract:**
```sql
record_payment_atomic(
  p_invoice_id        uuid,
  p_amount            numeric,      -- must be > 0; reject 0 or negative
  p_payment_date      date,         -- date string (yyyy-MM-dd); use current date if null
  p_payment_method    text,         -- e.g. 'bank_transfer'; nullable
  p_payment_reference text          -- nullable
)
RETURNS json
-- Success: { "success": true, "status": "paid"|"partially_paid", "amount_paid": <numeric>, "balance_due": <numeric> }
-- Failure: { "success": false, "error": "Invoice not found" | "Invoice already paid" | "Invoice is void" | "Payment amount exceeds balance" | "Invalid amount" }
```
- Uses `SELECT ... FOR UPDATE` to lock the invoice row before any read or write.
- Computes `newAmountPaid = amount_paid + p_amount`, `newBalanceDue = MAX(0, total_amount - newAmountPaid)`.
- Sets `status = 'paid'` if `newBalanceDue <= 0.01`, otherwise `'partially_paid'`.
- Updates `amount_paid`, `balance_due`, `status`, `payment_date`, `payment_method`, `payment_reference` in a single UPDATE.
- Rejects if invoice `status` is not in `('issued', 'sent', 'partially_paid')`.

2. In `InvoiceService.js`, replace `recordPayment()` (lines 330–395) with:
```js
export async function recordPayment(invoiceId, paymentDetails = {}) {
  const { data, error } = await supabase.rpc('record_payment_atomic', {
    p_invoice_id:        invoiceId,
    p_amount:            Number(paymentDetails.amount),
    p_payment_date:      paymentDetails.payment_date ?? format(new Date(), 'yyyy-MM-dd'),
    p_payment_method:    paymentDetails.payment_method ?? 'bank_transfer',
    p_payment_reference: paymentDetails.reference ?? null,  // note: field is `reference` not `payment_reference`
  });
  if (error || !data?.success) {
    throw new Error(data?.error ?? error?.message ?? 'Payment failed');
  }
  return data; // { status, amount_paid, balance_due }
}
```
3. Callers that use `invoice.status`, `invoice.amount_paid`, or `invoice.balance_due` from the `recordPayment` return value must use `data.status`, `data.amount_paid`, `data.balance_due` respectively. Audit all call sites of `recordPayment()` and update as needed.

**Verification:**
- Record a payment on an invoice. Confirm `balance_due` decreases and `status` updates correctly.
- Open two browser tabs with the same invoice payment dialog. Submit payment in both tabs within 1 second. Confirm `balance_due` reflects exactly two deductions — not one.
- Concurrent scripted test (run from browser console in dev):
```js
await Promise.all([
  supabase.rpc('record_payment_atomic', { p_invoice_id: '<id>', p_amount: 100, p_payment_date: '2026-03-22', p_payment_method: 'bank_transfer', p_payment_reference: null }),
  supabase.rpc('record_payment_atomic', { p_invoice_id: '<id>', p_amount: 100, p_payment_date: '2026-03-22', p_payment_method: 'bank_transfer', p_payment_reference: null }),
]);
```
Confirm final `balance_due` is exactly 200 less than original.

---

## Fix 4: Non-Atomic PO Rebalance — Already Fixed (Verify Only)

**File:** `src/lib/poAllocation.js:108-111`

**Status: Already resolved.** Code audit confirms:
- `Shipments.jsx:160` → `createShipmentWithPoRebalance()` (atomic RPC)
- `Shipments.jsx:183` → `updateShipmentWithPoRebalance()` (atomic RPC)
- `Shipments.jsx:202` → `deleteShipmentWithPoRebalance()` (atomic RPC)

`applyPORebalanceOperations` (the sequential client-side function) is only referenced in `poAllocation.test.js` — not in any production page.

**Required action:**
1. Verify migration #22 (`add_shipment_po_allocation_rpcs.sql`) is applied: Supabase Dashboard → Database → Functions → confirm `create_shipment_with_po_rebalance`, `update_shipment_with_po_rebalance`, `delete_shipment_with_po_rebalance` exist.
2. Confirm no production caller of `applyPORebalanceOperations`:
   ```
   grep -rn "applyPORebalanceOperations" src/ --include="*.jsx" --include="*.js"
   ```
   Expected: only `poAllocation.js` definition and `poAllocation.test.js`.
3. Document result: Fix 4 confirmed resolved — no code change needed.

**Verification:**
- Create a shipment assigned to a PO. Confirm PO `allocated_weight` increases.
- Update shipment weight. Confirm PO `allocated_weight` updates.
- Delete shipment. Confirm PO `allocated_weight` restores.

---

## Migration Additions

Two migrations to add to README:

| # | File | Purpose |
|---|---|---|
| 23 (new) | `add_unique_invoice_constraints.sql` | Existing file — add to README between #22 and #23 |
| 25 | `add_record_payment_atomic_rpc.sql` | New — atomic payment RPC with FOR UPDATE lock |

Migration #23 (`add_subscription_fields.sql`) and #24 (`add_record_payment_atomic_rpc.sql`) shift to #24 and #25 respectively. Update `migrations/README.md` accordingly.

---

## Files Touched

| File | Change |
|---|---|
| `migrations/add_record_payment_atomic_rpc.sql` | New — Fix 3 atomic payment RPC |
| `migrations/README.md` | Add Fix 2 entry (add_unique_invoice_constraints.sql); add Fix 3 entry #25 |
| `src/components/invoices/InvoiceService.js` | Fix 1: delete fallback function and counter; Fix 2: catch error 23505; Fix 3: replace recordPayment with RPC call |

---

## Rollback Plan

| Fix | DB rollback | Code rollback | Risk note |
|---|---|---|---|
| Fix 1 | None — `next_invoice_number` RPC pre-existed | Revert deleted code from git | **Warning:** Restoring the fallback reinstates the P0 bug. Do this only if invoice creation is completely broken; re-apply Fix 1 immediately after. |
| Fix 2 | None — constraint was pre-existing | Revert error catch in `InvoiceService.js` | Constraint stays in DB; UI shows raw error again |
| Fix 3 | `DROP FUNCTION IF EXISTS record_payment_atomic;` | Revert `recordPayment()` to previous read-write block | |
| Fix 4 | N/A — no changes made | N/A | |

---

## Out of Scope

- CI/CD pipeline improvements
- Missing business logic (status transitions, inventory, refund flow)
- P1 issues (float comparison, null guards, generic error toast)
- Gap-free invoice numbering
- Multi-invoice-type constraint per shipment
