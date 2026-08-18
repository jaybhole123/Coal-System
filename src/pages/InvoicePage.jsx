import { useState, useCallback } from "react";
import Dropzone from "../components/Dropzone";
import InvoiceResults from "../components/InvoiceResults";
import { extractRows, downloadBlob } from "../utils/pdfParser";
import { parseInvoiceText, toInvoiceCSV } from "../utils/invoiceParser";

export default function InvoicePage({ state, setState }) {
  const { view, loading, loadingName, error, data, fileName } = state;

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
            return parseInvoiceText(rows);
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
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="11" style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
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
          onDeleteRow={handleDeleteRow}
          onUpdateRow={handleUpdateRow}
        />
      )}
    </div>
  );
}
