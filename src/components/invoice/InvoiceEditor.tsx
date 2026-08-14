import { useMemo, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocHeader } from "@/components/invoice/DocHeader";
import { EditableTable } from "@/components/invoice/EditableTable";
import { AutoText } from "@/components/invoice/AutoText";
import { NotesBlock } from "@/components/invoice/NotesBlock";
import {
  makeNoteSection,
  makeTable,
  money,
  tableAmount,
  type InvoiceDoc,
} from "@/lib/invoice-doc";

type Props = {
  doc: InvoiceDoc;
  onChange: (doc: InvoiceDoc) => void;
  toolbar?: ReactNode;
};

export function InvoiceEditor({ doc, onChange, toolbar }: Props) {
  const patch = (p: Partial<InvoiceDoc>) => onChange({ ...doc, ...p });

  const subtotal = useMemo(() => doc.tables.reduce((s, t) => s + tableAmount(t), 0), [doc.tables]);
  const gst = (subtotal * doc.gstRate) / 100;

  return (
    <div className="pb-24">
      {toolbar}

      <div className="paper">
        <DocHeader doc={doc} patch={patch} />

        <section className="client-block">
          <AutoText
            value={doc.clientName}
            onChange={(v) => patch({ clientName: v })}
            className="field-inline w-full text-base font-medium"
            placeholder="Client name"
            ariaLabel="Client name"
          />
          <AutoText
            value={doc.clientAddress}
            onChange={(v) => patch({ clientAddress: v })}
            className="field-inline w-full text-sm"
            placeholder="Client address, GSTIN, phone"
            ariaLabel="Client address"
          />
        </section>

        <div className="space-y-8">
          {doc.tables.map((table, i) => (
            <EditableTable
              key={table.id}
              table={table}
              index={i}
              onChange={(t) =>
                patch({ tables: doc.tables.map((old) => (old.id === t.id ? t : old)) })
              }
              onRemove={() => patch({ tables: doc.tables.filter((old) => old.id !== table.id) })}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3 print:hidden">
          <Button
            variant="secondary"
            onClick={() =>
              patch({ tables: [...doc.tables, makeTable(`Items ${doc.tables.length + 1}`)] })
            }
          >
            <Plus /> Add another table
          </Button>
          <span className="text-xs text-muted-foreground">
            {doc.tables.length} table{doc.tables.length === 1 ? "" : "s"} in this document
          </span>
        </div>

        <section className="totals">
          <div className="totals-row">
            <span>Subtotal (all tables)</span>
            <span className="tabular-nums">{money(subtotal)}</span>
          </div>
          <div className="totals-row">
            <span className="flex items-center gap-1">
              GST
              <input
                type="number"
                value={doc.gstRate}
                min={0}
                max={100}
                step={0.5}
                onChange={(e) => patch({ gstRate: Number(e.target.value) })}
                className="field-inline w-14 text-right"
              />
              %
            </span>
            <span className="tabular-nums">{money(gst)}</span>
          </div>
          <div className="totals-row grand">
            <span>Grand total</span>
            <span className="tabular-nums">₹ {money(subtotal + gst)}</span>
          </div>
        </section>

        <div className="notes-wrap">
          {doc.noteSections.map((section, i) => (
            <NotesBlock
              key={section.id}
              section={section}
              index={i}
              onChange={(s) =>
                patch({
                  noteSections: doc.noteSections.map((old) => (old.id === s.id ? s : old)),
                })
              }
              onRemove={() =>
                patch({ noteSections: doc.noteSections.filter((old) => old.id !== section.id) })
              }
            />
          ))}
          <Button
            variant="secondary"
            size="sm"
            className="print:hidden"
            onClick={() =>
              patch({
                noteSections: [
                  ...doc.noteSections,
                  makeNoteSection(`Notes / Terms ${doc.noteSections.length + 1}`),
                ],
              })
            }
          >
            <Plus /> Add notes section
          </Button>
        </div>
      </div>
    </div>
  );
}

export function docTotal(doc: InvoiceDoc) {
  const subtotal = doc.tables.reduce((s, t) => s + tableAmount(t), 0);
  return subtotal + (subtotal * doc.gstRate) / 100;
}
