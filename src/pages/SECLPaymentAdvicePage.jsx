import React, { useCallback, useState } from "react";
import Dropzone from "../components/Dropzone";
import SECLPaymentAdviceResults from "../components/SECLPaymentAdviceResults";
import EditModal from "../components/EditModal";
import { parseSECLPaymentAdvice } from "../utils/seclPaymentAdviceParser";

export default function SECLPaymentAdvicePage({ state, setState }) {
  const { view, loading, loadingName, error, data, fileName } = state;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleManualAdd = (formData) => {
    const qty = parseFloat(formData.quantity) || 1;
    const req = parseFloat(formData.requisitePayment);
    const grand = parseFloat(formData.grandTotal);
    const bid = parseFloat(formData.bidPrice);
    
    let grandPMT = !isNaN(grand) ? grand / qty : null;
    let incl50 = formData.incl50 ? parseFloat(formData.incl50) : (grandPMT !== null ? grandPMT + 50 : null);
    let inclTotal = formData.inclTotal ? parseFloat(formData.inclTotal) : (incl50 !== null ? incl50 * qty : null);
    
    const newItem = {
      isManual: true,
      minesName: formData.minesName || 'Not Found',
      customerName: formData.customerName || 'Not Found',
      quantity: isNaN(parseFloat(formData.quantity)) ? null : parseFloat(formData.quantity),
      requisitePayment: isNaN(req) ? null : req,
      grandTotal: isNaN(grand) ? null : grand,
      auctionDate: formData.auctionDate || 'Not Found',
      dueDate: formData.dueDate || 'Not Found',
      bidPrice: isNaN(bid) ? null : bid,
      pdfTcsTotal: formData.tcsAmount ? parseFloat(formData.tcsAmount) : 0,
      tcsAmount: formData.tcsAmount ? parseFloat(formData.tcsAmount) : 0,
      incl50,
      inclTotal
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
        const settledResults = await Promise.allSettled(
          files.map(async (file) => {
            const parsed = await parseSECLPaymentAdvice(file);
            parsed.fileName = file.name;
            parsed.pdfUrl = URL.createObjectURL(file);
            parsed.pdfName = file.name;
            return parsed;
          })
        );
        
        const successfulResults = [];
        const failedFiles = [];

        settledResults.forEach((result, idx) => {
          if (result.status === "fulfilled") {
            successfulResults.push(result.value);
          } else {
            failedFiles.push(files[idx].name);
            console.error("Error parsing", files[idx].name, result.reason);
          }
        });

        if (failedFiles.length > 0 && successfulResults.length === 0) {
          throw new Error("All uploaded files failed to parse. Make sure they are SECL Payment Advices.");
        }

        setState((s) => {
          const newData = s.data && Array.isArray(s.data) ? [...s.data, ...successfulResults] : successfulResults;
          const newFileName = s.fileName ? s.fileName + ", " + (files.length > 1 ? `${files.length} files` : files[0].name) : (files.length > 1 ? `${files.length}_files` : files[0].name);
          return {
            ...s, loading: false, data: newData, fileName: newFileName, view: "results",
          };
        });
        
        if (failedFiles.length > 0) {
          alert(`The following files failed to parse:\n\n${failedFiles.join("\n")}`);
        }
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

  const handleSave = () => {
    if (!data) return;
    localStorage.setItem("secl_payment_advice_data", JSON.stringify(data));
    alert("Data saved to LocalStorage successfully!");
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
      newData[index] = { ...newData[index], ...updatedRow };
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
            title="Upload SECL Payment Advice"
            icon="📑"
          />
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <span style={{ color: "var(--muted)", marginRight: 15, fontSize: "14px" }}>Or enter data manually</span>
            <button className="btn outline" onClick={() => setIsModalOpen(true)}>+ Add Form</button>
          </div>
          <div className="summary-section" style={{ marginTop: 40, opacity: 0.6, pointerEvents: "none" }}>
            <div className="summary-header">
              <div className="summary-title">Data Preview (Upload PDF to populate)</div>
            </div>
            <div className="summary-table-wrap">
              <table className="stable" id="summaryTable">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Mines Name</th>
                    <th>Customer Name</th>
                    <th>Quantity (MT)</th>
                    <th>Requisite Payment</th>
                    <th>Grand Total PMT</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
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
        <SECLPaymentAdviceResults
          data={data}
          fileName={fileName}
          onReset={handleReset}
          onAddFiles={handleFiles}
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
        columns={[
          { key: "minesName", label: "Mines Name" },
          { key: "customerName", label: "Customer Name" },
          { key: "quantity", label: "Quantity (MT)" },
          { key: "requisitePayment", label: "Requisite Payment (INR)" },
          { key: "grandTotal", label: "Grand Total (INR)" },
          { key: "auctionDate", label: "Auction Date" },
          { key: "dueDate", label: "Due Date" },
          { key: "bidPrice", label: "Bid Price PMT" },
          { key: "incl50", label: "Including 50 PMT Rate" },
          { key: "inclTotal", label: "Including 50 Total" },
          { key: "tcsAmount", label: "TCS Amount" }
        ]}
      />
    </div>
  );
}
