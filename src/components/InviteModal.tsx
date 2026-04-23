import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { useStore } from '../store';
import { buildInviteUrl, InvitePayload } from '../utils/invite';

type Props = {
  onClose: () => void;
};

export default function InviteModal({ onClose }: Props) {
  const currentUserId = useStore((s) => s.currentUserId)!;
  const users = useStore((s) => s.users);
  const familyGroups = useStore((s) => s.familyGroups);
  const me = users.find((u) => u.id === currentUserId);
  const fg = familyGroups.find((g) => g.id === me?.familyGroupId);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!me || !fg) return;
    const payload: InvitePayload = {
      v: 1,
      familyGroupId: fg.id,
      familyGroupName: fg.name,
      inviter: {
        id: me.id,
        name: me.name,
        emoji: me.emoji,
      },
    };
    const url = buildInviteUrl(payload);
    setInviteUrl(url);
    const canvas = canvasRef.current;
    if (canvas) {
      QRCode.toCanvas(canvas, url, { width: 220, margin: 1 }, (err) => {
        if (err) console.error('QR 생성 실패', err);
      });
    }
  }, [me, fg]);

  const copy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 클립보드 미지원 시: 선택
      const el = document.getElementById('invite-url-input') as HTMLInputElement | null;
      el?.select();
    }
  };

  if (!me || !fg) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>가족 초대</h3>
            <button className="ghost" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <div className="empty">가족 그룹을 찾을 수 없어요.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>👥 가족 초대</h3>
          <button className="ghost" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div
              style={{
                display: 'inline-block',
                padding: 12,
                background: 'white',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
              }}
            >
              <canvas ref={canvasRef} />
            </div>
          </div>

          <div style={{ fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
            <div style={{ color: 'var(--text-muted)' }}>가족 그룹</div>
            <div style={{ fontWeight: 600, marginTop: 2 }}>{fg.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>
              초대한 사람: {me.emoji} {me.name}
            </div>
          </div>

          <label className="field" style={{ marginTop: 12 }}>
            <span className="label-text">초대 링크</span>
            <input
              id="invite-url-input"
              readOnly
              value={inviteUrl}
              onFocus={(e) => e.currentTarget.select()}
            />
          </label>

          <button
            className="primary"
            onClick={copy}
            style={{ width: '100%', marginTop: 4 }}
          >
            {copied ? '✓ 복사됨' : '링크 복사'}
          </button>

          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 12, textAlign: 'center' }}>
            상대방이 QR을 스캔하거나 링크를 열면 가족으로 합류할 수 있어요
          </div>
        </div>
      </div>
    </div>
  );
}
