function grab(text, regex) {
  const m = text.match(regex);
  return m ? m[1].trim() : "";
}

export function parseInvoiceText(rows) {
  const rawText = rows.join('\n');
  const lines = rows.map(l => l.trim()).filter(Boolean);
  const t = rawText.replace(/\s+/g,' ');

  if (!t.toUpperCase().includes("INVOICE") && !t.toUpperCase().includes("TAX INVOICE")) {
    throw new Error("Invalid Format: Uploaded file is not an Invoice PDF.");
  }

  const data = {};
  data.invoiceNo   = grab(t, /Invoice\s*No\.?\s*:?\s*([A-Za-z0-9\/\-]+)/i);
  data.invoiceDate = grab(t, /(?<!e-Way Bill\s)Date\s*:?\s*([0-9]{1,2}-[A-Za-z]{3}-[0-9]{2,4})/i);
  data.ewayBillNo  = grab(t, /E-?Way\s*Bill\s*No\.?\s*:?\s*([0-9]+)/i);
  data.irn         = grab(t, /IRN\s*:?\s*([a-z0-9]{50,80})/i);
  data.ackNo       = grab(t, /Ack\s*No\.?\s*:?\s*([0-9]+)/i);
  data.ackDate     = grab(t, /Ack\s*Date\s*:?\s*([0-9]{1,2}-[A-Za-z]{3}-[0-9]{2,4})/i);
  data.vehicleNo   = grab(t, /Vehicle(?:\s*No\.?)?\s*:?\s*([A-Z]{2}[0-9]{2}[A-Z]{1,3}[0-9]{3,4})/i);
  data.transport   = grab(t, /Transport\s*:?\s*(By\s*Road|By\s*Rail|By\s*Air|By\s*Ship)/i);
  data.placeOfSupply = grab(t, /Place\s*of\s*Supply\s*:?\s*([A-Za-z\-\s]+?)(?:\s*Terms|\s*Sl\b)/i);

  data.supplierName = grab(t, /(JAI\s*BHOLE\s*ENTERPRISES)/i) || grab(t, /^\s*INVOICE\s*(.*?)\s*3rd Floor/i);
  data.supplierGSTIN = grab(t, /GSTIN\s*No\.?\s*-\s*([0-9A-Z]{15})/i);
  data.supplierAddress = grab(t, /JAI BHOLE ENTERPRISES\s*(.*?)\s*Mo\.?:/i);
  data.supplierContact = grab(t, /Mo\.?:\s*([0-9]{10}),?\s*([\w\.\-]+@[\w\.\-]+)?/i);

  data.buyerName   = grab(t, /Billed to\)\s*(M\/s[^,]*?(?:Ltd\.|Limited|Pvt\.\s*Ltd\.))/i);
  data.buyerAddress = grab(t, /Billed to\)\s*M\/s[^,]*?(?:Ltd\.|Limited)\.?\s*(.*?)\s*GSTIN/i);
  const buyerGstins = [...t.matchAll(/GSTIN\s*No\.?\s*:?\s*([0-9A-Z]{15})/gi)].map(m=>m[1]);
  data.buyerGSTIN = buyerGstins.find(g => g !== data.supplierGSTIN) || '';
  data.buyerPAN   = grab(t, /Pan\s*No\.?\s*:?\s*([A-Z]{5}[0-9]{4}[A-Z])/i);

  data.bankName = grab(t, /Bank\s*Name\s*:?\s*([A-Za-z\s]+?)\s*A\/c/i);
  data.bankAccount = grab(t, /A\/c\s*No\.?\s*:?\s*([0-9]+)/i);
  data.ifsc = grab(t, /IFS\s*Code\s*:?\s*.*?([A-Z]{4}0[0-9A-Z]{6})/i) || grab(t, /([A-Z]{4}0[0-9A-Z]{6})/);

  data.totalAmount = grab(t, /Total\s*(?:[0-9.,]+\s*MT)?\s*(?:₹|ī|Rs\.?)\s*([0-9,]+\.[0-9]{2})/i)
                    || grab(t, /Total\s*Inv\s*Amt\s*:?\s*([0-9,]+\.[0-9]{2})/i);
  data.amountInWords = grab(t, /Amount Chargeable.*?in words\)\s*(Indian Rupees[^E]*?)(?:E\.\s*&\s*O\.E|$)/i);

  data.cgst = grab(t, /CGST\s*Amt\.?\s*:?\s*([0-9,]+\.[0-9]{2})/i) || grab(t, /Central Goods and Service Tax\s*([0-9,]+\.[0-9]{2})/i);
  data.sgst = grab(t, /SGST\s*Amt\.?\s*:?\s*([0-9,]+\.[0-9]{2})/i) || grab(t, /State Goods and Service Tax\s*([0-9,]+\.[0-9]{2})/i);
  data.taxableAmt = grab(t, /Tot\.?\s*Taxable\s*Amt\s*:?\s*([0-9,]+\.[0-9]{2})/i);
  data.roundOff = grab(t, /Round\s*Off\s*(\(?-?\)?\s*[0-9]+\.[0-9]{2})/i);
  data.totalQuantity = grab(t, /Total\s+([0-9.,]+\s*MT)/i);

  // Goods rows: scan reconstructed lines (handles single or multiple line items)
  data.goods = [];
  const rowPattern = /^\s*\d+\s+(.+?)\s+(\d{4,8})\s+(\d{1,2}\s*%)\s+([\d.,]+\s*[A-Za-z]+)\s+([\d,]+\.\d{2})\s*[A-Za-z]*\s+([\d,]+\.\d{2})\s*$/;
  lines.forEach(line => {
    const m = line.match(rowPattern);
    if (m){
      data.goods.push({
        description: m[1].trim(),
        hsn: m[2],
        gstRate: m[3].replace(/\s+/g,''),
        quantity: m[4],
        rate: m[5],
        amount: m[6]
      });
    }
  });

  // Fallback: single-line-item invoices where the flattened text still has the pattern
  if (data.goods.length === 0){
    const goodsMatch = t.match(/([A-Za-z][A-Za-z\s]*Hsn\s*[0-9]+)\s*([0-9]{6,8})\s*([0-9]+\s*%)\s*([0-9.,]+\s*MT)\s*([0-9,]+\.[0-9]{2})\s*MT\s*([0-9,]+\.[0-9]{2})/i);
    if (goodsMatch){
      data.goods.push({
        description: goodsMatch[1].trim(),
        hsn: goodsMatch[2],
        gstRate: goodsMatch[3],
        quantity: goodsMatch[4],
        rate: goodsMatch[5],
        amount: goodsMatch[6]
      });
    }
  }

  if (data.goods.length === 0 && !data.invoiceNo) {
    throw new Error("Invalid Format: Uploaded file is not a valid Invoice PDF (No invoice items found).");
  }

  return data;
}

export const INVOICE_COLS = [
  { key: "invoiceNo", label: "INVOICE NO" },
  { key: "invoiceDate", label: "INVOICE DATE" },
  { key: "irn", label: "IRN" },
  { key: "buyerName", label: "BUYER NAME" },
  { key: "buyerGSTIN", label: "BUYER GSTIN" },
  { key: "supplierName", label: "SUPPLIER NAME" },
  { key: "ewayBillNo", label: "E-WAY BILL NO" },
  { key: "vehicleNo", label: "VEHICLE NO" },
  { key: "totalQuantity", label: "QUANTITY" },
  { key: "totalAmount", label: "TOTAL AMOUNT" },
];

export function toInvoiceCSV(data) {
  const dataArray = Array.isArray(data) ? data : [data];
  
  const headers = ["PDF Index", ...INVOICE_COLS.map(c => c.label)];
  const rows = [headers];

  dataArray.forEach((d, index) => {
    const row = [index + 1];
    INVOICE_COLS.forEach(c => {
      row.push(d[c.key] || "");
    });
    rows.push(row);
  });

  return rows.map(r => r.map(c => `"${(c || "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
}
