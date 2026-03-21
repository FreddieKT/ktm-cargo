import { useQuery } from '@tanstack/react-query';
import { db } from '@/api/db';
import { useUser } from '@/components/auth/UserContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, FileText, Truck } from 'lucide-react';
import VendorPortalDashboard from '@/components/portal/VendorPortalDashboard';
import VendorOrders from '@/components/portal/VendorOrders';
import VendorInvoices from '@/components/portal/VendorInvoices';

export default function VendorPortal() {
  const { user, loading } = useUser();

  const { data: vendors = [], isLoading: vendorLoading } = useQuery({
    queryKey: ['vendor-portal-vendor', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return db.vendors.filter({ auth_user_id: user.id }, '-created_date', 1);
    },
    enabled: !!user?.id,
  });

  const vendor = vendors[0] || null;

  if (loading || vendorLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="mx-auto max-w-4xl">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <Truck className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <h1 className="text-2xl font-bold text-slate-900">Vendor Portal</h1>
              <p className="mt-2 text-slate-500">
                We could not find a vendor profile for the current signed-in account.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-800 text-white">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <Badge className="bg-white/10 text-white hover:bg-white/10">Vendor Portal</Badge>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                    Welcome, {vendor.name}
                  </h1>
                  <p className="mt-2 max-w-2xl text-slate-200">
                    Review purchase orders, track payments, and download vendor invoices from one
                    place.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                  <Package className="mx-auto h-5 w-5 text-sky-200" />
                  <p className="mt-2 text-xl font-semibold">{vendor.status || 'active'}</p>
                  <p className="text-xs text-slate-300">Status</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                  <Truck className="mx-auto h-5 w-5 text-sky-200" />
                  <p className="mt-2 text-xl font-semibold">{vendor.payment_terms || 'net_30'}</p>
                  <p className="text-xs text-slate-300">Terms</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                  <FileText className="mx-auto h-5 w-5 text-sky-200" />
                  <p className="mt-2 text-xl font-semibold">Portal</p>
                  <p className="text-xs text-slate-300">Live data</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <VendorPortalDashboard vendor={vendor} />

        <div className="grid gap-6 xl:grid-cols-2">
          <VendorOrders vendor={vendor} />
          <VendorInvoices vendor={vendor} />
        </div>
      </div>
    </div>
  );
}
