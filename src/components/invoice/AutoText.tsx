type Props = {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
};

/**
 * Auto-growing text field. A hidden "ghost" copy of the text sets the height,
 * so nothing is ever clipped — on screen or in print/PDF.
 */
export function AutoText({ value, onChange, className = "", placeholder, ariaLabel }: Props) {
  return (
    <div className="auto-text">
      <span className="auto-text-ghost" aria-hidden="true">
        {value || placeholder || " "}
        {"\n"}
      </span>
      <textarea
        rows={1}
        value={value}
        aria-label={ariaLabel}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={className}
      />
    </div>
  );
}
