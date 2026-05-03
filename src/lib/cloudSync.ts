import { supabase } from './supabase';
import type { Store } from '../store';

const TABLE = 'family_state';

// 클라우드에 동기화할 키. currentUserId / initialized 는 디바이스 로컬 전용.
export const SYNCED_KEYS = [
  'users',
  'familyGroups',
  'accounts',
  'goals',
  'transactions',
  'recurringRules',
  'splitBills',
  'categoryTaxonomy',
  'preferences',
] as const;

export type SyncedKey = (typeof SYNCED_KEYS)[number];
export type StateBlob = Pick<Store, SyncedKey>;

export function pickBlob(s: Store): StateBlob {
  const out = {} as StateBlob;
  for (const k of SYNCED_KEYS) (out as any)[k] = s[k];
  return out;
}

export type RemoteRow = {
  state: StateBlob;
  version: number;
  updatedAt: string;
  updatedBy: string | null;
};

export async function pullState(familyGroupId: string): Promise<RemoteRow | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('state, version, updated_at, updated_by')
    .eq('family_group_id', familyGroupId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    state: data.state as StateBlob,
    version: data.version as number,
    updatedAt: data.updated_at as string,
    updatedBy: (data.updated_by as string | null) ?? null,
  };
}

export async function pushState(params: {
  familyGroupId: string;
  familyGroupName: string;
  state: StateBlob;
  updatedBy: string;
}): Promise<void> {
  const { error } = await supabase.from(TABLE).upsert(
    {
      family_group_id: params.familyGroupId,
      family_group_name: params.familyGroupName,
      state: params.state,
      updated_by: params.updatedBy,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'family_group_id' },
  );
  if (error) throw error;
}

// 다른 디바이스의 변경을 실시간 수신.
export function subscribeToState(
  familyGroupId: string,
  onChange: (row: RemoteRow) => void,
): () => void {
  const channel = supabase
    .channel(`family_state:${familyGroupId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLE,
        filter: `family_group_id=eq.${familyGroupId}`,
      },
      (payload) => {
        const row = payload.new as Record<string, unknown> | undefined;
        if (!row || !row.state) return;
        onChange({
          state: row.state as StateBlob,
          version: row.version as number,
          updatedAt: row.updated_at as string,
          updatedBy: (row.updated_by as string | null) ?? null,
        });
      },
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
