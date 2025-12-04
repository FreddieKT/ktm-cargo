import React, { Suspense, lazy } from 'react';
import Layout from './Layout.jsx';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const Dashboard = lazy(() => import('./Dashboard'));
const Shipments = lazy(() => import('./Shipments'));
const Customers = lazy(() => import('./Customers'));
const ShoppingOrders = lazy(() => import('./ShoppingOrders'));
const Tasks = lazy(() => import('./Tasks'));
const Reports = lazy(() => import('./Reports'));
const PriceCalculator = lazy(() => import('./PriceCalculator'));
const CustomerSegments = lazy(() => import('./CustomerSegments'));
const ShipmentDocuments = lazy(() => import('./ShipmentDocuments'));
const Feedback = lazy(() => import('./Feedback'));
const FeedbackAnalytics = lazy(() => import('./FeedbackAnalytics'));
const Inventory = lazy(() => import('./Inventory'));
const Vendors = lazy(() => import('./Vendors'));
const Settings = lazy(() => import('./Settings'));
const Procurement = lazy(() => import('./Procurement'));
const VendorRegistration = lazy(() => import('./VendorRegistration'));
const ClientPortal = lazy(() => import('./ClientPortal'));
const Invoices = lazy(() => import('./Invoices'));
const LandingPage = lazy(() => import('./LandingPage'));

const PAGES = {
  Dashboard,
  Shipments,
  Customers,
  ShoppingOrders,
  Tasks,
  Reports,
  PriceCalculator,
  CustomerSegments,
  ShipmentDocuments,
  Feedback,
  FeedbackAnalytics,
  Inventory,
  Vendors,
  Settings,
  Procurement,
  VendorRegistration,
  ClientPortal,
  Invoices,
};

function _getCurrentPage(url) {
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  let urlLastPart = url.split('/').pop();
  if (urlLastPart.includes('?')) {
    urlLastPart = urlLastPart.split('?')[0];
  }

  const pageName = Object.keys(PAGES).find(
    (page) => page.toLowerCase() === urlLastPart.toLowerCase()
  );
  return pageName || 'Dashboard';
}

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center h-[calc(100vh-64px)]">
    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
  </div>
);

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
  const location = useLocation();
  const currentPage = _getCurrentPage(location.pathname);

  return (
    <Layout currentPageName={currentPage}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/Dashboard" element={<Dashboard />} />
          <Route path="/Shipments" element={<Shipments />} />
          <Route path="/Customers" element={<Customers />} />
          <Route path="/ShoppingOrders" element={<ShoppingOrders />} />
          <Route path="/Tasks" element={<Tasks />} />
          <Route path="/Reports" element={<Reports />} />
          <Route path="/PriceCalculator" element={<PriceCalculator />} />
          <Route path="/CustomerSegments" element={<CustomerSegments />} />
          <Route path="/ShipmentDocuments" element={<ShipmentDocuments />} />
          <Route path="/Feedback" element={<Feedback />} />
          <Route path="/FeedbackAnalytics" element={<FeedbackAnalytics />} />
          <Route path="/Inventory" element={<Inventory />} />
          <Route path="/Vendors" element={<Vendors />} />
          <Route path="/Settings" element={<Settings />} />
          <Route path="/Procurement" element={<Procurement />} />
          <Route path="/VendorRegistration" element={<VendorRegistration />} />
          <Route path="/ClientPortal" element={<ClientPortal />} />
          <Route path="/Invoices" element={<Invoices />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default function Pages() {
  return (
    <Router>
      <PagesContent />
    </Router>
  );
}
