import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

// Point pdf.js at the correct worker
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/* ─────────────────────────────────────────────
   Row reconstruction (position-aware)
───────────────────────────────────────────── */
export async function extractRows(file) {
  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  const allRows = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();

    const items = content.items
      .filter((it) => it.str && it.str.trim().length > 0)
      .map((it) => ({ str: it.str, x: it.transform[4], y: it.transform[5] }));

    const rows = [];
    const tolerance = 2.5;
    for (const item of items) {
      let row = rows.find((r) => Math.abs(r.y - item.y) <= tolerance);
      if (!row) { row = { y: item.y, items: [] }; rows.push(row); }
      row.items.push(item);
    }

    rows.sort((a, b) => b.y - a.y);
    for (const row of rows) {
      row.items.sort((a, b) => a.x - b.x);
      const text = row.items.map((i) => i.str).join(" ").replace(/\s+/g, " ").trim();
      if (text) allRows.push(text);
    }
  }

  return allRows;
}

/* ─────────────────────────────────────────────
   Field-parsing helpers
───────────────────────────────────────────── */
function afterLabel(row, label) {
  if (!row) return null;
  const idx = row.indexOf(label);
  if (idx === -1) return null;
  let rest = row.slice(idx + label.length);
  rest = rest.replace(/^\s*:\s*/, "").trim();
  return rest || null;
}

function findRow(rows, label) {
  return rows.find((r) => r.includes(label));
}

