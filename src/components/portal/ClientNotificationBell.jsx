import React, { useState } from 'react';
import { db } from '@/api/db';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Bell,
  Package,
  AlertTriangle,
  CheckCircle,
  Truck,
  CreditCard,
  MessageSquare,
  X,
} from 'lucide-react';
import { format } from 'date-fns';

const TYPE_ICONS = {
  shipment: Package,
  delivery: Truck,
  payment: CreditCard,
  alert: AlertTriangle,
  support: MessageSquare,
  system: Bell,
};

const PRIORITY_COLORS = {
  high: 'border-l-red-500 bg-red-50',
  medium: 'border-l-amber-500 bg-amber-50',
  low: 'border-l-blue-500 bg-blue-50',
};

export default function ClientNotificationBell({ user, clientData }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const email = clientData?.email || user?.email;

  const { data: notifications = [] } = useQuery({
    queryKey: ['client-notifications', email],
    queryFn: async () => {
      if (!email) return [];
      return db.notifications.filter(
        { recipient_email: email, status: 'unread' },
        '-created_date',
        20
      );
    },
    enabled: !!email,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => db.notifications.update(id, { status: 'read' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['customer-notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        notifications.map((n) => db.notifications.update(n.id, { status: 'read' }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['customer-notifications'] });
    },
  });

  const unreadCount = notifications.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-blue-600"
              onClick={() => markAllReadMutation.mutate()}
            >
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notif) => {
              const Icon = TYPE_ICONS[notif.type] || Bell;
              const priorityClass = PRIORITY_COLORS[notif.priority] || PRIORITY_COLORS.low;

              return (
                <div
                  key={notif.id}
                  className={`p-3 border-b border-l-4 hover:bg-slate-50 ${priorityClass}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{notif.title}</p>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{notif.message}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {notif.created_date &&
                          format(new Date(notif.created_date), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => markReadMutation.mutate(notif.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-slate-500">
              <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No new notifications</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
