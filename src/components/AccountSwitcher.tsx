import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { visibleAccounts } from '../utils/selectors';
import { usePageRuntime } from '../stores/runtime';

// 상단바 좌측: 계좌 페이지에서만 노출되는 계좌 내비게이터.
// - '전체 계좌' 선택 → /accounts (목록 보기 유지)
// - 특정 계좌 선택 → /account/:id (상세 진입)
// 트리거 라벨은 현재 컨텍스트(상세 진입 시 그 계좌명, 그 외 '전체 계좌').
export default function AccountSwitcher() {
  const navigate = useNavigate();
  const currentAccountId = usePageRuntime((s) => s.currentAccountId);
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

  const detailId = currentAccountId;
  const detailAcc = detailId ? visible.find((a) => a.id === detailId) ?? null : null;
  const triggerLabel = detailAcc
    ? `${detailAcc.emoji ?? '📒'} ${detailAcc.name}`
    : '전체 계좌';

  const goAll = () => {
    setOpen(false);
    navigate('/accounts');
  };
  const goDetail = (id: string) => {
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
        <span>{triggerLabel}</span>
        <span className={`acct-switch-caret ${open ? 'up' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="acct-switch-layer" role="menu">
          <button
            type="button"
            className={`acct-switch-all ${detailAcc === null ? 'active' : ''}`}
            onClick={goAll}
          >
            🧾 전체 계좌
          </button>

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
                className={`acct-switch-item ${detailId === a.id ? 'active' : ''}`}
                onClick={() => goDetail(a.id)}
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
