import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import type { InvoiceDoc } from "@/lib/invoice-doc";

type Props = {
  doc: InvoiceDoc;
  patch: (p: Partial<InvoiceDoc>) => void;
};

export function DocHeader({ doc, patch }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const pickLogo = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => patch({ logo: String(reader.result) });
    reader.readAsDataURL(file);
  };

  return (
    <header className="doc-header">
      {/* left: logo */}
      <div className="flex items-start">
        <div className="logo-slot">
          {doc.logo ? (
            <>
              <img src={doc.logo} alt={`${doc.companyName} logo`} />
              <button
                type="button"
                className="logo-remove print:hidden"
                onClick={() => patch({ logo: null })}
                aria-label="Remove logo"
              >
                <X className="size-3" />
              </button>
            </>
          ) : (
            <button
              type="button"
              className="logo-empty print:hidden"
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus className="size-5" />
              <span>Upload logo</span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => pickLogo(e.target.files?.[0])}
          />
        </div>
        {doc.logo && (
          <button
            type="button"
            className="ml-2 text-[11px] underline text-muted-foreground print:hidden"
            onClick={() => fileRef.current?.click()}
          >
            change
          </button>
        )}
      </div>

      {/* middle: company + doc type */}
      <div className="text-center">
        <AutoText
          value={doc.companyName}
          onChange={(v) => patch({ companyName: v })}
          className="field-inline company-name w-full text-center"
          placeholder="Company name"
          ariaLabel="Company name"
        />
        <div className="mt-1 flex items-center justify-center gap-2">
          <select
            value={doc.docType}
            onChange={(e) => patch({ docType: e.target.value as InvoiceDoc["docType"] })}
            className="field-inline doc-type-select"
          >
            <option value="Invoice">Invoice</option>
            <option value="Quotation">Quotation</option>
          </select>
        </div>
        <AutoText
          value={doc.companyAddress}
          onChange={(v) => patch({ companyAddress: v })}
          className="field-inline mt-1 w-full text-center text-xs"
          placeholder="Company address"
          ariaLabel="Company address"
        />
        <AutoText
          value={doc.gstNumber}
          onChange={(v) => patch({ gstNumber: v })}
          className="field-inline w-full text-center text-xs"
          placeholder="GST number"
          ariaLabel="GST number"
        />
      </div>

      {/* right: date + numbers */}
      <div className="flex flex-col items-end gap-1 text-xs">
        <label className="header-field">
          <span>Date</span>
          <input
            type="date"
            value={doc.date}
            onChange={(e) => patch({ date: e.target.value })}
            className="field-inline w-36 text-right"
          />
        </label>
        <label className="header-field">
          <span>{doc.docType === "Invoice" ? "Invoice No." : "Quotation No."}</span>
          <input
            value={doc.docType === "Invoice" ? doc.invoiceNumber : doc.quotationNumber}
            onChange={(e) =>
              patch(
                doc.docType === "Invoice"
                  ? { invoiceNumber: e.target.value }
                  : { quotationNumber: e.target.value },
              )
            }
            className="field-inline w-36 text-right"
          />
        </label>
      </div>
    </header>
  );
}
