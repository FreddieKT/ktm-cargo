import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  FileText, Printer, Download, Package, Search,
  CheckCircle, Clock, ArrowLeft, Filter, FileCheck,
  Plane, ClipboardList, AlertTriangle, RefreshCw,
  Eye, ChevronRight, Truck, Calendar, DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  picked_up: { label: 'Picked Up', color: 'bg-indigo-100 text-indigo-800', icon: Package },
  in_transit: { label: 'In Transit', color: 'bg-cyan-100 text-cyan-800', icon: Truck },
  customs: { label: 'Customs', color: 'bg-purple-100 text-purple-800', icon: FileCheck },
  delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-slate-100 text-slate-800', icon: AlertTriangle }
};

const DOCUMENT_TYPES = [
  { id: 'commercial_invoice', label: 'Commercial Invoice', icon: FileText, description: 'Invoice for customs and payment' },
  { id: 'packing_list', label: 'Packing List', icon: ClipboardList, description: 'List of items and quantities' },
  { id: 'air_waybill', label: 'Air Waybill', icon: Plane, description: 'Shipping contract document' },
  { id: 'customs_declaration', label: 'Customs Declaration', icon: FileCheck, description: 'Export/import declaration' }
];

export default function ShipmentDocuments() {
  const [selectedShipmentId, setSelectedShipmentId] = useState(null);
  const [activeDoc, setActiveDoc] = useState('commercial_invoice');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedShipments, setSelectedShipments] = useState([]);
  const [generatedDocs, setGeneratedDocs] = useState({});

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['shipments'],
    queryFn: () => base44.entities.Shipment.list('-created_date', 200)
  });

  const { data: companySettings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const list = await base44.entities.CompanySettings.list();
      return list[0] || null;
    }
  });

  // Filter eligible shipments
  const eligibleShipments = useMemo(() => {
    return shipments.filter(s => {
      // Must be confirmed or later
      if (!['confirmed', 'picked_up', 'in_transit', 'customs', 'delivered'].includes(s.status)) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return s.tracking_number?.toLowerCase().includes(query) ||
               s.customer_name?.toLowerCase().includes(query) ||
               s.items_description?.toLowerCase().includes(query);
      }
      return true;
    });
  }, [shipments, statusFilter, searchQuery]);

  const selectedShipment = shipments.find(s => s.id === selectedShipmentId);

  // Stats
  const stats = useMemo(() => {
    const total = eligibleShipments.length;
    const needsDocs = eligibleShipments.filter(s => !generatedDocs[s.id] || Object.keys(generatedDocs[s.id]).length < 4).length;
    const inTransit = eligibleShipments.filter(s => s.status === 'in_transit').length;
    const customs = eligibleShipments.filter(s => s.status === 'customs').length;
    return { total, needsDocs, inTransit, customs };
  }, [eligibleShipments, generatedDocs]);

  const handlePrintDocument = (docType, shipment) => {
    const printContent = generateFullDocument(docType, shipment, companySettings);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    } else {
      toast.error('Please allow popups to print documents');
    }
  };

  const handleGenerateDoc = (shipmentId, docType) => {
    setGeneratedDocs(prev => ({
      ...prev,
      [shipmentId]: {
        ...(prev[shipmentId] || {}),
        [docType]: true
      }
    }));
    toast.success(`${DOCUMENT_TYPES.find(d => d.id === docType)?.label} generated`);
  };

  const handleGenerateAllDocs = (shipmentId) => {
    const allDocs = {};
    DOCUMENT_TYPES.forEach(doc => {
      allDocs[doc.id] = true;
    });
    setGeneratedDocs(prev => ({
      ...prev,
      [shipmentId]: allDocs
    }));
    toast.success('All documents generated');
  };

  const handleBatchPrint = () => {
    if (selectedShipments.length === 0) {
      toast.error('Select shipments to print');
      return;
    }
    selectedShipments.forEach(id => {
      const shipment = shipments.find(s => s.id === id);
      if (shipment) {
        handlePrintDocument(activeDoc, shipment);
      }
    });
    toast.success(`Printing ${selectedShipments.length} documents`);
  };

  const toggleShipmentSelection = (id) => {
    setSelectedShipments(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllShipments = () => {
    if (selectedShipments.length === eligibleShipments.length) {
      setSelectedShipments([]);
    } else {
      setSelectedShipments(eligibleShipments.map(s => s.id));
    }
  };

  const getDocStatus = (shipmentId) => {
    const docs = generatedDocs[shipmentId] || {};
    const count = Object.keys(docs).length;
    if (count === 0) return { label: 'Not Generated', color: 'bg-slate-100 text-slate-600' };
    if (count < 4) return { label: `${count}/4 Docs`, color: 'bg-amber-100 text-amber-800' };
    return { label: 'Complete', color: 'bg-emerald-100 text-emerald-800' };
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Shipments')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Shipping Documents</h1>
              <p className="text-slate-500 mt-1">Generate, preview and print shipping documentation</p>
            </div>
          </div>
          <div className="flex gap-2">
            {selectedShipments.length > 0 && (
              <Button onClick={handleBatchPrint} className="bg-blue-600 hover:bg-blue-700">
                <Printer className="w-4 h-4 mr-2" />
                Print Selected ({selectedShipments.length})
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Eligible Shipments</p>
                  <p className="text-xl font-bold text-slate-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Need Documents</p>
                  <p className="text-xl font-bold text-amber-600">{stats.needsDocs}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <Truck className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">In Transit</p>
                  <p className="text-xl font-bold text-cyan-600">{stats.inTransit}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileCheck className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">At Customs</p>
                  <p className="text-xl font-bold text-purple-600">{stats.customs}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shipment Selection */}
          <div className="space-y-4">
            {/* Search and Filters */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search tracking, customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="picked_up">Picked Up</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="customs">At Customs</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={selectedShipments.length === eligibleShipments.length && eligibleShipments.length > 0}
                      onCheckedChange={selectAllShipments}
                    />
                    <span className="text-sm text-slate-600">Select All</span>
                  </div>
                  <span className="text-xs text-slate-500">{eligibleShipments.length} shipments</span>
                </div>
              </CardContent>
            </Card>

            {/* Shipment List */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Select Shipment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                {isLoading ? (
                  <div className="text-center py-8 text-slate-500">Loading...</div>
                ) : eligibleShipments.length > 0 ? (
                  eligibleShipments.map(shipment => {
                    const statusConfig = STATUS_CONFIG[shipment.status] || STATUS_CONFIG.pending;
                    const docStatus = getDocStatus(shipment.id);
                    const isSelected = selectedShipmentId === shipment.id;
                    const isChecked = selectedShipments.includes(shipment.id);

                    return (
                      <div
                        key={shipment.id}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox 
                            checked={isChecked}
                            onCheckedChange={() => toggleShipmentSelection(shipment.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div 
                            className="flex-1 min-w-0"
                            onClick={() => setSelectedShipmentId(shipment.id)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-slate-900 truncate">
                                {shipment.tracking_number || 'Pending'}
                              </span>
                              <Badge className={statusConfig.color}>
                                {statusConfig.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 truncate">{shipment.customer_name}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-slate-500">
                                {shipment.weight_kg} kg • ฿{shipment.total_amount?.toLocaleString()}
                              </span>
                              <Badge className={docStatus.color} variant="outline">
                                {docStatus.label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No shipments found</p>
                    <p className="text-xs mt-1">Adjust your filters or search</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Document Preview */}
          <div className="lg:col-span-2 space-y-4">
            {selectedShipment ? (
              <>
                {/* Shipment Summary */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <Package className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h2 className="font-bold text-lg">{selectedShipment.tracking_number}</h2>
                          <p className="text-slate-500">{selectedShipment.customer_name}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>{selectedShipment.created_date ? format(new Date(selectedShipment.created_date), 'MMM d, yyyy') : '-'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4 text-slate-400" />
                          <span>{selectedShipment.weight_kg} kg</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-slate-400" />
                          <span>฿{selectedShipment.total_amount?.toLocaleString()}</span>
                        </div>
                      </div>
                      <Button onClick={() => handleGenerateAllDocs(selectedShipment.id)} variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Generate All Docs
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Document Types Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {DOCUMENT_TYPES.map(doc => {
                    const Icon = doc.icon;
                    const isGenerated = generatedDocs[selectedShipment.id]?.[doc.id];
                    const isActive = activeDoc === doc.id;

                    return (
                      <Card 
                        key={doc.id}
                        className={`border-2 cursor-pointer transition-all ${
                          isActive ? 'border-blue-500 bg-blue-50' : 
                          isGenerated ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-blue-200'
                        }`}
                        onClick={() => setActiveDoc(doc.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : isGenerated ? 'text-emerald-600' : 'text-slate-500'}`} />
                            {isGenerated && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                          </div>
                          <p className="font-medium text-sm">{doc.label}</p>
                          <p className="text-xs text-slate-500 mt-1">{doc.description}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Document Preview */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between border-b">
                    <div>
                      <CardTitle className="text-lg">{DOCUMENT_TYPES.find(d => d.id === activeDoc)?.label}</CardTitle>
                      <CardDescription>Preview and print document</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => handleGenerateDoc(selectedShipment.id, activeDoc)}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Generate
                      </Button>
                      <Button onClick={() => handlePrintDocument(activeDoc, selectedShipment)} className="bg-blue-600 hover:bg-blue-700">
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="bg-white border-t min-h-[600px] overflow-auto">
                      <div className="p-6">
                        <DocumentPreview type={activeDoc} shipment={selectedShipment} companySettings={companySettings} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-24 text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Select a Shipment</h3>
                  <p className="text-slate-500">Choose a shipment from the list to preview and generate documents</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentPreview({ type, shipment, companySettings }) {
  const today = format(new Date(), 'MMMM d, yyyy');
  const companyName = companySettings?.company_name || 'Bangkok-Yangon Cargo & Shopping Services';
  const companyAddress = companySettings?.address || 'Bangkok, Thailand';
  
  if (type === 'commercial_invoice') {
    return (
      <div className="space-y-6">
        <div className="text-center border-b pb-4">
          <h1 className="text-2xl font-bold">COMMERCIAL INVOICE</h1>
          <p className="text-slate-600">{companyName}</p>
          <p className="text-sm text-slate-500">{companyAddress}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-500 mb-2">INVOICE DETAILS</h3>
            <p><strong>Invoice No:</strong> INV-{shipment.tracking_number}</p>
            <p><strong>Date:</strong> {today}</p>
            <p><strong>Tracking:</strong> {shipment.tracking_number}</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-500 mb-2">CONSIGNEE</h3>
            <p className="font-semibold">{shipment.customer_name}</p>
            <p>{shipment.customer_phone}</p>
            <p>{shipment.delivery_address || 'Yangon, Myanmar'}</p>
          </div>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="border p-2 text-left">Description</th>
              <th className="border p-2 text-right">Weight</th>
              <th className="border p-2 text-right">Rate</th>
              <th className="border p-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2">{shipment.items_description || 'General Cargo'}</td>
              <td className="border p-2 text-right">{shipment.weight_kg} kg</td>
              <td className="border p-2 text-right">฿{shipment.price_per_kg || 95}/kg</td>
              <td className="border p-2 text-right">฿{((shipment.weight_kg || 0) * (shipment.price_per_kg || 95)).toLocaleString()}</td>
            </tr>
            {shipment.insurance_amount > 0 && (
              <tr>
                <td className="border p-2">Insurance</td>
                <td className="border p-2" colSpan="2"></td>
                <td className="border p-2 text-right">฿{shipment.insurance_amount}</td>
              </tr>
            )}
            {shipment.packaging_fee > 0 && (
              <tr>
                <td className="border p-2">Packaging Fee</td>
                <td className="border p-2" colSpan="2"></td>
                <td className="border p-2 text-right">฿{shipment.packaging_fee}</td>
              </tr>
            )}
            <tr className="font-bold bg-slate-50">
              <td className="border p-2" colSpan="3">TOTAL</td>
              <td className="border p-2 text-right">฿{(shipment.total_amount || 0).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-between items-center pt-4">
          <p><strong>Payment Status:</strong> <Badge className={shipment.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>{shipment.payment_status?.toUpperCase()}</Badge></p>
          <p><strong>Payment Method:</strong> {shipment.payment_method?.replace('_', ' ')?.toUpperCase() || 'N/A'}</p>
        </div>
      </div>
    );
  }

  if (type === 'packing_list') {
    return (
      <div className="space-y-6">
        <div className="text-center border-b pb-4">
          <h1 className="text-2xl font-bold">PACKING LIST</h1>
          <p className="text-slate-600">{companyName}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-500 mb-2">SHIPMENT DETAILS</h3>
            <p><strong>Tracking No:</strong> {shipment.tracking_number}</p>
            <p><strong>Date:</strong> {today}</p>
            <p><strong>Service:</strong> {shipment.service_type?.replace('_', ' ')?.toUpperCase()}</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-500 mb-2">CONSIGNEE</h3>
            <p className="font-semibold">{shipment.customer_name}</p>
            <p>{shipment.delivery_address || 'Yangon, Myanmar'}</p>
          </div>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="border p-2 text-left">Item No.</th>
              <th className="border p-2 text-left">Description</th>
              <th className="border p-2 text-center">Quantity</th>
              <th className="border p-2 text-right">Weight</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2">1</td>
              <td className="border p-2">{shipment.items_description || 'General Cargo'}</td>
              <td className="border p-2 text-center">1 Package</td>
              <td className="border p-2 text-right">{shipment.weight_kg} kg</td>
            </tr>
            <tr className="font-bold bg-slate-50">
              <td className="border p-2" colSpan="3">TOTAL GROSS WEIGHT</td>
              <td className="border p-2 text-right">{shipment.weight_kg} kg</td>
            </tr>
          </tbody>
        </table>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <p><strong>Number of Packages:</strong> 1</p>
          <p><strong>Packaging:</strong> {shipment.packaging_fee > 0 ? 'Professional' : 'Standard'}</p>
          <p><strong>Origin:</strong> {shipment.pickup_address || 'Bangkok, Thailand'}</p>
          <p><strong>Destination:</strong> {shipment.delivery_address || 'Yangon, Myanmar'}</p>
        </div>
      </div>
    );
  }

  if (type === 'air_waybill') {
    return (
      <div className="space-y-6">
        <div className="text-center border-b pb-4">
          <h1 className="text-2xl font-bold">AIR WAYBILL</h1>
          <p className="text-xl font-mono mt-2 text-blue-600">{shipment.tracking_number}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-500 mb-2">SHIPPER</h3>
            <p className="font-semibold">{companyName}</p>
            <p>{companyAddress}</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-500 mb-2">CONSIGNEE</h3>
            <p className="font-semibold">{shipment.customer_name}</p>
            <p>{shipment.customer_phone}</p>
            <p>{shipment.delivery_address || 'Yangon, Myanmar'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="border rounded-lg p-4 text-center bg-blue-50">
            <h3 className="text-sm font-semibold text-slate-500">ORIGIN</h3>
            <p className="text-3xl font-bold text-blue-600">BKK</p>
            <p className="text-sm text-slate-600">Bangkok, Thailand</p>
          </div>
          <div className="border rounded-lg p-4 text-center bg-emerald-50">
            <h3 className="text-sm font-semibold text-slate-500">DESTINATION</h3>
            <p className="text-3xl font-bold text-emerald-600">RGN</p>
            <p className="text-sm text-slate-600">Yangon, Myanmar</p>
          </div>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="border p-2">Pieces</th>
              <th className="border p-2">Gross Weight</th>
              <th className="border p-2">Description</th>
              <th className="border p-2">Declared Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2 text-center">1</td>
              <td className="border p-2 text-center">{shipment.weight_kg} kg</td>
              <td className="border p-2">{shipment.items_description || 'General Cargo'}</td>
              <td className="border p-2 text-center">฿{(shipment.total_amount || 0).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div className="grid grid-cols-2 gap-4">
          <p><strong>Flight Date:</strong> {shipment.pickup_date ? format(new Date(shipment.pickup_date), 'MMM d, yyyy') : 'TBD'}</p>
          <p><strong>Service:</strong> {shipment.service_type === 'express' ? 'EXPRESS' : 'STANDARD'}</p>
          <p><strong>Est. Delivery:</strong> {shipment.estimated_delivery ? format(new Date(shipment.estimated_delivery), 'MMM d, yyyy') : 'TBD'}</p>
          <p><strong>Insurance:</strong> {shipment.insurance_opted ? 'Yes' : 'No'}</p>
        </div>
      </div>
    );
  }

  if (type === 'customs_declaration') {
    return (
      <div className="space-y-6">
        <div className="text-center border-b pb-4">
          <h1 className="text-2xl font-bold">CUSTOMS DECLARATION</h1>
          <p className="text-slate-600">For Export from Thailand to Myanmar</p>
        </div>

        <div className="border rounded-lg p-4 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-500 mb-2">DECLARATION REFERENCE</h3>
          <p><strong>Reference No:</strong> CD-{shipment.tracking_number}</p>
          <p><strong>Date:</strong> {today}</p>
          <p><strong>AWB Number:</strong> {shipment.tracking_number}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-500 mb-2">EXPORTER</h3>
            <p className="font-semibold">{companyName}</p>
            <p>{companyAddress}</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-500 mb-2">IMPORTER/CONSIGNEE</h3>
            <p className="font-semibold">{shipment.customer_name}</p>
            <p>{shipment.delivery_address || 'Yangon, Myanmar'}</p>
          </div>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="border p-2">HS Code</th>
              <th className="border p-2">Description</th>
              <th className="border p-2">Qty</th>
              <th className="border p-2">Weight</th>
              <th className="border p-2">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2 text-center">-</td>
              <td className="border p-2">{shipment.items_description || 'Personal Effects'}</td>
              <td className="border p-2 text-center">1 pkg</td>
              <td className="border p-2 text-center">{shipment.weight_kg} kg</td>
              <td className="border p-2 text-center">฿{(shipment.total_amount || 0).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div className="border rounded-lg p-4 bg-amber-50">
          <h3 className="font-semibold mb-2">DECLARATION</h3>
          <p className="text-sm text-slate-600">
            I hereby declare that the information provided above is true and accurate to the best of my knowledge. 
            The goods described comply with all applicable export regulations of Thailand and import regulations of Myanmar.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 pt-8">
          <div className="border-t-2 border-slate-300 pt-2 text-center text-sm text-slate-500">
            Declarant Signature & Date
          </div>
          <div className="border-t-2 border-slate-300 pt-2 text-center text-sm text-slate-500">
            Customs Officer Stamp
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function generateFullDocument(docType, shipment, companySettings) {
  const today = format(new Date(), 'MMMM d, yyyy');
  const companyName = companySettings?.company_name || 'Bangkok-Yangon Cargo & Shopping Services';
  const companyAddress = companySettings?.address || 'Bangkok, Thailand';
  
  const baseStyles = `
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
      .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
      .header h1 { margin: 0; font-size: 24px; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
      .info-box { border: 1px solid #ddd; padding: 15px; border-radius: 4px; }
      .info-box h3 { margin: 0 0 10px 0; font-size: 12px; color: #666; text-transform: uppercase; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
      th { background: #f5f5f5; }
      .total-row { font-weight: bold; background: #f9f9f9; }
      .footer { margin-top: 40px; font-size: 12px; color: #666; }
      .signature-box { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
      .signature-line { border-top: 1px solid #333; padding-top: 5px; margin-top: 50px; text-align: center; }
    </style>
  `;

  const templates = {
    commercial_invoice: `<!DOCTYPE html><html><head><title>Commercial Invoice</title>${baseStyles}</head><body>
      <div class="header"><h1>COMMERCIAL INVOICE</h1><p>${companyName}</p><p style="font-size:12px;color:#666;">${companyAddress}</p></div>
      <div class="info-grid">
        <div class="info-box"><h3>Invoice Details</h3><p>Invoice No: INV-${shipment.tracking_number}</p><p>Date: ${today}</p><p>Tracking: ${shipment.tracking_number}</p></div>
        <div class="info-box"><h3>Consignee</h3><p><strong>${shipment.customer_name}</strong></p><p>${shipment.customer_phone || ''}</p><p>${shipment.delivery_address || 'Yangon, Myanmar'}</p></div>
      </div>
      <table><thead><tr><th>Description</th><th>Weight</th><th>Rate</th><th>Amount</th></tr></thead>
      <tbody>
        <tr><td>${shipment.items_description || 'General Cargo'}</td><td>${shipment.weight_kg} kg</td><td>฿${shipment.price_per_kg || 95}/kg</td><td>฿${((shipment.weight_kg || 0) * (shipment.price_per_kg || 95)).toLocaleString()}</td></tr>
        ${shipment.insurance_amount > 0 ? `<tr><td>Insurance</td><td colspan="2"></td><td>฿${shipment.insurance_amount}</td></tr>` : ''}
        ${shipment.packaging_fee > 0 ? `<tr><td>Packaging</td><td colspan="2"></td><td>฿${shipment.packaging_fee}</td></tr>` : ''}
        <tr class="total-row"><td colspan="3">TOTAL</td><td>฿${(shipment.total_amount || 0).toLocaleString()}</td></tr>
      </tbody></table>
      <p><strong>Payment Status:</strong> ${shipment.payment_status?.toUpperCase() || 'PENDING'}</p>
      <div class="footer"><p>This is a computer-generated invoice.</p></div>
    </body></html>`,
    packing_list: `<!DOCTYPE html><html><head><title>Packing List</title>${baseStyles}</head><body>
      <div class="header"><h1>PACKING LIST</h1><p>${companyName}</p></div>
      <div class="info-grid">
        <div class="info-box"><h3>Shipment</h3><p>Tracking: ${shipment.tracking_number}</p><p>Date: ${today}</p><p>Service: ${shipment.service_type?.replace('_', ' ')}</p></div>
        <div class="info-box"><h3>Consignee</h3><p><strong>${shipment.customer_name}</strong></p><p>${shipment.delivery_address || 'Yangon, Myanmar'}</p></div>
      </div>
      <table><thead><tr><th>Item</th><th>Description</th><th>Qty</th><th>Weight</th></tr></thead>
      <tbody><tr><td>1</td><td>${shipment.items_description || 'General Cargo'}</td><td>1 pkg</td><td>${shipment.weight_kg} kg</td></tr>
      <tr class="total-row"><td colspan="3">TOTAL GROSS WEIGHT</td><td>${shipment.weight_kg} kg</td></tr></tbody></table>
    </body></html>`,
    air_waybill: `<!DOCTYPE html><html><head><title>Air Waybill</title>${baseStyles}</head><body>
      <div class="header"><h1>AIR WAYBILL</h1><p style="font-size:20px;font-weight:bold;">${shipment.tracking_number}</p></div>
      <div class="info-grid">
        <div class="info-box"><h3>Shipper</h3><p><strong>${companyName}</strong></p><p>${companyAddress}</p></div>
        <div class="info-box"><h3>Consignee</h3><p><strong>${shipment.customer_name}</strong></p><p>${shipment.customer_phone || ''}</p><p>${shipment.delivery_address || 'Yangon, Myanmar'}</p></div>
      </div>
      <div class="info-grid">
        <div class="info-box" style="text-align:center;"><h3>Origin</h3><p style="font-size:28px;font-weight:bold;">BKK</p><p>Bangkok, Thailand</p></div>
        <div class="info-box" style="text-align:center;"><h3>Destination</h3><p style="font-size:28px;font-weight:bold;">RGN</p><p>Yangon, Myanmar</p></div>
      </div>
      <table><thead><tr><th>Pieces</th><th>Weight</th><th>Description</th><th>Value</th></tr></thead>
      <tbody><tr><td style="text-align:center;">1</td><td style="text-align:center;">${shipment.weight_kg} kg</td><td>${shipment.items_description || 'General Cargo'}</td><td style="text-align:center;">฿${(shipment.total_amount || 0).toLocaleString()}</td></tr></tbody></table>
      <p><strong>Service:</strong> ${shipment.service_type === 'express' ? 'EXPRESS' : 'STANDARD'}</p>
      <div class="signature-box"><div><div class="signature-line">Shipper Signature</div></div><div><div class="signature-line">Carrier Signature</div></div></div>
    </body></html>`,
    customs_declaration: `<!DOCTYPE html><html><head><title>Customs Declaration</title>${baseStyles}</head><body>
      <div class="header"><h1>CUSTOMS DECLARATION</h1><p>For Export from Thailand to Myanmar</p></div>
      <div class="info-box" style="margin-bottom:20px;"><h3>Reference</h3><p>Ref No: CD-${shipment.tracking_number}</p><p>Date: ${today}</p></div>
      <div class="info-grid">
        <div class="info-box"><h3>Exporter</h3><p><strong>${companyName}</strong></p><p>${companyAddress}</p></div>
        <div class="info-box"><h3>Importer</h3><p><strong>${shipment.customer_name}</strong></p><p>${shipment.delivery_address || 'Yangon, Myanmar'}</p></div>
      </div>
      <table><thead><tr><th>HS Code</th><th>Description</th><th>Qty</th><th>Weight</th><th>Value</th></tr></thead>
      <tbody><tr><td>-</td><td>${shipment.items_description || 'Personal Effects'}</td><td>1 pkg</td><td>${shipment.weight_kg} kg</td><td>฿${(shipment.total_amount || 0).toLocaleString()}</td></tr></tbody></table>
      <div class="info-box" style="background:#fffbeb;"><h3>Declaration</h3><p>I hereby declare that the information provided is true and accurate.</p></div>
      <div class="signature-box"><div><div class="signature-line">Declarant Signature & Date</div></div><div><div class="signature-line">Customs Officer Stamp</div></div></div>
    </body></html>`
  };

  return templates[docType] || '';
}