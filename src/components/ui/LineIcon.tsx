// Hairline SVG icons matching the one-pie design tokens (1.6~2.4 stroke, rounded).
// Mirror of the JSX prototype's <Icon name=..> helper.

export type IconName =
  | 'back'
  | 'more'
  | 'close'
  | 'chev'
  | 'chevD'
  | 'plus'
  | 'minus'
  | 'settings'
  | 'share'
  | 'lock'
  | 'eye'
  | 'home'
  | 'wallet'
  | 'target'
  | 'chart'
  | 'question'
  | 'cal'
  | 'edit'
  | 'trash'
  | 'bell'
  | 'trendUp'
  | 'trendDown'
  | 'cards'
  | 'warn'
  | 'check'
  | 'person'
  | 'link'
  | 'piggy';

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export default function LineIcon({
  name,
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.8,
}: Props) {
  const p = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'back':
      return (
        <svg {...p}>
          <path d="M15 5l-7 7 7 7" />
        </svg>
      );
    case 'more':
      return (
        <svg {...p}>
          <circle cx="5" cy="12" r="1.2" fill={color} stroke="none" />
          <circle cx="12" cy="12" r="1.2" fill={color} stroke="none" />
          <circle cx="19" cy="12" r="1.2" fill={color} stroke="none" />
        </svg>
      );
    case 'close':
      return (
        <svg {...p}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case 'chev':
      return (
        <svg {...p}>
          <path d="M9 5l7 7-7 7" />
        </svg>
      );
    case 'chevD':
      return (
        <svg {...p}>
          <path d="M5 9l7 7 7-7" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...p}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case 'minus':
      return (
        <svg {...p}>
          <path d="M5 12h14" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
        </svg>
      );
    case 'share':
      return (
        <svg {...p}>
          <circle cx="6" cy="12" r="2.2" />
          <circle cx="18" cy="6" r="2.2" />
          <circle cx="18" cy="18" r="2.2" />
          <path d="M8 11l8-4M8 13l8 4" />
        </svg>
      );
    case 'lock':
      return (
        <svg {...p}>
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 018 0v3" />
        </svg>
      );
    case 'eye':
      return (
        <svg {...p}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );
    case 'home':
      return (
        <svg {...p}>
          <path d="M4 10l8-6 8 6v10a2 2 0 01-2 2h-4v-7h-4v7H6a2 2 0 01-2-2V10z" />
        </svg>
      );
    case 'wallet':
      return (
        <svg {...p}>
          <rect x="3" y="6" width="18" height="14" rx="2" />
          <path d="M16 13h2" />
          <path d="M3 10h18" />
        </svg>
      );
    case 'target':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.2" fill={color} stroke="none" />
        </svg>
      );
    case 'chart':
      return (
        <svg {...p}>
          <path d="M4 19V5M4 19h16M8 15V9M12 15v-4M16 15v-8" />
        </svg>
      );
    case 'question':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 4" />
          <circle cx="12" cy="17" r="0.8" fill={color} stroke="none" />
        </svg>
      );
    case 'cal':
      return (
        <svg {...p}>
          <rect x="4" y="5" width="16" height="16" rx="2" />
          <path d="M4 10h16M9 3v4M15 3v4" />
        </svg>
      );
    case 'edit':
      return (
        <svg {...p}>
          <path d="M4 20h4L19 9l-4-4L4 16v4z" />
        </svg>
      );
    case 'trash':
      return (
        <svg {...p}>
          <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13" />
        </svg>
      );
    case 'bell':
      return (
        <svg {...p}>
          <path d="M6 16V11a6 6 0 1112 0v5l1.5 2h-15L6 16z" />
          <path d="M10 21a2 2 0 004 0" />
        </svg>
      );
    case 'trendUp':
      return (
        <svg {...p}>
          <path d="M3 17l6-6 4 4 8-8" />
          <path d="M14 7h7v7" />
        </svg>
      );
    case 'trendDown':
      return (
        <svg {...p}>
          <path d="M3 7l6 6 4-4 8 8" />
          <path d="M14 17h7v-7" />
        </svg>
      );
    case 'cards':
      return (
        <svg {...p}>
          <rect x="3" y="7" width="18" height="12" rx="2" />
          <path d="M3 11h18" />
        </svg>
      );
    case 'warn':
      return (
        <svg {...p}>
          <path d="M12 3l10 18H2L12 3z" />
          <path d="M12 10v5" />
          <circle cx="12" cy="18" r="0.8" fill={color} stroke="none" />
        </svg>
      );
    case 'check':
      return (
        <svg {...p}>
          <path d="M5 12l5 5L20 7" />
        </svg>
      );
    case 'person':
      return (
        <svg {...p}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0116 0" />
        </svg>
      );
    case 'link':
      return (
        <svg {...p}>
          <path d="M10 14a4 4 0 014-4l3-3a4 4 0 015.66 5.66l-3 3a4 4 0 01-5.66 0" />
          <path d="M14 10a4 4 0 01-4 4l-3 3a4 4 0 01-5.66-5.66l3-3a4 4 0 015.66 0" />
        </svg>
      );
    case 'piggy':
      return (
        <svg {...p}>
          <path d="M5 11a7 7 0 0114 0v2a2 2 0 01-2 2v3h-3v-2h-4v2H7v-3a6 6 0 01-2-4z" />
          <circle cx="16" cy="10" r="0.8" fill={color} stroke="none" />
          <path d="M8 9h3" />
        </svg>
      );
    default:
      return null;
  }
}
