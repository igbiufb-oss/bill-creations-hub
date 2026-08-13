export type Cell = {
  id: string;
  text: string;
  colSpan: number;
  rowSpan: number;
  hidden: boolean;
  /** optional picture pasted/uploaded into the cell (data URL) */
  image?: string | null;
};

export type Row = { id: string; cells: Cell[]; height?: number };

export type Column = { id: string; label: string; width: number };

export type InvoiceTable = {
  id: string;
  title: string;
  columns: Column[];
  rows: Row[];
  ownTotal: boolean;
};

export type NoteSection = { id: string; title: string; items: string[] };

export type InvoiceDoc = {
  docType: "Invoice" | "Quotation";
  logo: string | null;
  companyName: string;
  companyAddress: string;
  gstNumber: string;
  date: string;
  invoiceNumber: string;
  quotationNumber: string;
  clientName: string;
  clientAddress: string;
  tables: InvoiceTable[];
  gstRate: number;
  notes: string;
  noteSections: NoteSection[];
};

export const uid = () => Math.random().toString(36).slice(2, 10);

export const makeCell = (text = ""): Cell => ({
  id: uid(),
  text,
  colSpan: 1,
  rowSpan: 1,
  hidden: false,
});

export function makeTable(title = "Items"): InvoiceTable {
  const columns: Column[] = [
    { id: uid(), label: "Sr.", width: 60 },
    { id: uid(), label: "Product / Description", width: 320 },
    { id: uid(), label: "Qty", width: 80 },
    { id: uid(), label: "Rate", width: 100 },
    { id: uid(), label: "Amount", width: 120 },
  ];
  const rows: Row[] = Array.from({ length: 3 }, () => ({
    id: uid(),
    cells: columns.map(() => makeCell()),
  }));
  return { id: uid(), title, columns, rows, ownTotal: false };
}

export function emptyDoc(): InvoiceDoc {
  return {
    docType: "Invoice",
    logo: null,
    companyName: "Your Company Name",
    companyAddress: "Shop / Street, City, State - PIN",
    gstNumber: "GSTIN: 00AAAAA0000A1Z0",
    date: new Date().toISOString().slice(0, 10),
    invoiceNumber: "INV-001",
    quotationNumber: "QTN-001",
    clientName: "",
    clientAddress: "",
    tables: [makeTable()],
    gstRate: 18,
    notes: "",
  };
}

export const num = (v: string) => {
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/** Sum of the last (amount) column of a table. */
export function tableAmount(table: InvoiceTable): number {
  const last = table.columns.length - 1;
  return table.rows.reduce((sum, row) => {
    const cell = row.cells[last];
    return cell && !cell.hidden ? sum + num(cell.text) : sum;
  }, 0);
}

/**
 * Auto serial number for a row: counts visible Sr. cells above it, so numbering
 * stays correct after adding/removing rows or merging cells.
 */
export function srNumber(table: InvoiceTable, r: number): number | null {
  const cell = table.rows[r]?.cells[0];
  if (!cell || cell.hidden) return null;
  let n = 0;
  for (let i = 0; i <= r; i++) {
    const c0 = table.rows[i]?.cells[0];
    if (c0 && !c0.hidden) n++;
  }
  return n;
}

export const money = (n: number) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ---------- structural edits ---------- */

export function addRow(table: InvoiceTable): InvoiceTable {
  return {
    ...table,
    rows: [...table.rows, { id: uid(), cells: table.columns.map(() => makeCell()) }],
  };
}

export function removeRow(table: InvoiceTable): InvoiceTable {
  if (table.rows.length <= 1) return table;
  return { ...table, rows: table.rows.slice(0, -1) };
}

export function addColumn(table: InvoiceTable): InvoiceTable {
  // insert before the amount (last) column so amount stays last
  const at = Math.max(1, table.columns.length - 1);
  const columns = [...table.columns];
  columns.splice(at, 0, { id: uid(), label: "New column", width: 120 });
  const rows = table.rows.map((row) => {
    const cells = [...row.cells];
    cells.splice(at, 0, makeCell());
    return { ...row, cells };
  });
  return { ...table, columns, rows };
}

export function removeColumn(table: InvoiceTable): InvoiceTable {
  if (table.columns.length <= 2) return table;
  const at = Math.max(1, table.columns.length - 2);
  const columns = table.columns.filter((_, i) => i !== at);
  const rows = table.rows.map((row) => ({
    ...row,
    cells: row.cells.filter((_, i) => i !== at),
  }));
  return { ...table, columns, rows };
}

export type Range = { r1: number; c1: number; r2: number; c2: number };

export function normalize(a: { r: number; c: number }, b: { r: number; c: number }): Range {
  return {
    r1: Math.min(a.r, b.r),
    c1: Math.min(a.c, b.c),
    r2: Math.max(a.r, b.r),
    c2: Math.max(a.c, b.c),
  };
}

export function mergeRange(table: InvoiceTable, range: Range): InvoiceTable {
  const { r1, c1, r2, c2 } = range;
  if (r1 === r2 && c1 === c2) return table;
  const texts: string[] = [];
  const rows = table.rows.map((row, r) => ({
    ...row,
    cells: row.cells.map((cell, c) => {
      const inside = r >= r1 && r <= r2 && c >= c1 && c <= c2;
      if (!inside) return cell;
      if (r === r1 && c === c1) return cell;
      if (cell.text.trim()) texts.push(cell.text.trim());
      return { ...cell, text: "", hidden: true, colSpan: 1, rowSpan: 1 };
    }),
  }));
  const anchorRow = rows[r1];
  const anchor = anchorRow?.cells[c1];
  if (!anchorRow || !anchor) return { ...table, rows };
  rows[r1] = {
    ...anchorRow,
    cells: anchorRow.cells.map<Cell>((cell, c) =>
      c === c1
        ? {
            ...anchor,
            hidden: false,
            colSpan: c2 - c1 + 1,
            rowSpan: r2 - r1 + 1,
            text: [anchor.text.trim(), ...texts].filter(Boolean).join(" "),
          }
        : cell,
    ),
  };
  return { ...table, rows };
}

export function unmergeAt(table: InvoiceTable, r: number, c: number): InvoiceTable {
  const cell = table.rows[r]?.cells[c];
  if (!cell || (cell.colSpan === 1 && cell.rowSpan === 1)) return table;
  const r2 = r + cell.rowSpan - 1;
  const c2 = c + cell.colSpan - 1;
  const rows = table.rows.map((row, ri) => ({
    ...row,
    cells: row.cells.map((cl, ci) => {
      if (ri < r || ri > r2 || ci < c || ci > c2) return cl;
      if (ri === r && ci === c) return { ...cl, colSpan: 1, rowSpan: 1 };
      return { ...cl, hidden: false };
    }),
  }));
  return { ...table, rows };
}
