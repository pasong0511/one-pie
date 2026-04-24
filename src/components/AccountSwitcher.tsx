import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { visibleAccounts } from '../utils/selectors';

// 상단바 좌측: 계좌 목록을 레이어(드롭다운)로 보여주는 스위처.
// 당근마켓의 지역 선택 드롭다운 패턴. 탭(내꺼 / 공유)으로 필터,
// 하단에 '내 계좌 관리' 링크.
export default function AccountSwitcher() {
  const navigate = useNavigate();
  const currentUserId = useStore((s) => s.currentUserId)!;
  const accounts = useStore((s) => s.accounts);

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'mine' | 'shared'>('mine');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const visible = visibleAccounts(currentUserId, accounts);
  const mine = visible.filter((a) => a.ownerId === currentUserId);
  const shared = visible.filter((a) => a.ownerId !== currentUserId);
  const list = tab === 'mine' ? mine : shared;

  const go = (id: string) => {
    setOpen(false);
    navigate(`/account/${id}`);
  };

  return (
    <div className="acct-switch" ref={wrapRef}>
      <button
        type="button"
        className="acct-switch-btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>계좌</span>
        <span className={`acct-switch-caret ${open ? 'up' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="acct-switch-layer" role="menu">
          <div className="acct-switch-tabs">
            <button
              type="button"
              className={`acct-switch-tab ${tab === 'mine' ? 'active' : ''}`}
              onClick={() => setTab('mine')}
            >
              내꺼
            </button>
            <button
              type="button"
              className={`acct-switch-tab ${tab === 'shared' ? 'active' : ''}`}
              onClick={() => setTab('shared')}
            >
              공유
            </button>
          </div>

          <div className="acct-switch-list">
            {list.length === 0 && (
              <div className="empty" style={{ padding: 20 }}>
                {tab === 'mine' ? '내 계좌가 없어요' : '공유받은 계좌가 없어요'}
              </div>
            )}
            {list.map((a) => (
              <button
                key={a.id}
                type="button"
                className="acct-switch-item"
                onClick={() => go(a.id)}
              >
                <span className="acct-switch-emoji">{a.emoji ?? '📒'}</span>
                <span className="acct-switch-name">{a.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
