import { useCallback, useState } from "react";
import Dropzone from "../components/Dropzone";
import SalesOrderResults from "../components/SalesOrderResults";
import EditModal from "../components/EditModal";
import { extractTextFromPdf, parseSalesOrder, toCSVSalesOrder, downloadBlob } from "../utils/salesOrderParser";

/**
 * SalesOrderPage — owns the upload/result state for this page.
 * Props: state & setState passed from App so navigating away and back preserves data.
 */
export default function SalesOrderPage({ state, setState }) {
  const { view, loading, loadingName, error, data, fileName } = state;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleManualAdd = (formData) => {
    const newItem = {
      pdfUrl: formData.pdfFile ? URL.createObjectURL(formData.pdfFile) : null,
      pdfName: formData.pdfFile ? formData.pdfFile.name : "Manual Entry",
      sold_to_party: { name: formData.name },
      order_info: { 
        sales_order_number: formData.sales_order_number,
        sales_order_valid_from: formData.sales_order_valid_from,
        sales_order_valid_to: formData.sales_order_valid_to
      },
      mine_info: {
        area: formData.office_area,
        mine: formData.mine
      },
      line_items: [{ quantity: formData.quantity, mine: formData.mine }],
      pricing: [{ description: "Requisite Payment", rate_per_te: formData.rate_per_te, amount: formData.amount }],
      totals: { requisite_payment: formData.amount }
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
            const text = await extractTextFromPdf(file);
            const parsed = parseSalesOrder(text);
            parsed.pdfUrl = URL.createObjectURL(file);
            parsed.pdfName = file.name;
            return parsed;
          })
        );

        const successfulResults = [];
        const failedFiles = [];

        settledResults.forEach((res, index) => {
          if (res.status === "fulfilled") {
            successfulResults.push(res.value);
          } else {
            failedFiles.push(files[index].name);
            console.error(`Failed to parse ${files[index].name}:`, res.reason);
          }
        });

        if (failedFiles.length > 0) {
          // We will show these in the UI instead of an alert
        }

        if (successfulResults.length === 0) {
          setState((s) => ({
            ...s,
            loading: false,
            error: "None of the uploaded files were valid Sales Order PDFs.",
          }));
          return;
        }

        setState((s) => {
          const newData = s.data && Array.isArray(s.data) ? [...s.data, ...successfulResults] : successfulResults;
          
          let newFileName = s.fileName || "";
          if (successfulResults.length > 0) {
             const addedNames = successfulResults.length > 1 ? `${successfulResults.length} files` : successfulResults[0].pdfName;
             newFileName = newFileName ? `${newFileName}, ${addedNames}` : addedNames;
          }

          return {
            ...s, loading: false, data: newData, fileName: newFileName, view: "results", error: null, failedFiles
          };
        });
      } catch (err) {
        console.error(err);
        setState((s) => ({
          ...s,
          loading: false,
          error: "An unexpected error occurred while processing files.",
        }));
      }
    },
    [setState]
  );

  const handleReset = () =>
    setState({ view: "drop", loading: false, loadingName: "", error: null, data: null, fileName: "" });

  const handleExportJson = () => {
    if (!data) return;
    downloadBlob(JSON.stringify(data, null, 2), fileName.replace(/\.pdf$/i, "") + "_sales_order.json", "application/json");
  };

  const handleSave = () => {
    if (!data) return;
    localStorage.setItem("sales_order_data", JSON.stringify(data));
    alert("Data saved to LocalStorage successfully!");
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
      
      // Update nested objects safely
      item.receiver = { ...item.receiver, name: updatedRow.name };
      item.sold_to_party = { ...item.sold_to_party, name: updatedRow.name };
      item.company = { ...item.company, office_area: updatedRow.office_area };
      item.mine_info = { ...item.mine_info, mine: updatedRow.mine };
      
      item.order_info = { 
        ...item.order_info, 
        sales_order_number: updatedRow.sales_order_number,
        sales_order_valid_from: updatedRow.sales_order_valid_from,
        sales_order_valid_to: updatedRow.sales_order_valid_to
      };
      
      if (item.line_items && item.line_items.length > 0) {
        item.line_items[0] = {
          ...item.line_items[0],
          quantity: updatedRow.quantity,
          mine: updatedRow.mine
        };
      }
      
      // Find Requisite Payment row to update
      if (item.pricing && item.pricing.length > 0) {
        const reqIndex = item.pricing.findIndex(p => p.description?.toLowerCase().includes("requisite payment"));
        if (reqIndex !== -1) {
          item.pricing[reqIndex] = {
            ...item.pricing[reqIndex],
            rate_per_te: updatedRow.rate_per_te,
            amount: updatedRow.amount
          };
        } else {
          // Fallback, update the first pricing item
          item.pricing[0] = {
            ...item.pricing[0],
            rate_per_te: updatedRow.rate_per_te,
            amount: updatedRow.amount
          };
        }
      }

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
            title="Upload Sales Order PDF"
            icon="📄"
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
                    <th>Name</th>
                    <th>Sales Order Number</th>
                    <th>Sales Order Valid From</th>
                    <th>Sales Order Valid To</th>
                    <th>Office Area</th>
                    <th>Quantity</th>
                    <th>Mine</th>
                    <th className="num">Rate Per TE(INR)</th>
                    <th className="num">Amount(INR)</th>
                    <th>Left Days</th>
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
        <SalesOrderResults
          data={data}
          fileName={fileName}
          failedFiles={state.failedFiles}
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
        columns={[
          { key: "name", label: "Name" },
          { key: "sales_order_number", label: "Sales Order Number" },
          { key: "sales_order_valid_from", label: "Sales Order Valid From" },
          { key: "sales_order_valid_to", label: "Sales Order Valid To" },
          { key: "office_area", label: "Office Area" },
          { key: "quantity", label: "Quantity" },
          { key: "mine", label: "Mine" },
          { key: "rate_per_te", label: "Rate Per TE(INR)" },
          { key: "amount", label: "Amount(INR)" },
        ]}
      />
    </div>
  );
}