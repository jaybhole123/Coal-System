import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

// Point pdf.js at the correct worker
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * Extracts raw text from PDF for regex matching
 */
export async function extractTextFromPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText;
}

function matchOne(text, regex) {
  const m = text.match(regex);
  return m ? m[1].trim() : '';
}

/**
 * Parses raw text from a Sales Order PDF into structured JSON
 */
export function parseSalesOrder(text) {
  const clean = text.replace(/\s+/g, ' ');

  if (!clean.toUpperCase().includes("SALES ORDER") && !clean.toUpperCase().includes("DELIVERY ORDER")) {
    throw new Error("Invalid Format: Uploaded file is not a Sales Order PDF.");
  }

  const data = {
    document_type: matchOne(clean, /(SALES ORDER)/i),
    company: {
      name: matchOne(clean, /(South Eastern Coalfields Limited)/i),
      address: matchOne(clean, /SECL HQ,\s*([^]+?)\s*IN\b/i),
      gst: matchOne(clean, /GST\s*:\s*([0-9A-Z,]+)/i),
      office_area: matchOne(clean, /Office Area\s*:\s*([A-Za-z0-9 ]+?)(?=Telephone|Fax|E-Mail)/i)
    },
    sold_to_party: {
      code: matchOne(clean, /Sold to Party\s*:\s*(\d+)/i),
      name: matchOne(clean, /Sold to Party[^N]*Name\s*:\s*([A-Z .&]+?)(?=Address)/i),
      address: matchOne(clean, /Sold to Party[\s\S]*?Address:\s*([^]+?)(?=Destination|Sold to Party:|Customer Code)/i)
    },
    receiver: {
      customer_code: matchOne(clean, /Receiver \(Billed To\)[\s\S]*?Customer Code:\s*(\d+)/i),
      name: matchOne(clean, /Receiver \(Billed To\)[\s\S]*?Name\s*:\s*([A-Z .&]+?)(?=Address)/i),
      district: matchOne(clean, /District:\s*([A-Za-z]+)/i),
      state: matchOne(clean, /State\s*:\s*([A-Za-z]+)/i),
      gstin: matchOne(clean, /GSTIN\s*:\s*([0-9A-Z]+)/i)
    },
    order_info: {
      sales_order_number: matchOne(clean, /Sales Order Number\s*:\s*(\d+)/i),
      sales_order_date: matchOne(clean, /Sales Order Date\s*:\s*([A-Za-z]+ \d{1,2},\s*\d{4})/i),
      contract_number: matchOne(clean, /Contract Number\s*:\s*(\d+)/i),
      sales_order_valid_from: matchOne(clean, /Sales Order Valid From\s*:\s*([A-Za-z]+ \d{1,2},\s*\d{4})/i),
      sales_order_valid_to: matchOne(clean, /Sales Order Valid To\s*:\s*([A-Za-z]+ \d{1,2},\s*\d{4})/i),
      month: matchOne(clean, /Month\s*:\s*(\d+)/i),
      bid_id: matchOne(clean, /Bid ID\s*:\s*(\d+)/i),
      bidder_id: matchOne(clean, /Bidder ID\s*:\s*(\d+)/i),
      service_provider: matchOne(clean, /Service Provider\s*:\s*([A-Za-z]+)/i),
      scheme_name: matchOne(clean, /Scheme Name\s*:\s*([A-Za-z\- ]+?)(?=Auction Date)/i),
      auction_date: matchOne(clean, /Auction Date\s*:\s*([\d.A-Za-z]+)/i),
      contract_signing_date: matchOne(clean, /Contract Signing Date\s*:\s*([\d.A-Za-z]+)/i),
      contract_expiry_date: matchOne(clean, /Contract Expiry Date\s*:\s*([\d.A-Za-z]+)/i),
      mode_of_transport: matchOne(clean, /Mode of Transport\s*:\s*([A-Za-z]+)/i),
      type_of_consumer: matchOne(clean, /Type of Consumer\s*:\s*([A-Za-z]+)/i),
      destination: matchOne(clean, /Destination:\s*([A-Za-z ]+?)(?=Service Provider)/i)
    },
    mine_info: {
      area: matchOne(clean, /Area\s*:\s*([A-Z]+)/i),
      mine: matchOne(clean, /Mine\s*:\s*(\d+)/i),
      grade_desc: matchOne(clean, /Grade Desc\s*:\s*([A-Z0-9]+)/i),
      size: matchOne(clean, /Size\s*:\s*([\-0-9A-Z ]+?)(?=Name of Commodity)/i),
      commodity: matchOne(clean, /Name of Commodity\s*:\s*([A-Za-z\- ]+?)(?=STC Distance)/i),
      stc_distance: matchOne(clean, /STC Distance:\s*([0-9.]+)/i),
      ztcs_applicable: matchOne(clean, /ZTCS Applicable\s*:\s*([A-Za-z]+)/i),
      quantity_words: matchOne(clean, /Quantity\s*:\s*([A-Z ]+?)(?=Unit Names|Tranche)/i)
    },
    line_items: [],
    pricing: [],
    bank_details: [],
    totals: {
      so_value_grand_total: matchOne(clean, /SO Value\(Grand Total including EMD\)\s*([0-9.]+)\s*([0-9.]+)/i),
      requisite_payment: matchOne(clean, /Requisite Payment \(Rounded up\)\s*([0-9.]+)\s*([0-9.]+)/i),
      total_amount: matchOne(clean, /TOTAL\s*:\s*([0-9.]+)/i),
      total_in_words: matchOne(clean, /Total Sale Order Value In words\s*:\s*([^]+?)(?=GST collected)/i),
      gst_to_deposit: matchOne(clean, /GST collected to be deposited as per govt guidelines RS:\s*([0-9.]+)/i)
    }
  };

  // Line item row (Line Item, Mine, Material, Description, HSN, Unit, Qty)
  const lineItemMatch = clean.match(/(\d+)\s+([A-Z ]+OC)\s+(\d{6,})\s+([A-Z\- ]+COAL)\s+(\d{6,})\s+(TE)\s+([\d,]+)/i);
  if (lineItemMatch) {
    data.line_items.push({
      line_item: lineItemMatch[1],
      mine: lineItemMatch[2].trim(),
      material: lineItemMatch[3],
      material_description: lineItemMatch[4].trim(),
      hsn_code: lineItemMatch[5],
      unit: lineItemMatch[6],
      quantity: lineItemMatch[7]
    });
  }

  // Pricing particulars — label, rate, amount
  const pricingLabels = [
    'Basic Price','Sizing Charges','STC Charges','Evac Facility Charge',
    'Royalty Charges','NMEDT Charges','DMF','Adho Sanrachna Vikas',
    'Pariyavaran Upkar','Terminal Tax','Assessable Value','CGST','SGST',
    'TCS','SO Value\\(Grand Total including EMD\\)','Less EMD \\(Per TE\\)',
    'Requisite Payment \\(Rounded up\\)'
  ];
  pricingLabels.forEach(label => {
    const re = new RegExp(label.replace(/\(/g,'\\(').replace(/\)/g,'\\)') + '[^0-9]*([\\d.]+)\\s+([\\d.]+)');
    const m = clean.match(re);
    if (m) {
      data.pricing.push({
        description: label.replace(/\\/g,''),
        rate_per_te: m[1],
        amount: m[2]
      });
    }
  });

  // Bank details
  const emdMatch = clean.match(/EMD\s+([A-Za-z]+ \d{1,2},\s*\d{4})\s+([\d.]+)/i);
  if (emdMatch) {
    data.bank_details.push({ type: 'EMD', utr: '', date_of_payment: emdMatch[1], document_no: '', bank_name: '', amount: emdMatch[2] });
  }
  const ftMatch = clean.match(/FT\s+(\d+)\s+([A-Za-z]+ \d{1,2},\s*\d{4})\s+(\d+)\s+([A-Za-z ]+?)\s+([\d.]+)/i);
  if (ftMatch) {
    data.bank_details.push({ type: 'FT', utr: ftMatch[1], date_of_payment: ftMatch[2], document_no: ftMatch[3], bank_name: ftMatch[4].trim(), amount: ftMatch[5] });
  }

  if (data.line_items.length === 0) {
    throw new Error("Invalid Format: Uploaded file is not a valid Sales Order PDF (No line items found).");
  }

  return data;
}

/**
 * Convert parsed JSON structure into flat CSV
 */
export function toCSVSalesOrder(data) {
  const dataArray = Array.isArray(data) ? data : [data];
  const rows = [['PDF Index', 'Field', 'Value']];
  
  function flatten(idx, obj, prefix = '') {
    Object.entries(obj).forEach(([k, v]) => {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        flatten(idx, v, prefix + k + '.');
      } else if (Array.isArray(v)) {
        v.forEach((item, i) => {
          if (typeof item === 'object') {
            Object.entries(item).forEach(([kk, vv]) => {
              rows.push([idx + 1, `${prefix}${k}[${i}].${kk}`, vv]);
            });
          } else {
            rows.push([idx + 1, `${prefix}${k}[${i}]`, item]);
          }
        });
      } else {
        rows.push([idx + 1, prefix + k, v]);
      }
    });
  }
  
  dataArray.forEach((d, i) => flatten(i, d));
  return rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
}

/**
 * Downloads a Blob to the user's device
 */
export function downloadBlob(content, fileName, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
