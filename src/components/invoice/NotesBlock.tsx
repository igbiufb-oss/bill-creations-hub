import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AutoText } from "@/components/invoice/AutoText";
import type { NoteSection } from "@/lib/invoice-doc";

type Props = {
  section: NoteSection;
  index: number;
  onChange: (s: NoteSection) => void;
  onRemove: () => void;
};

/**
 * Numbered notes / terms list. Pressing Enter inside a line creates the next
 * numbered line automatically (like a Word numbered list).
 */
export function NotesBlock({ section, index, onChange, onRemove }: Props) {
  const setItem = (i: number, text: string) =>
    onChange({ ...section, items: section.items.map((it, j) => (j === i ? text : it)) });

  const insertAfter = (i: number) => {
    const items = [...section.items];
    items.splice(i + 1, 0, "");
    onChange({ ...section, items });
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLTextAreaElement>(
        `[data-note="${section.id}-${i + 1}"] textarea`,
      );
      el?.focus();
    });
  };

  const removeItem = (i: number) => {
    const items = section.items.filter((_, j) => j !== i);
    onChange({ ...section, items: items.length ? items : [""] });
  };

  return (
    <section className="notes-block">
      <div className="flex items-center gap-2">
        <input
          value={section.title}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
          className="field-inline block-label w-64"
          placeholder={`Notes / Terms ${index + 1}`}
          aria-label="Notes section title"
        />
        <Button variant="ghost" size="sm" className="print:hidden" onClick={onRemove}>
          <Trash2 /> Section
        </Button>
      </div>

      <ol className="notes-list">
        {section.items.map((item, i) => (
          <li key={`${section.id}-${i}`} data-note={`${section.id}-${i}`} className="notes-item">
            <span className="notes-num tabular-nums">{i + 1}.</span>
            <AutoText
              value={item}
              onChange={(v) => setItem(i, v)}
              onEnter={() => insertAfter(i)}
              className="field-inline w-full text-sm"
              placeholder="Type a term, press Enter for the next point"
              ariaLabel={`Note ${i + 1}`}
            />
            {section.items.length > 1 && (
              <button
                type="button"
                className="notes-del print:hidden"
                onClick={() => removeItem(i)}
                aria-label={`Remove note ${i + 1}`}
              >
                <X className="size-3" />
              </button>
            )}
          </li>
        ))}
      </ol>

      <Button
        variant="ghost"
        size="sm"
        className="print:hidden"
        onClick={() => insertAfter(section.items.length - 1)}
      >
        <Plus /> Point
      </Button>
    </section>
  );
}
