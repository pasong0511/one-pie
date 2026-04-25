import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { visibleAccounts } from '../utils/selectors';
import { usePageRuntime } from '../stores/runtime';

// 거래 페이지 헤더 드롭다운 — 다중 계좌 필터 (체크박스).
// - 체크 없음 → 전체 계좌의 거래
// - 체크 있음 → 그 계좌들의 거래만
// AccountSwitcher의 레이어 스타일을 재사용 (.acct-switch-*).
export default function TxAccountFilter() {
  const currentUserId = useStore((s) => s.currentUserId)!;
  const accounts = useStore((s) => s.accounts);
  const selectedIds = usePageRuntime((s) => s.txFilterAccountIds);
  const toggleId = usePageRuntime((s) => s.toggleTxFilterAccount);
  const clearAll = usePageRuntime((s) => s.clearTxFilterAccounts);

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

  const triggerLabel =
    selectedIds.length === 0
      ? '거래'
      : selectedIds.length === 1
        ? (() => {
            const a = visible.find((x) => x.id === selectedIds[0]);
            return a ? `${a.emoji ?? '📒'} ${a.name}` : '거래';
          })()
        : `거래 · ${selectedIds.length}개`;

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
            className={`acct-switch-all ${selectedIds.length === 0 ? 'active' : ''}`}
            onClick={() => clearAll()}
          >
            🧾 전체 거래
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
            {list.map((a) => {
              const active = selectedIds.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  className={`acct-switch-item ${active ? 'active' : ''}`}
                  onClick={() => toggleId(a.id)}
                >
                  <span className="acct-switch-emoji">{a.emoji ?? '📒'}</span>
                  <span className="acct-switch-name">{a.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
