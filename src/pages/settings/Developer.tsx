import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';

export default function SettingsDeveloper() {
  const navigate = useNavigate();
  const loadSeed = useStore((s) => s.loadSeed);
  const resetAll = useStore((s) => s.resetAll);

  return (
    <div>
      <button className="ghost" onClick={() => navigate('/settings')} style={{ marginBottom: 8 }}>
        ← 설정
      </button>
      <h2 style={{ margin: '0 0 16px' }}>개발자</h2>

      <div className="card">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={loadSeed}>샘플 데이터 재로드</button>
          <button
            className="danger"
            onClick={() => {
              if (confirm('모든 데이터를 삭제할까요?')) {
                resetAll();
                navigate('/');
              }
            }}
          >
            전체 초기화
          </button>
        </div>
      </div>
    </div>
  );
}
