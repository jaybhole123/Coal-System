import { useState, useCallback } from "react";
import Dropzone from "../components/Dropzone";
import InvoiceResults from "../components/InvoiceResults";
import EditModal from "../components/EditModal";
import { extractRows, downloadBlob } from "../utils/pdfParser";
import { parseInvoiceText, toInvoiceCSV, INVOICE_COLS } from "../utils/invoiceParser";

export default function InvoicePage({ state, setState }) {
  const { view, loading, loadingName, error, data, fileName } = state;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleManualAdd = (formData) => {
    const newItem = {
      ...formData,
      pdfUrl: formData.pdfFile ? URL.createObjectURL(formData.pdfFile) : null,
      pdfName: formData.pdfFile ? formData.pdfFile.name : "Manual Entry"
    };
    setState((s) => ({
      ...s,
      data: s.data && Array.isArray(s.data) ? [...s.data, newItem] : [newItem],
      view: "results",
      fileName: s.fileName || "Manual Entry"
    }));
    setIsModalOpen(false);
  };

  const handleFiles = useCallback(
    async (files) => {
      if (files.length === 0) {
        setState((s) => ({ ...s, error: "Please upload only PDF files." }));
        return;
      }

      setState((s) => ({
        ...s, error: null, loading: true, loadingName: files.length > 1 ? `${files.length} files` : files[0].name,
      }));

      try {
        const results = await Promise.all(
          files.map(async (file) => {
            const rows = await extractRows(file);
            const parsed = parseInvoiceText(rows);
            parsed.pdfUrl = URL.createObjectURL(file);
            parsed.pdfName = file.name;
            return parsed;
          })
        );
        setState((s) => {
          const newData = s.data && Array.isArray(s.data) ? [...s.data, ...results] : results;
          const newFileName = s.fileName ? s.fileName + ", " + (files.length > 1 ? `${files.length} files` : files[0].name) : (files.length > 1 ? `${files.length}_files` : files[0].name);
          return {
            ...s, loading: false, data: newData, fileName: newFileName, view: "results",
          };
        });
      } catch (err) {
        console.error(err);
        setState((s) => ({
          ...s,
          loading: false,
          error: "Failed to read PDF. File might be corrupt, password-protected, or in a different format. (" + (err?.message ?? "unknown error") + ")",
        }));
      }
    },
    [setState]
  );

  const handleReset = () =>
    setState({ view: "drop", loading: false, loadingName: "", error: null, data: null, fileName: "" });

  const handleExportJson = () => {
    if (!data) return;
    downloadBlob(JSON.stringify(data, null, 2), fileName.replace(/\.pdf$/i, "") + "_invoice.json", "application/json");
  };

  const handleSave = () => {
    if (!data) return;
    localStorage.setItem("invoice_data", JSON.stringify(data));
    alert("Data saved to LocalStorage successfully!");
  };

  const handleExportCsv = () => {
    if (!data) return;
    downloadBlob(toInvoiceCSV(data), fileName.replace(/\.pdf$/i, "") + "_invoice.csv", "text/csv");
  };

  const handleDeleteRow = (index) => {
    setState((s) => {
      const newData = [...s.data];
      newData.splice(index, 1);
      if (newData.length === 0) {
        return { ...s, view: "drop", data: null, fileName: "" };
      }
      return { ...s, data: newData };
    });
  };

  const handleUpdateRow = (index, updatedRow) => {
    setState((s) => {
      const newData = [...s.data];
      newData[index] = updatedRow;
      return { ...s, data: newData };
    });
  };

  return (
    <div className="page-content">
      <div className="topbar">
        <h2>Invoice Reader</h2>
        <span className="badge">PDF PROCESSING</span>
      </div>

      {view === "drop" && (
        <>
          <Dropzone
            onFiles={handleFiles}
            loading={loading}
            loadingName={loadingName}
            error={error}
            title="Upload Invoice PDF"
            icon="📑"
          />
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <span style={{ color: "var(--muted)", marginRight: 15, fontSize: "14px" }}>Or enter data manually</span>
            <button className="btn outline" onClick={() => setIsModalOpen(true)}>+ Add Form</button>
          </div>
          <div className="table-card" style={{ marginTop: 40, opacity: 0.6, pointerEvents: "none" }}>
            <div className="table-header">
              <div className="table-title">Data Preview (Upload PDF to populate)</div>
            </div>
            <div className="table-scroll" style={{ overflowX: "auto" }}>
              <table className="stable" style={{ minWidth: 1200 }}>
                <thead>
                  <tr>
                    <th className="num-h">#</th>
                    <th>INVOICE NO</th>
                    <th>INVOICE DATE</th>
                    <th>IRN</th>
                    <th>BUYER GSTIN</th>
                    <th>SUPPLIER NAME</th>
                    <th>E-WAY BILL NO</th>
                    <th>VEHICLE NO</th>
                    <th>QUANTITY</th>
                    <th>TOTAL AMOUNT</th>
                    <th>Preview</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="12" style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                      Upload a PDF to view extracted data
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {view === "results" && data && (
        <InvoiceResults
          data={data}
          fileName={fileName}
          onReset={handleReset}
          onAddFiles={handleFiles}
          onExportJson={handleExportJson}
          onExportCsv={handleExportCsv}
          onSave={handleSave}
          onDeleteRow={handleDeleteRow}
          onUpdateRow={handleUpdateRow}
          onAddManual={() => setIsModalOpen(true)}
        />
      )}

      <EditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleManualAdd}
        title="Add Manual Entry"
        initialData={{}}
        columns={INVOICE_COLS}
      />
    </div>
  );
}
