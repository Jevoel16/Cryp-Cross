// Success/error line under a form; `id` lets inputs point at it with aria-describedby.
export default function FormMessage({ message, id }) {
  if (!message) return null;
  return (
    <p id={id} className={`form-message ${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>
      {message.text}
    </p>
  );
}
