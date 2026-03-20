import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Star, ThumbsUp, AlertTriangle, ArrowRight } from 'lucide-react';
import { db } from '@/api/db';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const STATUS_CONFIG = {
  pending: { label: 'Pending Request', className: 'bg-amber-100 text-amber-800' },
  submitted: { label: 'Submitted', className: 'bg-emerald-100 text-emerald-800' },
  reviewed: { label: 'Reviewed', className: 'bg-blue-100 text-blue-800' },
};

function getReferenceLabel(item) {
  if (item.shipment_id) return `Shipment ${item.shipment_id}`;
  if (item.journey_id) return `Journey ${item.journey_id}`;
  if (item.shopping_order_id || item.order_reference_id) {
    return `Order ${item.shopping_order_id || item.order_reference_id}`;
  }
  return 'Manual feedback record';
}

export default function FeedbackQueue() {
  const { data: feedback = [] } = useQuery({
    queryKey: ['feedback'],
    queryFn: () => db.feedback.list('-created_date', 100),
  });

  const queue = useMemo(
    () =>
      feedback.filter((item) =>
        ['pending', 'submitted', 'reviewed'].includes((item.status || '').toLowerCase())
      ),
    [feedback]
  );

  const stats = useMemo(() => {
    const submitted = queue.filter((item) => item.status === 'submitted');
    const pending = queue.filter((item) => item.status === 'pending');
    const lowRatings = submitted.filter((item) => Number(item.rating || 0) <= 2);
    const recommendRate = submitted.length
      ? Math.round(
          (submitted.filter((item) => item.would_recommend).length / submitted.length) * 100
        )
      : 0;

    return {
      total: queue.length,
      pending: pending.length,
      submitted: submitted.length,
      lowRatings: lowRatings.length,
      recommendRate,
    };
  }, [queue]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              After-sales
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">Feedback Queue</h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              Staff-facing queue for delivery feedback follow-up. Public customer submission stays
              on the emailed <code>/Feedback</code> link.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to={createPageUrl('FeedbackAnalytics')}>
              <Button variant="outline">
                Analytics
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-100 p-3">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Queue Items</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-100 p-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Pending Request</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-rose-100 p-3">
                  <Star className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Low Ratings</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.lowRatings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-100 p-3">
                  <ThumbsUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Recommend Rate</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.recommendRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Feedback Activity</CardTitle>
            <CardDescription>
              Submitted reviews and pending feedback requests tied to shipments or journeys.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {queue.length === 0 ? (
              <div className="py-12 text-center">
                <MessageSquare className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                <p className="font-medium text-slate-900">No feedback items yet</p>
                <p className="mt-1 text-sm text-slate-500">
                  Delivered shipments will appear here when feedback requests are sent or submitted.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {queue.map((item) => {
                  const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.submitted;
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-900">
                              {item.customer_name || 'Customer'}
                            </p>
                            <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
                            {item.feedback_kind && (
                              <Badge variant="outline" className="capitalize">
                                {item.feedback_kind.replace('_', ' ')}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-500">{getReferenceLabel(item)}</p>
                          {item.comment && (
                            <p className="text-sm leading-6 text-slate-700">{item.comment}</p>
                          )}
                        </div>
                        <div className="text-sm text-slate-500 md:text-right">
                          <p>
                            {item.created_date
                              ? formatDistanceToNow(new Date(item.created_date), {
                                  addSuffix: true,
                                })
                              : 'Recently updated'}
                          </p>
                          <p className="mt-1 font-medium text-slate-900">
                            Rating: {item.rating || '-'} / 5
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
