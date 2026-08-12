// Dependency-free ZIP builder that runs entirely in the browser.
// Produces a valid ZIP (stored / DEFLATE) and triggers a download — no reliance
// on the host serving a static .zip file.

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

async function deflateRaw(data: Uint8Array): Promise<Uint8Array | null> {
  if (typeof (globalThis as unknown as { CompressionStream?: unknown }).CompressionStream === 'undefined') return null;
  try {
    const cs = new CompressionStream('deflate-raw');
    const writer = cs.writable.getWriter();
    writer.write(data as unknown as Uint8Array<ArrayBuffer>);
    writer.close();
    const ab = await new Response(cs.readable).arrayBuffer();
    return new Uint8Array(ab);
  } catch {
    return null;
  }
}

function dosDateTime(d: Date) {
  const time = ((d.getHours() & 0x1f) << 11) | ((d.getMinutes() & 0x3f) << 5) | (Math.floor(d.getSeconds() / 2) & 0x1f);
  const date = (((d.getFullYear() - 1980) & 0x7f) << 9) | (((d.getMonth() + 1) & 0x0f) << 5) | (d.getDate() & 0x1f);
  return { time: time & 0xffff, date: date & 0xffff };
}

export interface ZipEntry { path: string; content: string }

export async function buildZip(entries: ZipEntry[]): Promise<Blob> {
  const enc = new TextEncoder();
  const now = new Date();
  const { time, date } = dosDateTime(now);

  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  const sorted = [...entries].sort((a, b) => a.path.localeCompare(b.path));

  for (const e of sorted) {
    const data = enc.encode(e.content);
    const crc = crc32(data);
    const deflated = await deflateRaw(data);
    const useStore = !deflated || deflated.length >= data.length;
    const body = useStore ? data : (deflated as Uint8Array);
    const method = useStore ? 0 : 8;
    const nameBuf = enc.encode(e.path);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true);
    local.setUint16(8, method, true);
    local.setUint16(10, time, true);
    local.setUint16(12, date, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, body.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, nameBuf.length, true);
    local.setUint16(28, 0, true);
    localParts.push(new Uint8Array(local.buffer), nameBuf, body);

    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, 0x02014b50, true);
    central.setUint16(4, 20, true);
    central.setUint16(6, 20, true);
    central.setUint16(8, 0x0800, true);
    central.setUint16(10, method, true);
    central.setUint16(12, time, true);
    central.setUint16(14, date, true);
    central.setUint32(16, crc, true);
    central.setUint32(20, body.length, true);
    central.setUint32(24, data.length, true);
    central.setUint16(28, nameBuf.length, true);
    central.setUint16(30, 0, true);
    central.setUint16(32, 0, true);
    central.setUint16(34, 0, true);
    central.setUint16(36, 0, true);
    central.setUint32(38, 0, true);
    central.setUint32(42, offset, true);
    centralParts.push(new Uint8Array(central.buffer), nameBuf);

    offset += 30 + nameBuf.length + body.length;
  }

  const centralSize = centralParts.reduce((s, p) => s + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, sorted.length, true);
  end.setUint16(10, sorted.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);

  const parts: BlobPart[] = [];
  for (const p of localParts) parts.push(p.slice().buffer);
  for (const p of centralParts) parts.push(p.slice().buffer);
  parts.push(end.buffer);
  return new Blob(parts, { type: 'application/zip' });
}

function inIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

// Robust download that also works inside sandboxed preview iframes (which
// silently block <a download> clicks). Returns true if a save/open was
// triggered, false if the caller should fall back to a data-URI approach.
export function saveBlob(blob: Blob, filename: string): boolean {
  const url = URL.createObjectURL(blob);

  // 1) Standard anchor download — works in a normal top-level tab.
  if (!inIframe()) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return true;
  }

  // 2) Inside an iframe: open the blob in a new top-level tab. The browser
  //    can't render a .zip, so it downloads it. Requires popups allowed.
  const win = window.open(url, '_blank');
  if (win) {
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return true;
  }

  // 3) Last resort: try navigating the top window to the blob URL.
  try {
    if (window.top) {
      window.top.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      return true;
    }
  } catch {
    /* cross-origin top — cannot navigate */
  }

  URL.revokeObjectURL(url);
  return false;
}
