import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

// Point pdf.js at the correct worker
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

// Known column x-anchors for the SECL "Mode Agnostic e-Auction" winners table (PDF points, top-left origin).
export const COLS = [
  {x: 32,  label: 'Seller Name'},
  {x: 61,  label: 'Auction Id'},
  {x: 90,  label: 'Source Name'},
  {x: 119, label: 'Grade / Size'},
  {x: 163, label: 'Remark'},
  {x: 195, label: 'Offer Qty'},
  {x: 224, label: 'Unbooked Qty'},
  {x: 263, label: 'Mode'},
  {x: 292, label: 'Floor Price'},
  {x: 321, label: 'Quantity Allotted'},
  {x: 358, label: 'Winning Bid Price (Rs/MT)'},
  {x: 409, label: 'Unique Bid Id'},
  {x: 445, label: 'Premium % Over Notified Price'},
  {x: 480, label: 'Bid Rank'},
  {x: 509, label: 'Feeding Colliery Details' }
];

function nearestCol(x){
  let best = COLS[0], bestDist = Math.abs(COLS[0].x - x);
  for(const c of COLS){
    const d = Math.abs(c.x - x);
    if(d < bestDist){ best = c; bestDist = d; }
  }
  return best.label;
}

function grab(re, text){
  const m = text.match(re);
  return m ? m[1].trim() : '';
}

export function parseMeta(text){
  return {
    'Bidder Registration Number': grab(/Bidder Registration Number:\s*(\d+)/, text),
    'Name of Bidder': grab(/Name of the Bidder:\s*(.*?)Contact Person:/, text),
    'Contact Person': grab(/Contact Person:\s*(.*?)Address:/, text),
    'Address': grab(/Address:\s*(.*?)(PAN:)/, text),
    'PAN': grab(/PAN:\s*([A-Z0-9]+)/, text),
    'GST': grab(/CGST:\s*([A-Z0-9]+)/, text),
    'Auction Number': grab(/Auction Number:\s*(\d+)/, text),
    'Date of Auction': grab(/Date of Auction:\s*([0-9A-Za-z, ]+?)Third Party Sampling/, text),
    'Third Party Sampling': grab(/Third Party Sampling:\s*(YES|NO)/, text)
  };
}

export function parseTable(allItems){
  const rowStarts = allItems
    .filter(it => it.str.trim().toUpperCase().startsWith('SECL') && it.x < 60)
    .sort((a,b) => a.page - b.page || a.y - b.y);

  if(rowStarts.length === 0){
    return [];
  }

  const rows = [];
  for(let i=0; i<rowStarts.length; i++){
    const start = rowStarts[i];
    const next = rowStarts[i+1];
    
    const rowItems = allItems.filter(it => {
      if(it.page !== start.page) return false;
      if(it.y < start.y - 0.5) return false;
      if(next && it.page === next.page && it.y >= next.y - 0.5) return false;
      return true;
    });

    const buckets = {};
    COLS.forEach(c => buckets[c.label] = []);
    rowItems
      .sort((a,b) => a.y - b.y || a.x - b.x)
      .forEach(it => {
        const col = nearestCol(it.x);
        buckets[col].push(it.str);
      });

    const rowObj = {};
    COLS.forEach(c => {
      let val = buckets[c.label].join(' ').replace(/\s+/g,' ').trim();
      if (c.label === 'Seller Name' && val.toUpperCase().startsWith('SECL')) {
        val = 'SECL';
      }
      rowObj[c.label] = val;
    });
    rows.push(rowObj);
  }
  return rows;
}

export async function extractSECLData(file) {
  const buf = await file.arrayBuffer();
  let pdf;
  try{
    pdf = await pdfjsLib.getDocument({data: buf}).promise;
  }catch(workerErr){
    console.warn('Worker load failed, retrying without worker:', workerErr);
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    pdf = await pdfjsLib.getDocument({data: buf, disableWorker: true}).promise;
  }

  let fullText = '';
  let allItems = []; 

  for(let p=1; p<=pdf.numPages; p++){
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({scale:1, rotation: page.rotate});
    const content = await page.getTextContent();
    content.items.forEach(it => {
      if(!it.str || !it.str.trim()) return;
      const [vx, vy] = viewport.convertToViewportPoint(it.transform[4], it.transform[5]);
      allItems.push({
        str: it.str,
        x: vx,
        y: vy,
        page: p
      });
    });
    fullText += content.items.map(it => it.str).join(' ') + '\n';
  }
  
  fullText = fullText.replace(/\s+/g,' ').trim();
  
  if (!fullText.toUpperCase().includes("INTIMATION") && !fullText.toUpperCase().includes("SOUTH EASTERN COALFIELDS")) {
    throw new Error("Invalid Format: Uploaded file is not a SECL Intimation PDF.");
  }

  const meta = parseMeta(fullText);
  const items = parseTable(allItems);

  if (items.length === 0) {
    throw new Error("Invalid Format: Uploaded file is not a valid SECL Intimation PDF (No table data found).");
  }

  return { meta, items, rawText: fullText };
}

export function toSECLCSV(cols, items) {
  const labels = cols.map(c => c.label);
  let csv = labels.map(c => `"${c}"`).join(',') + '\n';
  items.forEach(r => {
    csv += labels.map(c => `"${String(r[c] ?? '').replace(/"/g,'""')}"`).join(',') + '\n';
  });
  return csv;
}
