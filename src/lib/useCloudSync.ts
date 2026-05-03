import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { pickBlob, pushState, subscribeToState, type StateBlob } from './cloudSync';

const DEBOUNCE_MS = 800;

// 로그인 상태가 되면 자동으로:
//  1) family_group_id 채널을 Realtime 구독 → 다른 디바이스 변경을 즉시 반영
//  2) 로컬 state 변경을 debounce 후 cloud 에 push
// familyGroupId 가 없으면 (로그아웃 / 미가입) 아무 일도 하지 않음.
export function useCloudSync() {
  const currentUserId = useStore((s) => s.currentUserId);
  const me = useStore((s) =>
    s.currentUserId ? s.users.find((u) => u.id === s.currentUserId) ?? null : null,
  );
  const familyGroup = useStore((s) =>
    me?.familyGroupId ? s.familyGroups.find((g) => g.id === me.familyGroupId) ?? null : null,
  );
  const familyGroupId = me?.familyGroupId ?? null;
  const familyGroupName = familyGroup?.name ?? '';

  // pull/realtime 으로 받은 setState 가 다시 push 되지 않도록 한 번 skip
  const skipNextPushRef = useRef(false);

  // 1) Realtime 구독
  useEffect(() => {
    if (!familyGroupId) return;
    const unsub = subscribeToState(familyGroupId, (row) => {
      // 자기가 보낸 echo 무시 — 무한 push/pull 루프 방지
      if (row.updatedBy && row.updatedBy === currentUserId) return;
      skipNextPushRef.current = true;
      // SyncedKey 들만 교체. currentUserId / initialized 는 보존됨 (zustand setState 는 partial merge).
      useStore.setState(row.state as Partial<StateBlob>);
    });
    return unsub;
  }, [familyGroupId, currentUserId]);

  // 2) local 변경 → debounce → cloud push
  useEffect(() => {
    if (!familyGroupId || !currentUserId) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastPushedJson = '';

    const unsub = useStore.subscribe((state) => {
      if (skipNextPushRef.current) {
        skipNextPushRef.current = false;
        return;
      }
      const blob = pickBlob(state);
      const json = JSON.stringify(blob);
      if (json === lastPushedJson) return;

      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          await pushState({
            familyGroupId,
            familyGroupName,
            state: blob,
            updatedBy: currentUserId,
          });
          lastPushedJson = json;
        } catch (e) {
          // 네트워크 실패 시 다음 변경에서 재시도됨 (로컬은 zustand persist 로 안전)
          console.error('[cloud sync] push failed', e);
        }
      }, DEBOUNCE_MS);
    });

    return () => {
      if (timer) clearTimeout(timer);
      unsub();
    };
  }, [familyGroupId, familyGroupName, currentUserId]);
}
