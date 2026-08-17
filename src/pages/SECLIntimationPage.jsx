import { useCallback } from "react";
import Dropzone from "../components/Dropzone";
import SECLIntimationResults from "../components/SECLIntimationResults";
import { extractSECLData, toSECLCSV, COLS } from "../utils/seclParser";
import { downloadBlob } from "../utils/pdfParser";

/**
 * SECLIntimationPage — owns the upload/result state for this page.
 */
export default function SECLIntimationPage({ state, setState }) {
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
            return extractSECLData(file);
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
            "Failed to read PDF. (" +
            (err?.message ?? "unknown error") +
            ")",
        }));
      }
    },
    [setState]
  );

  const handleReset = () =>
    setState((s) => ({ ...s, view: "drop", loading: false, loadingName: "", error: null }));

  const handleExportJson = () => {
    if (!data) return;
    downloadBlob(JSON.stringify(data, null, 2), fileName.replace(/\.pdf$/i, "") + "_secl.json", "application/json");
  };

  const handleExportCsv = () => {
    if (!data) return;
    const allItems = data.flatMap((d, index) => d.items.map(item => ({ pdfIndex: index + 1, ...d.details, ...item })));
    downloadBlob(toSECLCSV(COLS, allItems), fileName.replace(/\.pdf$/i, "") + "_secl.csv", "text/csv");
  };

  const handleDeleteRow = (index) => {
    setState((s) => {
      const newData = [...s.data];
      let currentIndex = 0;
      for (let i = 0; i < newData.length; i++) {
        const itemsCount = newData[i].items ? newData[i].items.length : 0;
        if (index >= currentIndex && index < currentIndex + itemsCount) {
          const itemIndex = index - currentIndex;
          const newItems = [...newData[i].items];
          newItems.splice(itemIndex, 1);
          newData[i] = { ...newData[i], items: newItems };
          break;
        }
        currentIndex += itemsCount;
      }
      // Check if all items across all PDFs are empty
      const hasAnyItems = newData.some(d => d.items && d.items.length > 0);
      if (!hasAnyItems) {
        return { ...s, view: "drop", data: null, fileName: "" };
      }
      return { ...s, data: newData };
    });
  };

  const handleUpdateRow = (index, updatedRow) => {
    setState((s) => {
      const newData = [...s.data];
      let currentIndex = 0;
      for (let i = 0; i < newData.length; i++) {
        const itemsCount = newData[i].items ? newData[i].items.length : 0;
        if (index >= currentIndex && index < currentIndex + itemsCount) {
          const itemIndex = index - currentIndex;
          const newItems = [...newData[i].items];
          newItems[itemIndex] = updatedRow;
          newData[i] = { ...newData[i], items: newItems };
          break;
        }
        currentIndex += itemsCount;
      }
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
            title="Upload SECL PDF"
            icon="📄"
          />
          <div className="summary-section" style={{ marginTop: 40, opacity: 0.6, pointerEvents: "none" }}>
            <div className="summary-header">
              <div className="summary-title">Data Preview (Upload PDF to populate)</div>
            </div>
            <div className="summary-table-wrap">
              <table className="stable">
                <thead>
                  <tr>
                    <th>Name of Bidder</th>
                    <th>Date of Auction</th>
                    <th>Seller Name</th>
                    <th>Source Name</th>
                    <th>Grade / Size</th>
                    <th>Quantity Allotted</th>
                    <th>Winning Bid Price Rs/MT</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
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
        <SECLIntimationResults
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
