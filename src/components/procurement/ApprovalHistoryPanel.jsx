import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, XCircle, Clock, Zap, ArrowUp, 
  FileText, User, MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';

const ACTION_CONFIG = {
  submitted: { label: 'Submitted', icon: FileText, color: 'bg-blue-100 text-blue-800' },
  approved: { label: 'Approved', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'bg-rose-100 text-rose-800' },
  auto_approved: { label: 'Auto-Approved', icon: Zap, color: 'bg-emerald-100 text-emerald-800' },
  escalated: { label: 'Escalated', icon: ArrowUp, color: 'bg-amber-100 text-amber-800' }
};

export default function ApprovalHistoryPanel({ history = [], poNumber }) {
  const sortedHistory = [...history].sort((a, b) => 
    new Date(a.created_date) - new Date(b.created_date)
  );

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          Approval History
          {poNumber && <span className="text-slate-400 font-normal">- {poNumber}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedHistory.length > 0 ? (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
            
            <div className="space-y-4">
              {sortedHistory.map((entry, idx) => {
                const config = ACTION_CONFIG[entry.action] || ACTION_CONFIG.submitted;
                const Icon = config.icon;
                
                return (
                  <div key={entry.id || idx} className="relative flex gap-4 pl-10">
                    {/* Timeline dot */}
                    <div className={`absolute left-2 w-5 h-5 rounded-full flex items-center justify-center ${config.color.split(' ')[0]} border-2 border-white shadow-sm`}>
                      <Icon className={`w-3 h-3 ${config.color.split(' ')[1]}`} />
                    </div>
                    
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={config.color}>{config.label}</Badge>
                          {entry.approval_level && entry.action !== 'auto_approved' && (
                            <span className="text-xs text-slate-400">Level {entry.approval_level}</span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">
                          {entry.created_date ? format(new Date(entry.created_date), 'MMM d, yyyy h:mm a') : ''}
                        </span>
                      </div>
                      
                      <div className="mt-2 text-sm">
                        {entry.approver_name && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <User className="w-3 h-3" />
                            <span>{entry.approver_name}</span>
                            {entry.approver_email && (
                              <span className="text-slate-400">({entry.approver_email})</span>
                            )}
                          </div>
                        )}
                        
                        {entry.rule_applied && (
                          <div className="flex items-center gap-2 text-slate-500 mt-1">
                            <Zap className="w-3 h-3" />
                            <span>Rule: {entry.rule_applied}</span>
                          </div>
                        )}
                        
                        {entry.comments && (
                          <div className="flex items-start gap-2 mt-2 p-2 bg-slate-50 rounded text-slate-600">
                            <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{entry.comments}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">No approval history yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}