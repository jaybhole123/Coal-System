import { useCallback } from "react";
import Dropzone from "../components/Dropzone";
import Results from "../components/Results";
import { extractRows, parsePaymentAdvice, toCSV, downloadBlob } from "../utils/pdfParser";

/**
 * PaymentAdvicePage — owns the upload/result state for this page.
 * Props: state & setState passed from App so navigating away and back preserves data.
 */
export default function PaymentAdvicePage({ state, setState }) {
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
            return parsePaymentAdvice(rows);
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
    downloadBlob(JSON.stringify(data, null, 2), fileName.replace(/\.pdf$/i, "") + ".json", "application/json");
  };

  const handleExportCsv = () => {
    if (!data) return;
    downloadBlob(toCSV(data), fileName.replace(/\.pdf$/i, "") + ".csv", "text/csv");
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
      
      // Map flat updatedRow back to nested data structure
      const item = { ...newData[index] };
      item.receiver = {
        ...item.receiver,
        customerCode: updatedRow.customerCode,
        customerName: updatedRow.customerName,
        gstin: updatedRow.gstin,
      };
      item.areaOffice = updatedRow.areaOffice;
      item.contract = {
        ...item.contract,
        salesDocNo: updatedRow.salesDocNo,
        salesOrderDate: updatedRow.salesOrderDate,
        paymentDueDate: updatedRow.paymentDueDate,
        auctionDateRef: updatedRow.auctionDateRef,
      };
      item.material = {
        ...item.material,
        materialCode: updatedRow.materialCode,
        description: updatedRow.description,
        quantity: updatedRow.quantity,
      };
      item.totals = {
        ...item.totals,
        requisitePayment: updatedRow.requisitePayment ? updatedRow.requisitePayment.replace(/[^0-9.]/g, "") : null,
      };
      
      newData[index] = item;
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
            title="Upload Payment Advice"
            icon="💵"
          />
          <div className="summary-section" style={{ marginTop: 40, opacity: 0.6, pointerEvents: "none" }}>
            <div className="summary-header">
              <div className="summary-title">Data Preview (Upload PDF to populate)</div>
            </div>
            <div className="summary-table-wrap">
              <table className="stable" id="summaryTable">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Customer Code</th>
                    <th>Customer Name</th>
                    <th>GSTIN</th>
                    <th>Area Office</th>
                    <th>Sales Doc No</th>
                    <th>Valid to Date</th>
                    <th>Sales Order Date</th>
                    <th>Grade</th>
                    <th>Payment Due Date</th>
                    <th>GCV</th>
                    <th>Auction Date &amp; Ref</th>
                    <th>Area</th>
                    <th>Mat. Code</th>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th className="num-h">Requisite Payment (INR)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="18" style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
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
        <Results
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
