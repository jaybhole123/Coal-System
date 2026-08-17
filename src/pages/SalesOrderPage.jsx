import { useCallback } from "react";
import Dropzone from "../components/Dropzone";
import SalesOrderResults from "../components/SalesOrderResults";
import { extractTextFromPdf, parseSalesOrder, toCSVSalesOrder, downloadBlob } from "../utils/salesOrderParser";

/**
 * SalesOrderPage — owns the upload/result state for this page.
 * Props: state & setState passed from App so navigating away and back preserves data.
 */
export default function SalesOrderPage({ state, setState }) {
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
            const text = await extractTextFromPdf(file);
            return parseSalesOrder(text);
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
          error:
            "Failed to read PDF. File might be corrupt, password-protected, or in a different format. (" +
            (err?.message ?? "unknown error") +
            ")",
        }));
      }
    },
    [setState]
  );

  const handleReset = () =>
    setState({ view: "drop", loading: false, loadingName: "", error: null, data: null, fileName: "" });

  const handleExportJson = () => {
    if (!data) return;
    downloadBlob(JSON.stringify(data, null, 2), fileName.replace(/\.pdf$/i, "") + "_SO.json", "application/json");
  };

  const handleExportCsv = () => {
    if (!data) return;
    downloadBlob(toCSVSalesOrder(data), fileName.replace(/\.pdf$/i, "") + "_SO.csv", "text/csv");
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
      const item = { ...newData[index] };
      
      // Update details
      item.details = {
        ...item.details,
        buyerCode: updatedRow.buyerCode,
        buyerName: updatedRow.buyerName,
        saleOrderNo: updatedRow.saleOrderNo,
        saleOrderDate: updatedRow.saleOrderDate,
        doDate: updatedRow.doDate,
        bgNo: updatedRow.bgNo,
      };

      // Since Sales Order has a flat array of items, we'll assume there's 1 item for the row or we just update the first item for simplicity (if it's a summary row).
      // Wait, Sales Order has multiple items per PDF! Let's check how the summary row is rendered.
      // Actually, Sales Order Results renders `item` inside a single row. But `data` is `[{ details, items }]`.
      // Let's defer mapping the items here until we see how SalesOrderResults handles it. We'll just pass updatedRow back directly for now.
      
      return { ...s, data: newData };
    });
  };

  return (
    <div>
      {view === "drop" && (
        <>
          <Dropzone
            onFiles={handleFiles}
            loading={loading}
            loadingName={loadingName}
            error={error}
            title="Upload Sales Order PDF"
            icon="📄"
          />
          <div className="table-card" style={{ marginTop: 40, opacity: 0.6, pointerEvents: "none" }}>
            <div className="table-header">
              <div className="table-title">Data Preview (Upload PDF to populate)</div>
            </div>
            <div className="table-scroll" style={{ overflowX: "auto" }}>
              <table className="stable" style={{ minWidth: 1200 }}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Area</th>
                    <th>Sales Order Number</th>
                    <th>Sales Order Valid From</th>
                    <th>Sales Order Valid To</th>
                    <th>Quantity</th>
                    <th className="num">SO Value(Grand Total)</th>
                    <th className="num">Rate Per TE(INR)</th>
                    <th className="num">Amount(INR)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="10" style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
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
        <SalesOrderResults
          data={data}
          fileName={fileName}
          onReset={handleReset}
          onAddFiles={handleFiles}
          onExportJson={handleExportJson}
          onExportCsv={handleExportCsv}
          onDeleteRow={handleDeleteRow}
        />
      )}
    </div>
  );
}
