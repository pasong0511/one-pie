import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';

export default function Login() {
  const users = useStore((s) => s.users);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const loadSeed = useStore((s) => s.loadSeed);
  const navigate = useNavigate();

  const pick = (id: string) => {
    setCurrentUser(id);
    navigate('/');
  };

  return (
    <div style={{ paddingTop: 80, textAlign: 'center' }}>
      <h1 style={{ fontSize: 36, marginBottom: 4 }}>🥧 one-pie</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 40 }}>
        목표 기반 재무 의사결정 도구
      </p>
      <div className="login-grid">
        {users.map((u) => (
          <div key={u.id} className="card hover login-card" onClick={() => pick(u.id)}>
            <div className="avatar">{u.emoji ?? '👤'}</div>
            <div className="name">{u.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>
              {u.id}
            </div>
          </div>
        ))}
      </div>
      {users.length === 0 && (
        <div style={{ marginTop: 24 }}>
          <button className="primary" onClick={loadSeed}>
            샘플 데이터 로드 (동건 · 송희)
          </button>
        </div>
      )}
      {users.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <button className="ghost" onClick={loadSeed}>
            샘플 데이터 재로드
          </button>
        </div>
      )}
    </div>
  );
}
