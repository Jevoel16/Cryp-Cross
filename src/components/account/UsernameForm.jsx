import { useState } from 'react';
import FormMessage from '../FormMessage';
import useSubmitState from '../../hooks/useSubmitState';
import { api } from '../../api';
import { describedBy } from '../../lib/forms';

export default function UsernameForm({ user, setUser }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(user.username);
  const { busy, message, run, reset } = useSubmitState();

  const onSubmit = (e) => {
    e.preventDefault();
    run(async () => {
      setUser(await api('/auth/username', { method: 'PUT', body: { username: value } }));
      setEditing(false);
      return 'Username updated.';
    });
  };

  // Cancel drops the typed name and any error with it.
  const onCancel = () => {
    setValue(user.username);
    reset();
    setEditing(false);
  };

  if (!editing) {
    return (
      <>
        {user.username}{' '}
        <button type="button" className="link-btn" onClick={() => setEditing(true)}>
          Change
        </button>
        <FormMessage message={message} id="username-message" />
      </>
    );
  }
  return (
    <form className="inline-form" onSubmit={onSubmit}>
      <label htmlFor="new-username" className="visually-hidden">
        New username
      </label>
      <input
        id="new-username"
        {...describedBy(message, 'username-message')}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required
        pattern="[A-Za-z0-9_]{3,20}"
        title="3-20 letters, numbers or underscores"
        disabled={busy}
      />
      <button type="submit" className="submit-btn" disabled={busy}>
        {busy ? 'Saving...' : 'Save'}
      </button>
      <button type="button" className="link-btn" onClick={onCancel} disabled={busy}>
        Cancel
      </button>
      <FormMessage message={message} id="username-message" />
    </form>
  );
}
