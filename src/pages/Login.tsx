import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { decodeInvite } from '../utils/invite';
import { pickBlob, pullState, pushState } from '../lib/cloudSync';

const EMOJI_CHOICES = ['👤', '👨', '👩', '🧑', '🧔', '👧', '👦', '🐱', '🐶', '🦊', '🐻', '🌟'];

export default function Login() {
  const users = useStore((s) => s.users);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const loadSeed = useStore((s) => s.loadSeed);
  const signUp = useStore((s) => s.signUp);
  const acceptInvite = useStore((s) => s.acceptInvite);
  const navigate = useNavigate();
  const location = useLocation();

  // URL의 ?invite= 토큰 감지
  const invite = useMemo(() => {
    const token = new URLSearchParams(location.search).get('invite');
    return token ? decodeInvite(token) : null;
  }, [location.search]);

  const [explicitMode, setExplicitMode] = useState<'pick' | 'signup' | null>(null);
  const mode: 'pick' | 'signup' | 'invite' = invite
    ? 'invite'
    : explicitMode ?? 'pick';

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('👤');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = (id: string) => {
    setCurrentUser(id);
    navigate('/', { replace: true });
  };

  const submitSignUp = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const newUser = signUp(name, emoji);
      const fgId = newUser.familyGroupId;
      if (fgId) {
        const after = useStore.getState();
        const group = after.familyGroups.find((g) => g.id === fgId);
        await pushState({
          familyGroupId: fgId,
          familyGroupName: group?.name ?? newUser.name,
          state: pickBlob(after),
          updatedBy: newUser.id,
        });
      }
      navigate('/', { replace: true });
    } catch (e: any) {
      setError(e?.message ?? '가입에 실패했어요');
    } finally {
      setBusy(false);
    }
  };

  const submitAcceptInvite = async () => {
    if (!invite || busy) return;
    setError(null);
    setBusy(true);
    try {
      // 1) 초대 그룹의 cloud state pull
      const remote = await pullState(invite.familyGroupId);
      if (!remote) {
        setError('초대 링크가 유효하지 않거나 만료됐어요. 초대자에게 다시 받아주세요.');
        return;
      }
      // 2) cloud state 를 로컬에 적용 (currentUserId / initialized 는 보존됨)
      useStore.setState(remote.state);
      // 3) 자기 자신을 users / familyGroups 에 추가 (기존 acceptInvite 로직 재사용)
      const newUser = acceptInvite(invite, name, emoji);
      // 4) 갱신된 state 를 cloud 에 push — 다른 멤버에게 즉시 전파
      const after = useStore.getState();
      await pushState({
        familyGroupId: invite.familyGroupId,
        familyGroupName: invite.familyGroupName,
        state: pickBlob(after),
        updatedBy: newUser.id,
      });
      navigate('/', { replace: true });
    } catch (e: any) {
      setError(e?.message ?? '가입에 실패했어요');
    } finally {
      setBusy(false);
    }
  };

  const declineInvite = () => {
    navigate('/', { replace: true });
    setExplicitMode('pick');
  };

  return (
    <div style={{ paddingTop: 60, textAlign: 'center' }}>
      <h1 style={{ fontSize: 36, marginBottom: 4 }}>🥧 one-pie</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
        목표 기반 재무 의사결정 도구
      </p>

      {mode === 'invite' && invite && (
        <div className="card" style={{ maxWidth: 420, margin: '0 auto', textAlign: 'left' }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 40, marginBottom: 4 }}>{invite.inviter.emoji ?? '👤'}</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>
              {invite.inviter.name} 님이 당신을 가족으로 초대했어요
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              가족 그룹: {invite.familyGroupName}
            </div>
          </div>

          <label className="field">
            <span className="label-text">이름</span>
            <input
              autoFocus
              value={name}
              placeholder="이름을 입력하세요"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitAcceptInvite()}
            />
          </label>

          <label className="field">
            <span className="label-text">이모지</span>
            <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
              {EMOJI_CHOICES.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmoji(em)}
                  style={{
                    fontSize: 20,
                    padding: '6px 10px',
                    borderColor: emoji === em ? 'var(--accent)' : undefined,
                    background: emoji === em ? 'var(--accent-weak)' : undefined,
                  }}
                >
                  {em}
                </button>
              ))}
            </div>
          </label>

          {error && <div className="warn-box" style={{ marginBottom: 8 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="ghost" onClick={declineInvite} style={{ flex: 1 }}>
              초대 거절
            </button>
            <button
              className="primary"
              onClick={submitAcceptInvite}
              disabled={!name.trim() || busy}
              style={{ flex: 1 }}
            >
              가입하고 합류
            </button>
          </div>
        </div>
      )}

      {mode === 'signup' && (
        <div className="card" style={{ maxWidth: 380, margin: '0 auto', textAlign: 'left' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, textAlign: 'center' }}>
            새 계정 만들기
          </div>

          <label className="field">
            <span className="label-text">이름</span>
            <input
              autoFocus
              value={name}
              placeholder="이름을 입력하세요"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitSignUp()}
            />
          </label>

          <label className="field">
            <span className="label-text">이모지</span>
            <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
              {EMOJI_CHOICES.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmoji(em)}
                  style={{
                    fontSize: 20,
                    padding: '6px 10px',
                    borderColor: emoji === em ? 'var(--accent)' : undefined,
                    background: emoji === em ? 'var(--accent-weak)' : undefined,
                  }}
                >
                  {em}
                </button>
              ))}
            </div>
          </label>

          {error && <div className="warn-box" style={{ marginBottom: 8 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="ghost" onClick={() => setExplicitMode('pick')} style={{ flex: 1 }}>
              취소
            </button>
            <button
              className="primary"
              onClick={submitSignUp}
              disabled={!name.trim() || busy}
              style={{ flex: 1 }}
            >
              가입하기
            </button>
          </div>
        </div>
      )}

      {mode === 'pick' && (
        <>
          {users.length > 0 && (
            <>
              <div className="login-grid">
                {users.map((u) => (
                  <div key={u.id} className="card hover login-card" onClick={() => pick(u.id)}>
                    <div className="avatar">{u.emoji ?? '👤'}</div>
                    <div className="name">{u.name}</div>
                  </div>
                ))}
                <div
                  className="card hover login-card"
                  onClick={() => {
                    setName('');
                    setEmoji('👤');
                    setError(null);
                    setExplicitMode('signup');
                  }}
                  style={{
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    borderColor: 'var(--border-strong)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <div className="avatar">＋</div>
                  <div className="name">새 계정</div>
                </div>
              </div>
              <div style={{ marginTop: 24 }}>
                <button className="ghost" onClick={loadSeed}>
                  샘플 데이터 재로드 (동건 · 송희)
                </button>
              </div>
            </>
          )}

          {users.length === 0 && (
            <div style={{ maxWidth: 380, margin: '0 auto' }}>
              <button
                className="primary"
                onClick={() => {
                  setName('');
                  setEmoji('👤');
                  setError(null);
                  setExplicitMode('signup');
                }}
                style={{ width: '100%', padding: '14px 16px', fontSize: 15 }}
              >
                + 새 계정 만들기
              </button>
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-faint)' }}>
                또는
              </div>
              <button
                className="ghost"
                onClick={loadSeed}
                style={{ marginTop: 12 }}
              >
                샘플 데이터 로드 (동건 · 송희)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
