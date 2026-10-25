// Small inline icon set (stroke style) so we do not need an icon package.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-[18px] w-[18px]"
      {...props}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 10.5 12 4l8 6.5" />
    <path d="M6 9.8V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.8" />
    <path d="M10 20v-5h4v5" />
  </Base>
);

export const GridIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </Base>
);

export const ClockIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4.4l2.8 1.6" />
  </Base>
);

export const PlusIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const SearchIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </Base>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m6 9.5 6 6 6-6" />
  </Base>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m14 6-6 6 6 6" />
  </Base>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m10 6 6 6-6 6" />
  </Base>
);

export const LogoutIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3" />
    <path d="M10 8l-4 4 4 4M6 12h9" />
  </Base>
);

export const CheckIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Base>
);

export const BagIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 8h12l-1 11.2a1 1 0 0 1-1 .8H8a1 1 0 0 1-1-.8L6 8Z" />
    <path d="M9 8V6.8A3 3 0 0 1 12 4a3 3 0 0 1 3 2.8V8" />
  </Base>
);

export const PesoIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M10 16V8h2.6a2.7 2.7 0 0 1 0 5.4H10M8.6 11.4h5.6M8.6 13.2h5.6" />
  </Base>
);

export const UserIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="9" r="3.2" />
    <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
  </Base>
);

export const KeyIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="8" cy="15.5" r="3.5" />
    <path d="m10.5 13 7-7M15 5.5 18.5 9M13 7.5 16.5 11" />
  </Base>
);

export const EyeIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M2.8 12S6 6.5 12 6.5 21.2 12 21.2 12 18 17.5 12 17.5 2.8 12 2.8 12Z" />
    <circle cx="12" cy="12" r="2.6" />
  </Base>
);

export const EyeOffIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 4l16 16" />
    <path d="M9.6 9.7A2.6 2.6 0 0 0 12 14.6c.7 0 1.4-.3 1.9-.8" />
    <path d="M6.4 7.3C4.3 8.8 2.8 12 2.8 12S6 17.5 12 17.5c1.5 0 2.8-.4 4-.9" />
    <path d="M18.4 15c1.6-1.4 2.8-3 2.8-3S18 6.5 12 6.5c-.6 0-1.2 0-1.7.2" />
  </Base>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </Base>
);

export const ShieldIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3.5 19 6v5.5c0 4.3-2.9 7.5-7 9-4.1-1.5-7-4.7-7-9V6l7-2.5Z" />
  </Base>
);

export const InboxIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 13.5V18a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4.5" />
    <path d="M4 13.5 6.5 5h11L20 13.5h-4.5a3.5 3.5 0 0 1-7 0H4Z" />
  </Base>
);

export const ChartIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 20V11" />
    <path d="M10 20V5" />
    <path d="M16 20v-6" />
    <path d="M2 20h20" />
  </Base>
);
