import { useRef, useState } from "react";
import { Columns3, ImagePlus, Merge, Minus, Plus, Rows3, Split, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AutoText } from "@/components/invoice/AutoText";
import {
  addColumn,
  addRow,
  mergeRange,
  money,
  normalize,
  removeColumn,
  removeRow,
  srNumber,
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
  const drag = useRef<null | { kind: "col" | "row"; i: number; start: number; base: number }>(null);

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
  const setImage = (r: number, c: number, image: string | null) => {
    onChange({
      ...table,
      rows: table.rows.map((row, ri) =>
        ri === r
          ? { ...row, cells: row.cells.map((cl, ci) => (ci === c ? { ...cl, image } : cl)) }
          : row,
      ),
    });
  };

  const pickImage = (r: number, c: number, file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(r, c, String(reader.result));
    reader.readAsDataURL(file);
  };


  const setColLabel = (c: number, label: string) =>
    onChange({
      ...table,
      columns: table.columns.map((col, ci) => (ci === c ? { ...col, label } : col)),
    });

  const setColWidth = (c: number, width: number) =>
    onChange({
      ...table,
      columns: table.columns.map((col, ci) =>
        ci === c ? { ...col, width: Math.max(40, Math.round(width)) } : col,
      ),
    });

  const setRowHeight = (r: number, height: number) =>
    onChange({
      ...table,
      rows: table.rows.map((row, ri) =>
        ri === r ? { ...row, height: Math.max(28, Math.round(height)) } : row,
      ),
    });

  const startDrag = (
    e: React.PointerEvent,
    kind: "col" | "row",
    i: number,
    base: number,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    drag.current = { kind, i, start: kind === "col" ? e.clientX : e.clientY, base };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const delta = (d.kind === "col" ? e.clientX : e.clientY) - d.start;
    if (d.kind === "col") setColWidth(d.i, d.base + delta);
    else setRowHeight(d.i, d.base + delta);
  };

  const endDrag = () => {
    drag.current = null;
  };

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

      <table className="doc-table" onPointerMove={onMove} onPointerUp={endDrag}>
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
                <span
                  className="col-resize print:hidden"
                  title="Drag to resize column"
                  onPointerDown={(e) => startDrag(e, "col", c, col.width)}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, r) => (
            <tr key={row.id} style={row.height ? { height: row.height } : undefined}>
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
                    {c === 0 ? (
                      <span className="sr-cell tabular-nums">{srNumber(table, r) ?? ""}</span>
                    ) : (
                      <>
                        <AutoText
                          value={cell.text}
                          onChange={(v) => setCell(r, c, v)}
                          className={`cell-input ${c === lastCol ? "text-right tabular-nums" : ""}`}
                        />
                        {c !== lastCol && (
                          <>
                            <label
                              className="cell-image-add print:hidden"
                              title={cell.image ? "Replace image" : "Add image"}
                            >
                              <ImagePlus className="size-3.5" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => pickImage(r, c, e.target.files?.[0] ?? null)}
                              />
                            </label>
                            {cell.image && (
                              <div className="cell-media">
                                <div className="cell-image-wrap">
                                  <img
                                    src={cell.image}
                                    alt={cell.text || "Item image"}
                                    className="cell-image"
                                  />
                                  <button
                                    type="button"
                                    className="cell-image-del print:hidden"
                                    title="Delete image"
                                    onClick={() => setImage(r, c, null)}
                                  >
                                    <Trash2 className="size-3" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                      </>
                    )}
                    {c === 0 && (
                      <span
                        className="row-resize print:hidden"
                        title="Drag to resize row"
                        onPointerDown={(e) =>
                          startDrag(e, "row", r, row.height ?? (e.currentTarget.parentElement?.offsetHeight ?? 32))
                        }
                      />
                    )}
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
        Tip: click a cell then shift-click another to select a block and merge it. Drag the edge of a
        column header or the bottom of the first cell in a row to resize.
      </p>
    </section>
  );
}
