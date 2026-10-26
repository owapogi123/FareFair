import type { ReactNode, SVGProps } from 'react';

/**
 * FareFair custom icon set.
 * - 24x24 grid, rounded caps/joins, currentColor everywhere
 * - Duotone: a soft tinted fill + a crisp outline, so icons pick up
 *   whatever text color you give them (coral, ruby, muted, etc.)
 * - Same `size` prop as lucide, so no px values change in your layout.
 */

const SOFT = { fill: 'currentColor', fillOpacity: 0.2 } as const;

const paths: Record<string, ReactNode> = {
  // ---- Quick actions ----
  fare: (
    <>
      <circle cx="12" cy="12" r="9" {...SOFT} />
      <path d="M9.5 17V7.5h3a2.5 2.5 0 010 5h-3" />
      <path d="M7.5 9.5H15M7.5 11.5H15" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="18" r="2.5" {...SOFT} />
      <path d="M8.5 18H14a4 4 0 004-4" strokeDasharray="2 2.6" />
      <path
        d="M18 2.8a3.7 3.7 0 00-3.7 3.7c0 3 3.7 6.5 3.7 6.5s3.7-3.5 3.7-6.5A3.7 3.7 0 0018 2.8z"
        {...SOFT}
      />
      <circle cx="18" cy="6.5" r="1.1" />
    </>
  ),
  discount: (
    <>
      <path
        d="M3 8a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 000-4V8z"
        {...SOFT}
      />
      <path d="M15 9l-6 6" />
      <circle cx="9.4" cy="9.4" r="1" />
      <circle cx="14.6" cy="14.6" r="1" />
    </>
  ),
  tourist: (
    <>
      <circle cx="12" cy="12" r="9" {...SOFT} />
      <path d="M15.6 8.4l-2.1 5.1-5.1 2.1 2.1-5.1z" />
      <circle cx="12" cy="12" r=".6" />
    </>
  ),
  report: (
    <>
      <path d="M12 3.5l9 16H3z" {...SOFT} />
      <path d="M12 10v4" />
      <circle cx="12" cy="16.9" r=".6" />
    </>
  ),

  // ---- Trust points ----
  shield: (
    <>
      <path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z" {...SOFT} />
      <path d="M8.5 12l2.5 2.5 4.5-5" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="14.5" rx="3" {...SOFT} />
      <path d="M4 10h16M8 3.5v4M16 3.5v4" />
      <circle cx="8.5" cy="14" r=".5" />
      <circle cx="12" cy="14" r=".5" />
      <circle cx="15.5" cy="14" r=".5" />
    </>
  ),
  verified: (
    <>
      <circle cx="12" cy="12" r="9" {...SOFT} />
      <path d="M8 12.2l2.8 2.8L16.2 9.4" />
    </>
  ),
  source: (
    <>
      <path
        d="M12 6.5C10.5 5 8 4.5 4 4.8v13.7c4-.3 6.5.2 8 1.7 1.5-1.5 4-2 8-1.7V4.8c-4-.3-6.5.2-8 1.7z"
        {...SOFT}
      />
      <path d="M12 6.5v13.7" />
    </>
  ),
  estimate: (
    <>
      <path d="M6 3.5h12v17l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4L6 20.5z" {...SOFT} />
      <path d="M9 8.5h6M9 12h6M9 15.5h3" />
    </>
  ),

  // ---- UI bits ----
  chevron: <path d="M9 6l6 6-6 6" />,
  phone: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2.6" {...SOFT} />
      <path d="M11 17.8h2" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="3" {...SOFT} />
      <path d="M3.5 19v-1.5a5.5 5.5 0 0111 0V19" />
      <path d="M16 5.4a3 3 0 010 5.2M18 13.2a5 5 0 012.5 4.3V19" />
    </>
  ),

  // ---- Audiences ----
  commuter: (
    <>
      <rect x="3.5" y="5" width="17" height="12" rx="3" {...SOFT} />
      <rect x="6" y="7.5" width="12" height="4.5" rx="1.2" />
      <circle cx="7.5" cy="14.5" r=".9" />
      <circle cx="16.5" cy="14.5" r=".9" />
      <path d="M6.5 17v2.5M17.5 17v2.5" />
    </>
  ),
  traveler: (
    <>
      <rect x="4" y="8" width="16" height="11.5" rx="3" {...SOFT} />
      <path d="M9 8V6.5A1.5 1.5 0 0110.5 5h3A1.5 1.5 0 0115 6.5V8M4 13h16M10 13v2h4v-2" />
    </>
  ),
  student: (
    <>
      <path d="M12 5l10 4.5-10 4.5L2 9.5z" {...SOFT} />
      <path d="M6 12v4c0 1.5 2.7 3 6 3s6-1.5 6-3v-4M22 9.5V15" />
    </>
  ),
  senior: (
    <>
      <circle cx="10" cy="5.5" r="2.3" {...SOFT} />
      <path d="M6.5 20v-6a3.5 3.5 0 017 0v6" />
      <path d="M16.5 20v-8a1.7 1.7 0 013.4 0" />
    </>
  ),
  pwd: (
    <>
      <circle cx="10" cy="4.6" r="1.9" {...SOFT} />
      <path d="M10 7.8V13h5.5l2 5" />
      <path d="M10 10.5h4.5" />
      <circle cx="9.5" cy="16.5" r="4" />
    </>
  ),
  family: (
    <>
      <circle cx="6.5" cy="7" r="2.2" {...SOFT} />
      <circle cx="17.5" cy="7" r="2.2" {...SOFT} />
      <circle cx="12" cy="14" r="1.8" {...SOFT} />
      <path d="M2.5 20v-3a4 4 0 018 0v3M13.5 20v-3a4 4 0 018 0v3M10.5 20v-1a1.5 1.5 0 013 0v1" />
    </>
  ),
};

export type FareIconName = keyof typeof paths;

type Props = Omit<SVGProps<SVGSVGElement>, 'name'> & {
  name: FareIconName;
  size?: number;
  strokeWidth?: number;
};

export function FareIcon({ name, size = 20, strokeWidth = 1.6, className, ...rest }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}