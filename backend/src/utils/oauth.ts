import { config } from '../config';

// Google OAuth 配置
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

// GitHub OAuth 配置
const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';

/** 生成 Google 登录跳转 URL */
export function getGoogleAuthURL(): string {
  const params = new URLSearchParams({
    client_id: config.googleClientId,
    redirect_uri: `${config.baseUrl}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/** Google 回调：code → token → 用户信息 */
export async function getGoogleUser(code: string) {
  // 1. 用 code 换 access_token
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${config.baseUrl}/api/auth/google/callback`,
    }),
  });
  const tokenData = (await tokenRes.json()) as any;
  if (!tokenData.access_token) throw new Error('Google 授权失败');

  // 2. 用 access_token 获取用户信息
  const userRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const user = (await userRes.json()) as any;

  return {
    email: user.email as string,
    username: (user.name || user.email.split('@')[0]) as string,
    avatar: user.picture as string | undefined,
  };
}

/** 生成 GitHub 登录跳转 URL */
export function getGitHubAuthURL(): string {
  const params = new URLSearchParams({
    client_id: config.githubClientId,
    redirect_uri: `${config.baseUrl}/api/auth/github/callback`,
    scope: 'user:email',
  });
  return `${GITHUB_AUTH_URL}?${params.toString()}`;
}

/** GitHub 回调：code → token → 用户信息 */
export async function getGitHubUser(code: string) {
  // 1. 用 code 换 access_token
  const tokenRes = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: config.githubClientId,
      client_secret: config.githubClientSecret,
      code,
    }),
  });
  const tokenData = (await tokenRes.json()) as any;
  if (!tokenData.access_token) throw new Error('GitHub 授权失败');

  // 2. 获取用户信息
  const userRes = await fetch(GITHUB_USER_URL, {
    headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'NexusLog' },
  });
  const user = (await userRes.json()) as any;

  // 3. 获取邮箱（可能单独调用）
  let email = user.email;
  if (!email) {
    const emailsRes = await fetch(`${GITHUB_USER_URL}/emails`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'NexusLog' },
    });
    const emails = (await emailsRes.json()) as any[];
    const primary = emails?.find((e: any) => e.primary);
    email = primary?.email || emails?.[0]?.email;
  }

  return {
    email: email as string,
    username: user.login as string,
    avatar: user.avatar_url as string | undefined,
  };
}
