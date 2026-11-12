import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import SectionWrapper from '../components/SectionWrapper';
import { RowsSkeleton } from '../components/Skeleton';
import FormMessage from '../components/FormMessage';
import Stats from '../components/account/Stats';
import UsernameForm from '../components/account/UsernameForm';
import ConnectedAccounts from '../components/account/ConnectedAccounts';
import PasswordForm from '../components/account/PasswordForm';
import usePageMeta from '../usePageMeta';
import { useAuth } from '../auth/authContext';
import { AUTH_STATUS } from '../auth/authMachine';
import useSubmitState from '../hooks/useSubmitState';
import { SUBMIT } from '../lib/submitMachine';

export default function AccountPage() {
  usePageMeta({ title: 'Account', description: 'Your Cryp-Cross account, streaks and solve history.', noindex: true });
  const { status, user, error, logout, refresh, setUser: replaceUser } = useAuth();
  // API answers carry the public profile only; keep session-only flags from /me.
  const setUser = (next) => replaceUser((current) => ({ ...current, ...next }));
  const leave = useSubmitState();
  // Logging out from here goes Home; arriving signed out goes to the login page.
  const leaving = leave.busy || leave.status === SUBMIT.SUCCESS;
  const [retryError, setRetryError] = useState('');

  const onLogout = () =>
    leave.run(() =>
      logout().catch((err) => {
        throw new Error(`You are still signed in: ${err.message}`);
      }),
    );

  switch (status) {
    case AUTH_STATUS.LOADING:
      return (
        <SectionWrapper title="Account">
          <RowsSkeleton rows={3} label="Loading your account" />
        </SectionWrapper>
      );
    case AUTH_STATUS.ERROR:
      return (
        <SectionWrapper title="Account">
          <div className="form-message error" role="alert">
            <p>Your account didn&apos;t load. {retryError || error}</p>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => refresh().catch((err) => setRetryError(err.message))}
            >
              Try again
            </button>
          </div>
        </SectionWrapper>
      );
    case AUTH_STATUS.SIGNED_OUT:
      return leaving ? <Navigate to="/" replace /> : <Navigate to="/login" replace state={{ from: '/account' }} />;
    case AUTH_STATUS.SIGNED_IN:
      return (
        <SectionWrapper title="Account">
          <dl className="account-details">
            <dt>Username</dt>
            <dd>{user.demo ? user.username : <UsernameForm user={user} setUser={setUser} />}</dd>
          </dl>
          {user.demo ? (
            <p className="hint">
              This is the shared demo account, so its username, password and connected accounts can&apos;t be changed,
              and its solves aren&apos;t ranked. <Link to="/login">Sign in with GitHub or Google</Link> for your own.
            </p>
          ) : (
            <>
              <ConnectedAccounts user={user} setUser={setUser} />
              <PasswordForm user={user} setUser={setUser} refresh={refresh} />
            </>
          )}
          <Stats />
          <p className="account-actions">
            <button type="button" className="secondary-btn" onClick={onLogout} disabled={leave.busy}>
              Log out
            </button>
          </p>
          <FormMessage message={leave.message} />
        </SectionWrapper>
      );
    default:
      throw new Error(`Unknown auth status: ${status}`);
  }
}
