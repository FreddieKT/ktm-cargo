import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Clock, CheckCircle, XCircle, AlertTriangle, FileText,
  DollarSign, Building2, Calendar, MessageSquare, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function PendingApprovalsPanel({ 
  pendingPOs = [], 
  currentUserEmail,
  onApprove, 
  onReject,
  isLoading = false
}) {
  const [selectedPO, setSelectedPO] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleAction = async () => {
    if (!selectedPO) return;
    setProcessing(true);

    try {
      if (actionType === 'approve') {
        await onApprove?.(selectedPO, comments);
        toast.success('Purchase order approved');
      } else {
        await onReject?.(selectedPO, comments);
        toast.success('Purchase order rejected');
      }
    } catch (e) {
      toast.error('Failed to process approval');
    }

    setProcessing(false);
    setSelectedPO(null);
    setActionType(null);
    setComments('');
  };

  const openActionDialog = (po, action) => {
    setSelectedPO(po);
    setActionType(action);
    setComments('');
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          <p className="text-slate-500 mt-2">Loading approvals...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-xs text-amber-600 uppercase font-medium">Pending</p>
                <p className="text-2xl font-bold text-amber-900">{pendingPOs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                ฿{pendingPOs.reduce((sum, po) => sum + (po.total_amount || 0), 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">Total Value</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {pendingPOs.filter(po => (po.total_amount || 0) > 50000).length}
              </p>
              <p className="text-xs text-slate-500">High Value</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending List */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Pending Approvals
          </CardTitle>
          <CardDescription>Purchase orders awaiting your approval</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingPOs.length > 0 ? (
            <div className="space-y-4">
              {pendingPOs.map(po => (
                <div key={po.id} className="p-4 border rounded-lg hover:border-blue-200 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <FileText className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{po.po_number}</h3>
                          {po.total_amount > 50000 && (
                            <Badge className="bg-rose-100 text-rose-800">High Value</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {po.vendor_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {po.order_date ? format(new Date(po.order_date), 'MMM d, yyyy') : 'N/A'}
                          </span>
                        </div>
                        {po.notes && (
                          <p className="text-sm text-slate-500 mt-2 line-clamp-1">{po.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-slate-900">
                        ฿{po.total_amount?.toLocaleString()}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-rose-600 hover:bg-rose-50"
                          onClick={() => openActionDialog(po, 'reject')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => openActionDialog(po, 'approve')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-slate-900 font-medium">All caught up!</p>
              <p className="text-slate-500 text-sm">No pending approvals for you</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!selectedPO} onOpenChange={() => { setSelectedPO(null); setActionType(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'approve' ? (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600" />
              )}
              {actionType === 'approve' ? 'Approve' : 'Reject'} Purchase Order
            </DialogTitle>
          </DialogHeader>
          {selectedPO && (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-500">PO Number:</span>
                  <span className="font-medium">{selectedPO.po_number}</span>
                  <span className="text-slate-500">Vendor:</span>
                  <span className="font-medium">{selectedPO.vendor_name}</span>
                  <span className="text-slate-500">Amount:</span>
                  <span className="font-bold text-blue-600">฿{selectedPO.total_amount?.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Comments {actionType === 'reject' && <span className="text-rose-500">*</span>}
                </label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={actionType === 'approve' ? 'Optional approval notes...' : 'Please provide reason for rejection...'}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => { setSelectedPO(null); setActionType(null); }} 
                  className="flex-1"
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAction}
                  disabled={processing || (actionType === 'reject' && !comments)}
                  className={`flex-1 ${actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : actionType === 'approve' ? (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  {actionType === 'approve' ? 'Approve' : 'Reject'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}