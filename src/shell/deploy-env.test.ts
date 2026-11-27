import { describe, it, expect } from 'vitest';
import { deployEnv } from './deploy-env';

describe('deployEnv', () => {
  it('is preview on the dev server, so Draft Toys are playable locally', () => {
    expect(deployEnv({ command: 'serve', vercelEnv: undefined })).toBe('preview');
  });

  it("is preview for a Vercel Preview Deployment's build", () => {
    expect(deployEnv({ command: 'build', vercelEnv: 'preview' })).toBe('preview');
  });

  it("is production for Vercel's production build", () => {
    expect(deployEnv({ command: 'build', vercelEnv: 'production' })).toBe('production');
  });

  it('is production for a build outside Vercel, so a missing setting hides drafts', () => {
    expect(deployEnv({ command: 'build', vercelEnv: undefined })).toBe('production');
  });
});
