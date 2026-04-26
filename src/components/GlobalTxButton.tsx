import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { canWrite, visibleAccounts } from '../utils/selectors';

// 어느 페이지에서든 눌러서 거래를 추가할 수 있는 플로팅 버튼.
// /tx/new 페이지로 이동, 거기서 계좌 선택 → 저장.
export default function GlobalTxButton() {
  const navigate = useNavigate();
  const currentUserId = useStore((s) => s.currentUserId);
  const accounts = useStore((s) => s.accounts);

  if (!currentUserId) return null;

  const writable = visibleAccounts(currentUserId, accounts).filter((a) =>
    canWrite(currentUserId, a),
  );
  const disabled = writable.length === 0;

  return (
    <button
      className="fab-tx"
      onClick={() => !disabled && navigate('/tx/new')}
      title={disabled ? '쓰기 가능한 계좌가 없어요' : '거래 추가'}
      aria-label="거래 추가"
      disabled={disabled}
    >
      <span className="fab-tx-plus">＋</span>
      <span className="fab-tx-label">거래</span>
    </button>
  );
}
