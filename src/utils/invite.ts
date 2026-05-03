// 가족 초대 토큰 인코딩/디코딩 (프로토타입)
// 토큰 = base64url(JSON({ v, familyGroupId, familyGroupName, inviter }))
// URL: `${origin}${pathname}?invite=<token>`

export type InvitePayload = {
  v: 1;
  familyGroupId: string;
  familyGroupName: string;
  inviter: {
    id: string;
    name: string;
    emoji?: string;
  };
};

function toBase64Url(str: string): string {
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): string {
  const pad = str.length % 4 === 2 ? '==' : str.length % 4 === 3 ? '=' : '';
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return decodeURIComponent(escape(atob(b64)));
}

export function encodeInvite(payload: InvitePayload): string {
  return toBase64Url(JSON.stringify(payload));
}

export function decodeInvite(token: string): InvitePayload | null {
  try {
    const json = fromBase64Url(token);
    const obj = JSON.parse(json);
    if (
      obj &&
      obj.v === 1 &&
      typeof obj.familyGroupId === 'string' &&
      typeof obj.familyGroupName === 'string' &&
      obj.inviter &&
      typeof obj.inviter.id === 'string' &&
      typeof obj.inviter.name === 'string'
    ) {
      return obj as InvitePayload;
    }
    return null;
  } catch {
    return null;
  }
}

export function buildInviteUrl(payload: InvitePayload): string {
  const token = encodeInvite(payload);
  const { origin, pathname } = window.location;
  // HashRouter 에선 query string 이 hash 안에 들어가야 useLocation().search 로 잡힘.
  // 형식: https://host/path/#/?invite=...
  return `${origin}${pathname}#/?invite=${token}`;
}

