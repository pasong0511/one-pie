import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import InviteModal from '../../components/InviteModal';

export default function SettingsFamily() {
  const navigate = useNavigate();
  const currentUserId = useStore((s) => s.currentUserId)!;
  const users = useStore((s) => s.users);
  const familyGroups = useStore((s) => s.familyGroups);
  const [inviteOpen, setInviteOpen] = useState(false);

  const me = users.find((u) => u.id === currentUserId)!;
  const myGroup = familyGroups.find((g) => g.id === me?.familyGroupId);
  const members = (myGroup?.memberIds ?? [])
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is NonNullable<typeof u> => !!u);

  return (
    <div>
      <button className="ghost" onClick={() => navigate('/settings')} style={{ marginBottom: 8 }}>
        ← 설정
      </button>
      <h2 style={{ margin: '0 0 16px' }}>가족</h2>

      <div className="card">
        <div style={{ fontSize: 13 }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
            가족 그룹:{' '}
            <strong style={{ color: 'var(--text)' }}>
              {myGroup?.name ?? me.familyGroupId ?? '없음'}
            </strong>
          </div>
          {members.length > 0 && (
            <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {members.map((m) => (
                <span
                  key={m.id}
                  className="chip"
                  style={{ padding: '6px 10px', fontSize: 12 }}
                >
                  {m.emoji ?? '👤'} {m.name}
                  {m.id === currentUserId && (
                    <span style={{ color: 'var(--text-faint)', marginLeft: 4 }}>(나)</span>
                  )}
                </span>
              ))}
            </div>
          )}
          <button className="primary" onClick={() => setInviteOpen(true)}>
            + 가족 구성원 초대 (QR)
          </button>
        </div>
      </div>

      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}
    </div>
  );
}
