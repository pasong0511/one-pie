import type { ReactNode } from 'react';
import LineIcon, { type IconName } from './LineIcon';

type PillProps = {
  children: ReactNode;
  bg?: string;
  color?: string;
  icon?: IconName;
  size?: 'sm' | 'md';
};

// Small soft-color pill used for mode / sharing / status badges.
export function Pill({
  children,
  bg = '#F2F4F6',
  color = '#4E5968',
  icon,
  size = 'sm',
}: PillProps) {
  const pad = size === 'sm' ? '3px 8px' : '4px 10px';
  const fs = size === 'sm' ? 11 : 12;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: bg,
        color,
        padding: pad,
        borderRadius: 6,
        fontSize: fs,
        fontWeight: 700,
        letterSpacing: '-0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {icon && <LineIcon name={icon} size={fs} color={color} strokeWidth={2.2} />}
      {children}
    </span>
  );
}

export function SharingPill({
  kind,
}: {
  kind: 'private' | 'shared-r' | 'shared-rw' | undefined;
}) {
  if (kind === 'shared-r')
    return (
      <Pill icon="eye" bg="#F3EEFE" color="#7048B8">
        읽기공유
      </Pill>
    );
  if (kind === 'shared-rw')
    return (
      <Pill icon="share" bg="#E8F2FE" color="#1B64DA">
        부부공유
      </Pill>
    );
  return (
    <Pill icon="lock" bg="#F2F4F6" color="#4E5968">
      비공개
    </Pill>
  );
}

export function ModePill({ mode }: { mode: '누적형' | '차감형' }) {
  if (mode === '누적형')
    return (
      <Pill bg="#E6F7EC" color="#00875A">
        누적
      </Pill>
    );
  return (
    <Pill bg="#FFF2E6" color="#C76A00">
      차감
    </Pill>
  );
}
