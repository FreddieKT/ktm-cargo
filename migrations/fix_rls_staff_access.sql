-- ==============================================================================
-- FIX RLS STAFF ACCESS
--
-- Purpose:
--   Restore database access for all internal staff roles without weakening the
--   admin/director-only guard used by profile self-escalation triggers.
--
-- Notes:
--   - Keep public.is_admin_or_director() unchanged for privileged workflows.
--   - Use a separate helper for broader internal staff access in RLS policies.
--   - This migration is idempotent and safe to re-run.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1) Helper for broad internal staff access
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_internal_staff_access()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'director', 'staff', 'viewer')
        OR p.staff_role IN (
          'managing_director',
          'director',
          'finance_lead',
          'marketing_manager',
          'operations',
          'support',
          'viewer'
        )
      )
  );
$$;

-- ------------------------------------------------------------------------------
-- 2) Refresh RLS policies on internal operational tables
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'profiles',
    'customers',
    'shipments',
    'shopping_orders',
    'inventory_items',
    'vendors',
    'purchase_orders',
    'customer_invoices',
    'campaigns',
    'tasks',
    'expenses',
    'notifications',
    'vendor_orders',
    'vendor_payments',
    'service_pricing',
    'surcharges',
    'goods_receipts',
    'vendor_contracts',
    'approval_rules',
    'approval_history',
    'vendor_invitations',
    'vendor_payouts',
    'notification_templates',
    'order_journeys',
    'journey_events',
    'support_tickets',
    'proof_of_delivery',
    'feedback'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

      IF t = 'profiles' THEN
        EXECUTE 'DROP POLICY IF EXISTS "Staff Full Access Profiles" ON public.profiles';
        EXECUTE '
          CREATE POLICY "Staff Full Access Profiles" ON public.profiles
          FOR ALL
          TO authenticated
          USING (public.has_internal_staff_access())
        ';
      ELSE
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Staff Full Access ' || t, t);
        EXECUTE format(
          '
            CREATE POLICY %I ON public.%I
            FOR ALL
            TO authenticated
            USING (public.has_internal_staff_access())
          ',
          'Staff Full Access ' || t,
          t
        );
      END IF;
    END IF;
  END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 3) Company settings: read access for internal staff, no escalation of the
--    existing privileged helper used elsewhere.
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'company_settings'
  ) THEN
    EXECUTE 'ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can read company settings" ON public.company_settings';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage company settings" ON public.company_settings';
    EXECUTE 'DROP POLICY IF EXISTS "Internal staff can read company settings" ON public.company_settings';
    EXECUTE 'DROP POLICY IF EXISTS "Internal staff can manage company settings" ON public.company_settings';

    EXECUTE '
      CREATE POLICY "Internal staff can read company settings" ON public.company_settings
      FOR SELECT
      TO authenticated
      USING (public.has_internal_staff_access())
    ';

    EXECUTE '
      CREATE POLICY "Internal staff can manage company settings" ON public.company_settings
      FOR ALL
      TO authenticated
      USING (public.has_internal_staff_access())
    ';
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4) Audit logs: internal staff can read, system/service paths can keep writing.
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'audit_logs'
  ) THEN
    EXECUTE 'ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can read audit logs" ON public.audit_logs';
    EXECUTE 'DROP POLICY IF EXISTS "Internal staff can read audit logs" ON public.audit_logs';

    EXECUTE '
      CREATE POLICY "Internal staff can read audit logs" ON public.audit_logs
      FOR SELECT
      TO authenticated
      USING (public.has_internal_staff_access())
    ';
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- End state:
--   - All authenticated internal roles (admin, director, staff, viewer) can
--     access the operational database tables.
--   - Privileged admin/director checks used by role-escalation guards remain
--     unchanged.
--   - Audit logs and company settings are accessible to internal staff without
--     broadening the self-escalation trigger surface.
-- ------------------------------------------------------------------------------
