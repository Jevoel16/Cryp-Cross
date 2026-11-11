// Success/error line under a form. role="alert" so screen readers announce errors.
export default function FormMessage({ message }) {
  if (!message) return null;
  return (
    <p className={`form-message ${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>
      {message.text}
    </p>
  );
}
