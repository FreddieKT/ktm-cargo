# CRUD Operations & Client Portal Fixes

**Date:** December 6, 2025  
**Audit Report:** CRUD_CLIENT_PORTAL_AUDIT_REPORT.md

---

## Executive Summary

The force audit identified **88 issues** across CRUD operations, Client Portal integration, and code logic:

- **Critical:** 1 (Campaign CREATE failure)
- **High:** 14 (Missing validation, empty catch blocks)
- **Medium:** 73 (Mock code, hardcoded values, logic issues)

**Status:** ⚠️ **CRUD operations partially working** - Customers ✅, Shipments ⚠️, Campaigns ❌, Settings ⚠️

---

## ✅ Working CRUD Operations

### Customers
- ✅ **CREATE:** Working
- ✅ **READ:** Working
- ✅ **UPDATE:** Working
- ✅ **DELETE:** Working

**Status:** Fully functional

---

## ❌ CRUD Operation Failures

### 1. Shipments - UPDATE Issue

**Problem:**
```
UPDATE failed: Could not find the 'notes' column of 'shipments' in the schema cache
```

**Root Cause:**
- The audit script tried to update a `notes` column
- The schema shows `notes` exists in `shipmentSchema` (line 46 of schemas.js)
- Database schema may not have this column, OR it's named differently

**Fix Required:**
1. Check actual database schema for `shipments` table
2. If column doesn't exist, either:
   - Add migration to add `notes` column
   - OR update code to use correct column name (e.g., `items_description` for notes)

**Impact:** Medium - Updates to shipments may fail if trying to update notes field

**Recommendation:**
```sql
-- Check if notes column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'shipments' AND column_name = 'notes';

-- If missing, add it:
ALTER TABLE shipments ADD COLUMN notes TEXT;
```

---

### 2. Campaigns - CREATE Failure (CRITICAL)

**Problem:**
```
CREATE failed: Could not find the 'campaign_type' column of 'campaigns' in the schema cache
```

**Root Cause:**
- Code uses `campaign_type` field (seen in CustomerSegments.jsx line 645)
- Database schema doesn't have this column
- No campaign schema defined in schemas.js

**Fix Required:**
1. **IMMEDIATE:** Check actual `campaigns` table schema
2. Add campaign schema to `src/lib/schemas.js`
3. Either:
   - Add `campaign_type` column to database
   - OR update code to use existing column name

**Impact:** CRITICAL - Cannot create campaigns from frontend

**Database Migration Needed:**
```sql
-- Check current campaigns table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'campaigns'
ORDER BY ordinal_position;

-- If campaign_type doesn't exist, add it:
ALTER TABLE campaigns ADD COLUMN campaign_type VARCHAR(50);
-- OR if it's named differently, update code to match
```

**Code Fix:**
```javascript
// Add to src/lib/schemas.js
export const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  campaign_type: z.enum(['email', 'sms', 'line', 'push']).optional(),
  status: z.enum(['draft', 'active', 'completed', 'cancelled']).default('draft'),
  target_segment: z.string().optional(),
  message: z.string().optional(),
  // ... other fields
});
```

---

### 3. Settings - UPDATE Issue

**Problem:**
```
UPDATE failed: Could not find the 'updated_date' column of 'company_settings' in the schema cache
```

**Root Cause:**
- Code tries to update `updated_date` field
- Database may use `updated_at` or `created_date` instead
- Or column doesn't exist

**Fix Required:**
1. Check actual `company_settings` table schema
2. Use correct timestamp column name
3. Add column if missing

**Impact:** Low-Medium - Settings updates may not track modification time

**Fix:**
```sql
-- Check timestamp columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'company_settings' 
AND column_name LIKE '%date%' OR column_name LIKE '%at%';

-- Use correct column name or add if missing
```

---

## 🔍 Client Portal Issues

### Customer Portal
1. **Missing error handling** in `CustomerShipmentTracker.jsx`
   - **Fix:** Add try-catch blocks around async operations
   - **Severity:** Medium

### Vendor Portal
- ✅ No issues found

### Authentication
- ✅ No issues found

---

## 🚨 High Priority Logic Issues

### Missing Validation (14 files)

**Files requiring validation:**
1. `src/components/audit/AuditService.jsx`
2. `src/components/feedback/FeedbackRequestService.jsx`
3. `src/components/invoices/InvoiceGenerationService.jsx`
4. `src/components/notifications/NotificationService.jsx`
5. `src/components/notifications/ShippingNotificationService.jsx`
6. `src/components/procurement/ApprovalWorkflowService.jsx`
7. `src/components/procurement/InvoiceService.jsx`
8. `src/components/procurement/VendorOnboarding.jsx`
9. `src/components/segments/CampaignLauncher.jsx`
10. `src/components/shopping/ShoppingInvoiceService.jsx`
11. `src/components/vendors/VendorPaymentService.jsx`
12. `src/pages/ClientPortal.jsx`
13. `src/pages/Feedback.jsx`

