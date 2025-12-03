import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Shipments from "./Shipments";

import Customers from "./Customers";

import ShoppingOrders from "./ShoppingOrders";

import Tasks from "./Tasks";

import Reports from "./Reports";

import PriceCalculator from "./PriceCalculator";

import CustomerSegments from "./CustomerSegments";

import ShipmentDocuments from "./ShipmentDocuments";

import Feedback from "./Feedback";

import FeedbackAnalytics from "./FeedbackAnalytics";

import Inventory from "./Inventory";

import Vendors from "./Vendors";

import Settings from "./Settings";

import Procurement from "./Procurement";

import VendorRegistration from "./VendorRegistration";

import ClientPortal from "./ClientPortal";

import Invoices from "./Invoices";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import LandingPage from "./LandingPage";

const PAGES = {

    Dashboard: Dashboard,

    Shipments: Shipments,

    Customers: Customers,

    ShoppingOrders: ShoppingOrders,

    Tasks: Tasks,

    Reports: Reports,

    PriceCalculator: PriceCalculator,

    CustomerSegments: CustomerSegments,

    ShipmentDocuments: ShipmentDocuments,

    Feedback: Feedback,

    FeedbackAnalytics: FeedbackAnalytics,

    Inventory: Inventory,

    Vendors: Vendors,

    Settings: Settings,

    Procurement: Procurement,

    VendorRegistration: VendorRegistration,

    ClientPortal: ClientPortal,

    Invoices: Invoices,

}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);

    return (
        <Layout currentPageName={currentPage}>
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