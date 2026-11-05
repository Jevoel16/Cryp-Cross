import { useEffect, useState } from 'react';

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DURATION_MS = 1400;

const scramble = (ch) => {
    if (!/[A-Za-z]/.test(ch)) return ch;
    const letter = UPPER[Math.floor(Math.random() * 26)];
    return ch === ch.toLowerCase() ? letter.toLowerCase() : letter;
};

// Plays a one-time "decryption" of the text, left to right. The real text is always in
// the DOM for screen readers and crawlers; reduced-motion users just see it.
export default function DecryptText({ text, className = '' }) {
    const [shown, setShown] = useState(text);

    useEffect(() => {
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
        let frame;
        const start = performance.now();
        const tick = (now) => {
            const progress = Math.min(1, (now - start) / DURATION_MS);
            const revealed = Math.floor(progress * text.length);
            setShown([...text].map((ch, i) => (i < revealed ? ch : scramble(ch))).join(''));
            if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [text]);

    return (
        <span className={className}>
            <span className="visually-hidden">{text}</span>
            <span aria-hidden="true">{shown}</span>
        </span>
    );
}
