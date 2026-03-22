# P0 Critical Bug Fixes — Design Spec

**Date:** 2026-03-22
**Scope:** Fix all 4 P0 data-integrity bugs in a single PR
**Approach:** Database-level fixes only (Approach A) — frontend code unchanged
**Verification:** Manual testing after each fix

---

## Problem Summary

Four P0 bugs put production data integrity at risk:

1. Duplicate invoice numbers via in-memory counter reset
2. Concurrent invoice creation bypassing existence check
3. Payment recording race condition corrupting balance_due
4. Non-atomic PO rebalance leaving data in partial state

All fixes are applied at the database layer (migrations + RPCs) to minimise regression risk.

---

## Fix 1: Invoice Number Deduplication

**File:** `src/components/invoices/InvoiceService.js:36,137`
**Root cause:** In-memory fallback counter resets on page reload. Two open tabs can generate the same `INV-YYYYMM-XXXX`.

**Fix:**
- Verify `add_invoice_number_sequence.sql` migration is applied in Supabase
- Remove in-memory fallback counter from `InvoiceService.js`
- Invoice number generation reads from DB sequence only

**Verification:**
- Open two browser tabs simultaneously
- Create an invoice from each tab at the same time
- Confirm both invoices have different invoice numbers

---

## Fix 2: Concurrent Invoice Creation

**File:** `src/components/invoices/InvoiceService.js:199-206`
**Root cause:** "invoice exists?" check and create are two separate operations. Two concurrent calls can both pass the check and both insert.

**Fix:**
- New migration: `add_unique_invoice_constraint.sql`
- Add `UNIQUE(shipment_id, invoice_type)` constraint on `customer_invoices` table
- DB rejects the second insert automatically

**Verification:**
- Attempt to create two invoices for the same shipment with the same type
- Confirm only one succeeds; second returns a unique constraint error

---

## Fix 3: Payment Recording Race Condition

**File:** `src/components/invoices/InvoiceService.js:308-368`
**Root cause:** `recordPayment()` uses read-then-write with no lock. Concurrent payment + refund can both read the same balance and write conflicting updates.

**Fix:**
- New Supabase RPC: `record_payment_atomic`
- RPC uses `SELECT ... FOR UPDATE` to lock the invoice row before updating
- `InvoiceService.js` replaces direct DB call with `supabase.rpc('record_payment_atomic', ...)`

**Verification:**
- Record a payment on an invoice
- Confirm balance_due updates correctly
- Confirm no negative balance or double-deduction on rapid successive payments

---

## Fix 4: Non-Atomic PO Rebalance

**File:** `src/lib/poAllocation.js:106-110`
**Root cause:** Client-side sequential mutations — if update #2 fails after update #1 succeeds, data is left in a partial corrupt state with no rollback.

**Fix:**
- Remove direct sequential DB calls from `poAllocation.js`
- Route all shipment mutations through the existing atomic RPC in `src/api/shipmentAllocationRpc.js`
- RPC wraps all operations in a single DB transaction (all-or-nothing)

**Verification:**
- Create or update a shipment that triggers PO rebalance
- Confirm PO allocation totals remain consistent after the operation
- Confirm no partial state if the operation is interrupted

---

## Files Touched

| File | Change |
|---|---|
| `migrations/add_unique_invoice_constraint.sql` | New — UNIQUE constraint |
| `migrations/add_record_payment_atomic_rpc.sql` | New — atomic payment RPC |
| `src/components/invoices/InvoiceService.js` | Remove in-memory counter; replace recordPayment with RPC call |
| `src/lib/poAllocation.js` | Remove sequential calls; route through atomic RPC |

---

## Out of Scope

- CI/CD pipeline improvements
- Missing business logic (status transitions, inventory, refund flow)
- P1 issues (float comparison, null guards, error handling)
