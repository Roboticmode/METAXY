import { cn } from "@/components/ui";

export type MetaxyMarkProps = {
  /** Pixel size of the mark. Defaults to 20. */
  size?: number;
  /** Surface behind the mark: "dark" floats transparently, "light" wraps in an obsidian tile for contrast. */
  tone?: "dark" | "light";
  className?: string;
};

/**
 * Scaled METAXY sculpted crescent-ring brand mark.
 * Matches the app favicon / icon.png in orientation and tone across light and dark surfaces.
 */
export function MetaxyMark({ size = 20, tone = "light", className }: MetaxyMarkProps) {
  const src = size > 48 ? "/brand/metaxy-mark.png" : "/brand/metaxy-mark-128.png";

  if (tone === "dark") {
    return (
      <img
        src={src}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={cn("shrink-0 select-none object-contain", className)}
      />
    );
  }

  const pad = Math.max(2, Math.round(size * 0.14));
  const inner = Math.max(10, size - pad * 2);

  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, padding: pad }}
      className={cn(
        "inline-grid shrink-0 select-none place-items-center rounded-[24%] bg-[#0a0d08] ring-1 ring-black/10",
        className,
      )}
    >
      <img
        src={src}
        alt=""
        width={inner}
        height={inner}
        style={{ width: inner, height: inner }}
        className="block object-contain"
      />
    </span>
  );
}