**Fix Pattern:**
```javascript
// Before
const created = await db.customers.create(data);

// After
import { customerSchema } from '@/lib/schemas';
const validatedData = customerSchema.parse(data);
const created = await db.customers.create(validatedData);
```

---

## 🔧 Medium Priority Issues

### Mock/Test Code (61 files found)

**Action Required:**
1. Review each file with mock/test code
2. Remove or properly gate behind environment checks
3. Replace with real implementations

**High Priority Mock Code:**
- `src/api/integrations.js` - Mock image generation (already documented)
- `src/api/integrations/messenger.js` - Check for mock messaging

**Pattern for Gating:**
```javascript
// Good pattern
if (import.meta.env.PROD) {
  console.warn('Mock implementation used in production');
}
// Use real service
```

### Hardcoded Company Names (8 files)

**Files:**
- Document templates (5 files)
- NotificationService.jsx
- CustomerOnboarding.jsx
- StaffManagement.jsx
- Customers.jsx

**Fix Pattern:**
```javascript
// Before
const companyName = 'BKK-YGN Cargo';

// After
const { data: settings } = useQuery({
  queryKey: ['company-settings'],
  queryFn: () => db.companySettings.list().then(list => list[0]),
});
const companyName = settings?.company_name || 'BKK-YGN Cargo';
```

---

## 📋 Action Plan

### Phase 1: Critical Fixes (Immediate)

1. **Fix Campaign CREATE** ⚠️ CRITICAL
   - [ ] Check campaigns table schema
   - [ ] Add campaign schema to schemas.js
   - [ ] Add missing columns or fix column names
   - [ ] Test campaign creation

2. **Fix Shipment UPDATE**
   - [ ] Check shipments table for `notes` column
   - [ ] Add column if missing OR fix code to use correct field

3. **Fix Settings UPDATE**
   - [ ] Check company_settings timestamp columns
   - [ ] Use correct column name

**Estimated Time:** 2-4 hours

### Phase 2: High Priority (This Week)

4. **Add Validation to All Create Operations**
   - [ ] Create schemas for missing entities
   - [ ] Add validation to 14 files identified
   - [ ] Test each create operation

5. **Fix Empty Catch Blocks**
   - [ ] Find all empty catch blocks
   - [ ] Add proper error handling/logging

**Estimated Time:** 1-2 days

### Phase 3: Medium Priority (Next Sprint)

6. **Remove/Gate Mock Code**
   - [ ] Review 61 files with mock code
   - [ ] Remove or gate appropriately
   - [ ] Replace with real implementations

7. **Fix Hardcoded Values**
   - [ ] Replace hardcoded company names (8 files)
   - [ ] Use companySettings from database

**Estimated Time:** 2-3 days

### Phase 4: Code Quality (Ongoing)

8. **Improve Error Handling**
   - [ ] Add error handling to Client Portal components
   - [ ] Standardize error messages
   - [ ] Add user-friendly error displays

9. **Use DB Abstraction**
   - [ ] Replace direct Supabase calls with db abstraction
   - [ ] Ensure consistent error handling

**Estimated Time:** Ongoing

---

## 🧪 Testing Checklist

After fixes, test:

- [ ] Customer CRUD (all operations)
- [ ] Shipment CRUD (especially UPDATE with notes)
- [ ] Campaign CRUD (CREATE is critical)
- [ ] Settings READ/UPDATE
- [ ] Client Portal login/authentication
- [ ] Customer Portal features
- [ ] Vendor Portal features
- [ ] All create operations with validation
- [ ] Error handling in async operations

---

## 📊 Database Schema Verification

**Required SQL Queries:**

```sql
-- 1. Check shipments table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'shipments'
ORDER BY ordinal_position;

-- 2. Check campaigns table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'campaigns'
ORDER BY ordinal_position;

-- 3. Check company_settings table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'company_settings'
ORDER BY ordinal_position;
```

**Run these queries in Supabase SQL Editor and update the fixes accordingly.**

---

## 🎯 Success Criteria

- ✅ All CRUD operations working (Customers, Shipments, Campaigns, Settings)
- ✅ All create operations have validation
- ✅ No mock code in production
- ✅ Client Portal fully functional
- ✅ Proper error handling throughout
- ✅ Real-world ready (no test/mock logic)

---

**Last Updated:** December 6, 2025  
**Next Review:** After Phase 1 fixes

