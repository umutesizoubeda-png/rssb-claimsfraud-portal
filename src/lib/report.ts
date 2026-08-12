// Central Africa Time (CAT = UTC+2, no DST) timestamp formatting.
export function formatCAT(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const cat = new Date(d.getTime() + 2 * 3600000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${cat.getUTCFullYear()}-${pad(cat.getUTCMonth() + 1)}-${pad(cat.getUTCDate())} ${pad(cat.getUTCHours())}:${pad(cat.getUTCMinutes())}:${pad(cat.getUTCSeconds())} CAT`;
}

export function catFileStamp(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const cat = new Date(d.getTime() + 2 * 3600000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${cat.getUTCFullYear()}${pad(cat.getUTCMonth() + 1)}${pad(cat.getUTCDate())}_${pad(cat.getUTCHours())}${pad(cat.getUTCMinutes())}${pad(cat.getUTCSeconds())}`;
}

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const content = rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// PDF export via a print-optimized popup window (no external deps).
export function printPDF(title: string, bodyHtml: string) {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: #0f172a; margin: 32px; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    h2 { font-size: 14px; margin: 24px 0 8px; color: #047857; border-bottom: 2px solid #10b981; padding-bottom: 4px; }
    .meta { color: #64748b; font-size: 12px; margin-bottom: 16px; }
    .badge { display:inline-block; background:#10b981; color:#052e16; font-weight:800; font-size:11px; padding:4px 8px; border-radius:6px; letter-spacing:0.5px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 6px; }
    th { background: #f1f5f9; text-align: left; padding: 6px 8px; border: 1px solid #e2e8f0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.4px; color: #475569; }
    td { padding: 6px 8px; border: 1px solid #e2e8f0; vertical-align: top; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 8px; }
    .kpi { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
    .kpi .label { font-size: 10px; text-transform: uppercase; color: #64748b; letter-spacing: 0.4px; }
    .kpi .value { font-size: 18px; font-weight: 700; margin-top: 4px; }
    .flag { color: #b45309; font-size: 10px; }
    .trail { color: #475569; font-size: 10px; }
    .footer { margin-top: 28px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    @media print { body { margin: 12mm; } }
  </style></head><body>${bodyHtml}
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); };</script>
  </body></html>`);
  w.document.close();
}
