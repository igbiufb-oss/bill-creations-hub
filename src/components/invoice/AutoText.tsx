type Props = {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
  /** when set, Enter does not insert a newline but calls this instead */
  onEnter?: () => void;
};

/**
 * Auto-growing text field. A hidden "ghost" copy of the text (same classes, so
 * same font metrics) sets the height, so nothing is ever clipped — on screen or
 * in print/PDF.
 */
export function AutoText({
  value,
  onChange,
  className = "",
  placeholder,
  ariaLabel,
  onEnter,
}: Props) {
  return (
    <div className="auto-text">
      <span className={`auto-text-ghost ${className}`} aria-hidden="true">
        {value || placeholder || " "}
        {"\n"}
      </span>
      <textarea
        rows={1}
        value={value}
        aria-label={ariaLabel}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (onEnter && e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onEnter();
          }
        }}
        className={className}
      />
    </div>
  );
}
