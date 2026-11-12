import { useSearchParams } from 'react-router-dom';
import FormMessage from '../FormMessage';
import { ProviderIcon } from '../OAuthButtons';
import useSubmitState from '../../hooks/useSubmitState';
import { api } from '../../api';
import { OAUTH_ERRORS, PROVIDER_LABELS, oauthStartUrl, useOAuthProviders } from '../../lib/oauth';
import { SUBMIT, idleSubmit } from '../../lib/submitMachine';

export default function ConnectedAccounts({ user, setUser }) {
  const providers = useOAuthProviders();
  const [params] = useSearchParams();
  const linked = PROVIDER_LABELS[params.get('linked')];
  const oauthError = OAUTH_ERRORS[params.get('oauth')];
  // The result of a connect attempt comes back in the URL, so it starts as a finished submit.
  const { busy, message, run } = useSubmitState(
    oauthError
      ? { status: SUBMIT.ERROR, message: oauthError }
      : linked
        ? { status: SUBMIT.SUCCESS, message: `${linked} connected. You can now sign in with it.` }
        : idleSubmit,
  );

  // Show connected providers even if their server config was later removed.
  const shown = [...new Set([...providers, ...user.providers])];
  if (!shown.length) return null;

  const unlink = (provider) =>
    run(async () => {
      setUser(await api(`/auth/oauth/${provider}/unlink`, { method: 'POST' }));
      return `${PROVIDER_LABELS[provider]} disconnected.`;
    });

  return (
    <>
      <h2>Connected accounts</h2>
      <ul className="connected-accounts">
        {shown.map((p) => {
          const connected = user.providers.includes(p);
          return (
            <li key={p}>
              <ProviderIcon provider={p} />
              <span className="connected-name">{PROVIDER_LABELS[p] || p}</span>
              {connected ? (
                <button type="button" className="link-btn" onClick={() => unlink(p)} disabled={busy}>
                  Disconnect
                </button>
              ) : (
                providers.includes(p) && (
                  <a className="link-btn" href={oauthStartUrl(p, { link: true, from: '/account' })}>
                    Connect
                  </a>
                )
              )}
            </li>
          );
        })}
      </ul>
      <FormMessage message={message} />
    </>
  );
}
