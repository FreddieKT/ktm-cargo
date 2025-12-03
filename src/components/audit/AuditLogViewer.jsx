import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  History, Search, FileText, User, Shield, Receipt, 
  Package, CheckCircle, XCircle, AlertTriangle, Settings
} from 'lucide-react';
import { format } from 'date-fns';

const ACTION_CONFIG = {
  po_created: { label: 'PO Created', icon: FileText, color: 'bg-blue-100 text-blue-800' },
  po_approved: { label: 'PO Approved', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-800' },
  po_rejected: { label: 'PO Rejected', icon: XCircle, color: 'bg-rose-100 text-rose-800' },
  po_cancelled: { label: 'PO Cancelled', icon: XCircle, color: 'bg-slate-100 text-slate-800' },
  po_submitted: { label: 'PO Submitted', icon: FileText, color: 'bg-amber-100 text-amber-800' },
  invoice_created: { label: 'Invoice Created', icon: Receipt, color: 'bg-blue-100 text-blue-800' },
  invoice_paid: { label: 'Invoice Paid', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-800' },
  goods_received: { label: 'Goods Received', icon: Package, color: 'bg-purple-100 text-purple-800' },
  user_role_changed: { label: 'Role Changed', icon: User, color: 'bg-amber-100 text-amber-800' },
  user_invited: { label: 'User Invited', icon: User, color: 'bg-blue-100 text-blue-800' },
  user_deactivated: { label: 'User Deactivated', icon: User, color: 'bg-rose-100 text-rose-800' },
  rule_created: { label: 'Rule Created', icon: Shield, color: 'bg-blue-100 text-blue-800' },
  rule_updated: { label: 'Rule Updated', icon: Shield, color: 'bg-amber-100 text-amber-800' },
  rule_deleted: { label: 'Rule Deleted', icon: Shield, color: 'bg-rose-100 text-rose-800' },
  vendor_created: { label: 'Vendor Created', icon: Package, color: 'bg-blue-100 text-blue-800' },
  contract_created: { label: 'Contract Created', icon: FileText, color: 'bg-purple-100 text-purple-800' },
  payment_processed: { label: 'Payment Processed', icon: Receipt, color: 'bg-emerald-100 text-emerald-800' },
  settings_updated: { label: 'Settings Updated', icon: Settings, color: 'bg-slate-100 text-slate-800' },
  other: { label: 'Other', icon: AlertTriangle, color: 'bg-slate-100 text-slate-800' }
};

export default function AuditLogViewer({ logs = [] }) {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !search || 
      log.entity_reference?.toLowerCase().includes(search.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(search.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter;
    
    return matchesSearch && matchesAction && matchesEntity;
  });

  const uniqueActions = [...new Set(logs.map(l => l.action))];
  const uniqueEntities = [...new Set(logs.map(l => l.entity_type))];

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600" />
          Audit Trail
        </CardTitle>
        <CardDescription>Track all system activities and changes</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by reference, user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {uniqueActions.map(action => (
                <SelectItem key={action} value={action}>
                  {ACTION_CONFIG[action]?.label || action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Entities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {uniqueEntities.map(entity => (
                <SelectItem key={entity} value={entity}>{entity}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Log List */}
        {filteredLogs.length > 0 ? (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredLogs.map(log => {
              const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.other;
              const Icon = config.icon;
              let details = {};
              try { details = JSON.parse(log.details || '{}'); } catch (e) {}

              return (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                  <div className={`p-2 rounded-lg ${config.color.split(' ')[0]}`}>
                    <Icon className={`w-4 h-4 ${config.color.split(' ')[1]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={config.color}>{config.label}</Badge>
                      {log.entity_reference && (
                        <span className="font-medium text-sm">{log.entity_reference}</span>
                      )}
                      <span className="text-xs text-slate-400">
                        {log.entity_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                      <span>{log.user_name}</span>
                      <span>•</span>
                      <span className="text-xs">{log.user_role}</span>
                      {Object.keys(details).length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-xs truncate max-w-[200px]">
                            {Object.entries(details).map(([k, v]) => `${k}: ${v}`).join(', ')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-400 whitespace-nowrap">
                    {log.created_date ? format(new Date(log.created_date), 'MMM d, h:mm a') : ''}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No audit logs found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}