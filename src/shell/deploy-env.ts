/**
 * Which kind of deployment a build is for. Draft Toys are playable only in a
 * `preview` (issue 56).
 */
export type DeployEnv = 'preview' | 'production';

/**
 * Decides the DeployEnv at build time; `vite.config.ts` passes the result to
 * the app as `__DEPLOY_ENV__`. Vercel sets `VERCEL_ENV` on its builds. The dev
 * server counts as a preview so Draft Toys can be played locally. Any other
 * build, including one where `VERCEL_ENV` is missing (a local `bun run build`,
 * CI's e2e build), is production, so a missing setting hides drafts rather
 * than shipping them.
 */
export function deployEnv({
  command,
  vercelEnv,
}: {
  command: 'serve' | 'build';
  vercelEnv: string | undefined;
}): DeployEnv {
  if (command === 'serve') return 'preview';
  return vercelEnv === 'preview' ? 'preview' : 'production';
}
