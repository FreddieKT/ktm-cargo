import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileSpreadsheet, Calendar, Mail, Download, Pencil, Trash2, 
  Play, Clock, CheckCircle, Send, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const SCHEDULE_LABELS = {
  none: 'Manual',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly'
};

const REPORT_TYPE_COLORS = {
  shipments: 'bg-blue-100 text-blue-800',
  customers: 'bg-purple-100 text-purple-800',
  revenue: 'bg-emerald-100 text-emerald-800',
  campaigns: 'bg-amber-100 text-amber-800',
  expenses: 'bg-rose-100 text-rose-800',
  pricing: 'bg-cyan-100 text-cyan-800'
};

export default function ReportsList({ 
  reports, 
  onEdit, 
  onDelete, 
  onRun, 
  onSendNow,
  runningReportId,
  sendingReportId
}) {
  if (reports.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-16 text-center">
          <FileSpreadsheet className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No custom reports</h3>
          <p className="text-slate-500">Create your first custom report to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map(report => (
        <Card key={report.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-100 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{report.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge className={REPORT_TYPE_COLORS[report.report_type] || 'bg-slate-100 text-slate-800'}>
                      {report.report_type?.replace(/_/g, ' ')}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {SCHEDULE_LABELS[report.schedule] || 'Manual'}
                    </Badge>
                    <Badge variant="outline">
                      {report.format?.toUpperCase() || 'CSV'}
                    </Badge>
                    {report.recipients && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {report.recipients.split(',').length} recipient(s)
                      </Badge>
                    )}
                  </div>
                  {report.last_sent && (
                    <p className="text-xs text-slate-500 mt-2">
                      Last sent: {format(new Date(report.last_sent), 'MMM d, yyyy HH:mm')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onRun(report)}
                  disabled={runningReportId === report.id}
                >
                  {runningReportId === report.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </>
                  )}
                </Button>
                
                {report.recipients && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onSendNow(report)}
                    disabled={sendingReportId === report.id}
                  >
                    {sendingReportId === report.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-1" />
                        Send Now
                      </>
                    )}
                  </Button>
                )}
                
                <Button variant="ghost" size="sm" onClick={() => onEdit(report)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  onClick={() => onDelete(report.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}