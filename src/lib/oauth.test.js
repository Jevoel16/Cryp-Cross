import { describe, expect, it } from 'vitest';
import { oauthStartUrl, parseProviders } from './oauth';

describe('parseProviders', () => {
  it('keeps known providers in order', () => {
    expect(parseProviders(['google', 'github'])).toEqual(['google', 'github']);
  });

  it('drops unknown names and non-arrays', () => {
    expect(parseProviders(['github', 'myspace', 42])).toEqual(['github']);
    expect(parseProviders(null)).toEqual([]);
    expect(parseProviders({ github: true })).toEqual([]);
  });
});

describe('oauthStartUrl', () => {
  it('adds from and link only when given', () => {
    expect(oauthStartUrl('github')).toMatch(/\/api\/auth\/oauth\/github$/);
    expect(oauthStartUrl('google', { from: '/play', link: true })).toMatch(
      /\/api\/auth\/oauth\/google\?from=%2Fplay&link=1$/,
    );
  });
});
