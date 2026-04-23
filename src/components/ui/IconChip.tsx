type Props = {
  emoji: string;
  bg?: string;
  size?: number;
  radius?: number;
};

// Square emoji chip used as an account / category avatar.
export default function IconChip({
  emoji,
  bg = '#F2F4F6',
  size = 40,
  radius = 12,
}: Props) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.5,
        flexShrink: 0,
      }}
    >
      {emoji}
    </div>
  );
}
