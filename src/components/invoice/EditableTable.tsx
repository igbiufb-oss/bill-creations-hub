import { useState } from "react";
import { Columns3, Merge, Minus, Plus, Rows3, Split, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  addColumn,
  addRow,
  mergeRange,
  money,
  normalize,
  removeColumn,
  removeRow,
  tableAmount,
  unmergeAt,
  type InvoiceTable,
} from "@/lib/invoice-doc";

type Props = {
  table: InvoiceTable;
  index: number;
  onChange: (t: InvoiceTable) => void;
  onRemove: () => void;
};

type Pos = { r: number; c: number };

export function EditableTable({ table, index, onChange, onRemove }: Props) {
  const [anchor, setAnchor] = useState<Pos | null>(null);
  const [focus, setFocus] = useState<Pos | null>(null);

  const range = anchor && focus ? normalize(anchor, focus) : null;
  const inRange = (r: number, c: number) =>
    !!range && r >= range.r1 && r <= range.r2 && c >= range.c1 && c <= range.c2;

  const setCell = (r: number, c: number, text: string) => {
    onChange({
      ...table,
      rows: table.rows.map((row, ri) =>
        ri === r
          ? { ...row, cells: row.cells.map((cl, ci) => (ci === c ? { ...cl, text } : cl)) }
          : row,
      ),
    });
  };

  const setColLabel = (c: number, label: string) =>
    onChange({
      ...table,
      columns: table.columns.map((col, ci) => (ci === c ? { ...col, label } : col)),
    });

  const lastCol = table.columns.length - 1;

  return (
    <section className="doc-table-block">
      <div className="mb-2 flex flex-wrap items-center gap-2 print:hidden">
        <input
          value={table.title}
          onChange={(e) => onChange({ ...table, title: e.target.value })}
          className="field-inline w-52 font-medium"
          placeholder={`Table ${index + 1}`}
        />
        <div className="toolbar">
          <Button variant="ghost" size="sm" onClick={() => onChange(addRow(table))}>
            <Rows3 /> <Plus className="!size-3" /> Row
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onChange(removeRow(table))}>
            <Rows3 /> <Minus className="!size-3" /> Row
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onChange(addColumn(table))}>
            <Columns3 /> <Plus className="!size-3" /> Col
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onChange(removeColumn(table))}>
            <Columns3 /> <Minus className="!size-3" /> Col
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!range}
            onClick={() => {
              if (range) onChange(mergeRange(table, range));
              setAnchor(null);
              setFocus(null);
            }}
          >
            <Merge /> Merge
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!anchor}
            onClick={() => {
              if (anchor) onChange(unmergeAt(table, anchor.r, anchor.c));
            }}
          >
            <Split /> Unmerge
          </Button>
        </div>
        <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={table.ownTotal}
            onChange={(e) => onChange({ ...table, ownTotal: e.target.checked })}
          />
          Show this table&apos;s own total
        </label>
        <Button variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 /> Table
        </Button>
      </div>

      <table className="doc-table">
        <colgroup>
          {table.columns.map((col) => (
            <col key={col.id} style={{ width: col.width }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {table.columns.map((col, c) => (
              <th key={col.id}>
                <input
                  value={col.label}
                  onChange={(e) => setColLabel(c, e.target.value)}
                  className="cell-input font-semibold"
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, r) => (
            <tr key={row.id}>
              {row.cells.map((cell, c) =>
                cell.hidden ? null : (
                  <td
                    key={cell.id}
                    colSpan={cell.colSpan}
                    rowSpan={cell.rowSpan}
                    data-selected={inRange(r, c) || undefined}
                    onMouseDown={(e) => {
                      if (e.shiftKey && anchor) {
                        setFocus({ r, c });
                      } else {
                        setAnchor({ r, c });
                        setFocus({ r, c });
                      }
                    }}
                  >
                    <textarea
                      rows={1}
                      value={cell.text}
                      onChange={(e) => setCell(r, c, e.target.value)}
                      className={`cell-input ${c === lastCol ? "text-right tabular-nums" : ""}`}
                    />
                  </td>
                ),
              )}
            </tr>
          ))}
          {table.ownTotal && (
            <tr className="total-row">
              <td colSpan={Math.max(1, table.columns.length - 1)}>Table total</td>
              <td className="text-right tabular-nums">{money(tableAmount(table))}</td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="mt-1 text-[11px] text-muted-foreground print:hidden">
        Tip: click a cell, then shift-click another to select a block and merge it.
      </p>
    </section>
  );
}
