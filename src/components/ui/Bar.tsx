type Props = {
  pct: number;
  color?: string;
  bg?: string;
  height?: number;
  radius?: number;
};

// Horizontal progress bar used across the app.
export default function Bar({
  pct,
  color = '#3182F6',
  bg = '#EDF0F3',
  height = 6,
  radius = 999,
}: Props) {
  const p = Math.max(0, Math.min(100, pct));
  return (
    <div style={{ height, background: bg, borderRadius: radius, overflow: 'hidden' }}>
      <div
        style={{
          width: `${p}%`,
          height: '100%',
          background: color,
          borderRadius: radius,
          transition: 'width .3s',
        }}
      />
    </div>
  );
}
