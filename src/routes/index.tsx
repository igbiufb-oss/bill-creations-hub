import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FilePlus2, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocHeader } from "@/components/invoice/DocHeader";
import { EditableTable } from "@/components/invoice/EditableTable";
import { AutoText } from "@/components/invoice/AutoText";
import { NotesBlock } from "@/components/invoice/NotesBlock";
import {
  emptyDoc,
  makeNoteSection,
  makeTable,
  money,
  tableAmount,
  type InvoiceDoc,
} from "@/lib/invoice-doc";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Invoice & Quotation Builder with GST | LedgerLeaf" },
      {
        name: "description",
        content:
          "Create GST invoices and quotations like a Word document: repeating company header, editable tables with merge, auto-save and one-click PDF download.",
      },
      { property: "og:title", content: "Invoice & Quotation Builder with GST | LedgerLeaf" },
      {
        property: "og:description",
        content:
          "Word-style invoice maker: logo header on every page, mergeable item tables, GST totals, auto-save and PDF export.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Builder,
});

const KEY = "ledgerleaf.doc.v1";

function Builder() {
  const [doc, setDoc] = useState<InvoiceDoc>(emptyDoc);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // load saved draft (client only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as InvoiceDoc;
        const merged = { ...emptyDoc(), ...saved };
        if (!merged.noteSections?.length) {
          merged.noteSections = [
            {
              ...makeNoteSection(),
              items: (saved.notes || "").split("\n").length
                ? (saved.notes || "").split("\n")
                : [""],
            },
          ];
        }
        setDoc(merged);
      }
    } catch {
      /* ignore corrupt draft */
    }
    setReady(true);
  }, []);

  // auto-save
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(doc));
        setSavedAt(new Date().toLocaleTimeString());
      } catch {
        /* storage full */
      }
    }, 600);
    return () => clearTimeout(t);
  }, [doc, ready]);

  const patch = (p: Partial<InvoiceDoc>) => setDoc((d) => ({ ...d, ...p }));

  const subtotal = useMemo(
    () => doc.tables.reduce((s, t) => s + tableAmount(t), 0),
    [doc.tables],
  );
  const gst = (subtotal * doc.gstRate) / 100;

  return (
    <main className="min-h-screen bg-muted/40 pb-24">
      {/* action bar */}
      <div className="app-bar print:hidden">
        <span className="brand">LedgerLeaf</span>
        <span className="text-xs text-muted-foreground">
          {savedAt ? (
            <>
              <Save className="mr-1 inline size-3" /> Auto-saved {savedAt}
            </>
          ) : (
            "Auto-save on"
          )}
        </span>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => patch({ tables: [...doc.tables, makeTable(`Items ${doc.tables.length + 1}`)] })}
          >
            <Plus /> Add table
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm("Start a new blank document? Current draft will be replaced.")) {
                setDoc(emptyDoc());
              }
            }}
          >
            <FilePlus2 /> New
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Download /> Download PDF
          </Button>
        </div>
      </div>

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
              onRemove={() =>
                patch({ tables: doc.tables.filter((old) => old.id !== table.id) })
              }
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
    </main>
  );
}
