// Initials avatar used in the sidebar user card and the login demo cards.
export function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md";
}) {
  const dimension = size === "sm" ? "h-8 w-8 text-[11px]" : "h-10 w-10 text-xs";
  return (
    <span
      className={`inline-flex ${dimension} shrink-0 items-center justify-center rounded-full bg-brand/10 font-semibold text-brand-dark ring-1 ring-brand/20`}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  );
}