function num(str) {
  if (str === null || str === undefined) return null;
  const cleaned = String(str).replace(/,/g, "").trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

/* ─────────────────────────────────────────────
   Main parser
───────────────────────────────────────────── */
export function parsePaymentAdvice(rows) {
  const get = (label) => afterLabel(findRow(rows, label), label);

  const areaOffice = get("Area Office");

  // Customer codes (receiver + consignee on same row)
  const customerCodeRow = findRow(rows, "Customer Code");
  let receiverCustomerCode = null, consigneeCustomerCode = null;
  if (customerCodeRow) {
    const matches = [...customerCodeRow.matchAll(/Customer Code\s*:\s*(\S+)/g)];
    receiverCustomerCode = matches[0]?.[1] ?? null;
    consigneeCustomerCode = matches[1]?.[1] ?? null;
  }

  // Customer names
  const customerNameRow = findRow(rows, "Customer Name");
  let receiverCustomerName = null, consigneeCustomerName = null;
  if (customerNameRow) {
    const parts = customerNameRow.split(/Customer Name\s*:\s*/).slice(1);
    receiverCustomerName = parts[0]?.trim() || null;
    consigneeCustomerName = parts[1]?.trim() || null;
  }

  // GSTINs
  const gstinRow = rows.find((r) => r.trim().startsWith("GSTIN") && r.includes(":"));
  let receiverGstin = null, consigneeGstin = null;
  if (gstinRow) {
    const matches = [...gstinRow.matchAll(/GSTIN\s*:\s*(\S+)/g)];
    receiverGstin = matches[0]?.[1] ?? null;
    consigneeGstin = matches[1]?.[1] ?? null;
  }

  // Contract fields
  const contractNumber    = get("Contract Number");
  const salesDocNo        = get("Sales Doc No");
  const salesOrderDate    = get("Sales Order Date");
  const piNumber          = get("PI Number");
  const piDate            = get("PI Date");
  const paymentDueDate    = get("Payment due Date");
  const yearMonth         = get("Year Month");
  const bidId             = get("Bid ID");
  const schemeName        = get("Scheme Name");
  const auctionDateRef    = get("Auction Date & Reference");
  const contractSignDate  = get("Contract sign date");
  const validToDate       = get("Valid to Date");
  const quantityAllocated = get("Quantity Allocated");
  const typeOfConsumer    = get("Type of Consumer");
  const modeOfTransport   = get("Mode of Transport");

  // Colliery details
  const area = (() => {
    const row = rows.find((r) => / Area\s*:/.test(r) && !r.includes("Area Office"));
    return afterLabel(row, "Area");
  })();
  const colliery    = get("Colliery");
  const grade       = get("Grade");
  const size        = get("Size");
  const stcDistance = get("STC Distance");
  const gcv         = get("GCV");

  // Material line item
  const materialRow = rows.find((r) => /^\d{10}\s/.test(r.trim()));
  let material = null;
  if (materialRow) {
    const m = materialRow.match(
      /^(\d{10})\s+(.+?)\s+([\d,]+)\s+(\d+)\s+(TE|MT|KG)\s+([\d,]+\.\d{2})$/
    );
    if (m) {
      material = {
        materialCode: m[1],
        description: m[2].trim(),
        quantity: num(m[3]),
        hsnCode: m[4],
        unit: m[5],
        amount: num(m[6]),
      };
    }
  }

  // Pricing particulars
  const pricingLabels = [
    "Basic Price", "Sizing Charges", "STC Charges", "Evac Facility Charge",
    "Royalty Charges", "NMEDT Charges", "DMF", "Adho Sanrachna Vikas",
    "Pariyavaran Upkar", "CGST", "SGST", "IGST", "TCS",
    "Grand Total including EMD", "Less EMD", "Requisite Payment",
  ];

  const particulars = [];
  for (const row of rows) {
    const trimmed = row.trim();
    const label = pricingLabels.find((l) => trimmed.startsWith(l));
    if (!label) continue;
    const nums = trimmed.match(/[\d,]+\.\d{2}|-?[\d,]+\.\d+|\d[\d,]*/g) || [];
    if (nums.length < 2) continue;
    const amount = num(nums[nums.length - 1]);
    const rate   = num(nums[nums.length - 2]);
    particulars.push({
      label: trimmed.replace(/\s+\d[\s\S]*$/, "").trim() || label,
      rate,
      amount,
    });
  }

  const grandTotal       = particulars.find((p) => p.label.includes("Grand Total"))?.amount ?? null;
  const emdDeduction     = particulars.find((p) => p.label.startsWith("Less EMD"))?.amount ?? null;
  const requisitePayment = particulars.find((p) => p.label.startsWith("Requisite Payment"))?.amount ?? null;

  const totalValueWords = afterLabel(
    findRow(rows, "Total Value in Words"),
    "Total Value in Words"
  );

  return {
    areaOffice,
    receiver: { customerCode: receiverCustomerCode, customerName: receiverCustomerName, gstin: receiverGstin },
    consignee: { customerCode: consigneeCustomerCode, customerName: consigneeCustomerName, gstin: consigneeGstin },
    contract: {
      contractNumber, salesDocNo, salesOrderDate, piNumber, piDate, paymentDueDate,
      yearMonth, bidId, schemeName, auctionDateRef, contractSignDate, validToDate,
      quantityAllocated: num(quantityAllocated), typeOfConsumer, modeOfTransport,
    },
    colliery: { area, colliery, grade, size, stcDistance, gcv },
    material,
    particulars,
    totals: { grandTotal, emdDeduction, requisitePayment },
    totalValueWords,
  };
}

/* ─────────────────────────────────────────────
   Export helpers
───────────────────────────────────────────── */
export function toCSV(data) {
  const rows = [["Section", "Field", "Value"]];
  const push = (section, field, value) => rows.push([section, field, value ?? ""]);

  push("Header", "Area Office", data.areaOffice);
  push("Receiver", "Customer Code", data.receiver.customerCode);
  push("Receiver", "Customer Name", data.receiver.customerName);
  push("Receiver", "GSTIN", data.receiver.gstin);
  push("Consignee", "Customer Code", data.consignee.customerCode);
  push("Consignee", "Customer Name", data.consignee.customerName);
  push("Consignee", "GSTIN", data.consignee.gstin);
  Object.entries(data.contract).forEach(([k, v]) => push("Contract", k, v));
  Object.entries(data.colliery).forEach(([k, v]) => push("Colliery", k, v));
  if (data.material) Object.entries(data.material).forEach(([k, v]) => push("Material", k, v));
  data.particulars.forEach((p) =>
    push("Particulars", p.label, `rate:${p.rate ?? ""} amount:${p.amount ?? ""}`)
  );
  push("Totals", "Grand Total incl. EMD", data.totals.grandTotal);
  push("Totals", "EMD Deduction", data.totals.emdDeduction);
  push("Totals", "Requisite Payment", data.totals.requisitePayment);
  push("Totals", "Amount in Words", data.totalValueWords);

  return rows
    .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
