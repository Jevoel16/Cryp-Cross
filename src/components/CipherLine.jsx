import { caesarDecode } from '../lib/ciphers';

// The line shifted by Caesar +3, shown above the plain text; screen readers skip it.
export default function CipherLine({ text }) {
  return (
    <code className="cipher-line" aria-hidden="true">
      {caesarDecode(text, -3)}
    </code>
  );
}
