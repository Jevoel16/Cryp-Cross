import { useEffect, useState } from 'react';
import { ClockIcon } from './Icons';
import { formatDuration } from '../lib/format';

// Ticks every second until `timeMs` (the final time) is known.
export default function Timer({ startedAt, timeMs }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (timeMs !== null) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timeMs]);
  const elapsed = timeMs ?? Math.max(0, now - new Date(startedAt).getTime());
  return (
    <span className="timer" aria-label={`Time ${formatDuration(elapsed)}`}>
      <ClockIcon />
      {formatDuration(elapsed)}
    </span>
  );
}
