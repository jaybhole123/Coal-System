import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import PaymentAdvicePage from "./pages/PaymentAdvicePage";
import SalesOrderPage from "./pages/SalesOrderPage";
import SECLIntimationPage from "./pages/SECLIntimationPage";
import InvoicePage from "./pages/InvoicePage";

// Initial state for the Payment Advice page (lifted here so navigating away preserves data)
const PAYMENT_INIT = {
  view: "drop",
  loading: false,
  loadingName: "",
  error: null,
  data: null,
  fileName: "",
};

const SALES_ORDER_INIT = {
  view: "drop",
  loading: false,
  loadingName: "",
  error: null,
  data: null,
  fileName: "",
};

const SECL_INIT = {
  view: "drop",
  loading: false,
  loadingName: "",
  error: null,
  data: null,
  fileName: "",
};

const INVOICE_INIT = {
  view: "drop",
  loading: false,
  loadingName: "",
  error: null,
  data: null,
  fileName: "",
};

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [paymentState, setPaymentState] = useState(PAYMENT_INIT);
  const [salesOrderState, setSalesOrderState] = useState(SALES_ORDER_INIT);
  const [seclState, setSeclState] = useState(SECL_INIT);
  const [invoiceState, setInvoiceState] = useState(INVOICE_INIT);

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard onNavigate={setActivePage} />;
      case "payment-advice":
        return (
          <PaymentAdvicePage
            state={paymentState}
            setState={setPaymentState}
          />
        );
      case "sales-order":
        return (
          <SalesOrderPage
            state={salesOrderState}
            setState={setSalesOrderState}
          />
        );
      case "secl-intimation":
        return (
          <SECLIntimationPage
            state={seclState}
            setState={setSeclState}
          />
        );
      case "invoice":
        return (
          <InvoicePage
            state={invoiceState}
            setState={setInvoiceState}
          />
        );
      default:
        return <Dashboard onNavigate={setActivePage} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="main-area">
        <Topbar activePage={activePage} />
        <main className="page-content" id="main-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
