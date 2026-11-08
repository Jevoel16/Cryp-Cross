import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import usePageMeta from '../usePageMeta';
import { api } from '../api';
import { useAuth } from '../auth/authContext';
import { CIPHER_INFO } from '../lib/ciphers';

const STEPS = [
    {
        title: 'Decode',
        text: "Each clue is encrypted with the day's cipher. Use the decoder to find the shift, mirror or keyword.",
    },
    {
        title: 'Fill',
        text: 'Type answers straight into the grid. Check marks each clue right or wrong without giving anything away.',
    },
    {
        title: 'Race',
        text: 'Sign in and the server times your solve. The fastest times of the day make the leaderboard.',
    },
];

// A real (tiny) board: CODES across, CRYPT and SHIFT down; '#' is a block, '.' an empty cell.
const SAMPLE = ['CODES', 'R###H', 'Y###I', 'P###.', '.###.'];
const SAMPLE_NUMBERS = { '0,0': 1, '0,4': 2 };

function SampleBoard() {
    return (
        <figure className="hero-sample">
            <div className="crossword-grid" style={{ '--cols': 5 }} aria-hidden="true">
                {SAMPLE.flatMap((row, r) =>
                    [...row].map((ch, c) =>
                        ch === '#' ? (
                            <span key={`${r},${c}`} className="cell block" />
                        ) : (
                            <span key={`${r},${c}`} className={`cell${r === 0 ? ' in-entry' : ''}`}>
                                {SAMPLE_NUMBERS[`${r},${c}`] && <span className="cell-number">{SAMPLE_NUMBERS[`${r},${c}`]}</span>}
                                {ch !== '.' && <span className="cell-letter">{ch}</span>}
                            </span>
                        )
                    )
                )}
            </div>
            <figcaption>
                <span className="sample-label">1 Across</span> <code className="cipher-text">Vhfuhw phvvdjhv</code>
                <span className="sample-decoded">Caesar shift 3: Secret messages (5)</span>
            </figcaption>
        </figure>
    );
}

export default function HomePage() {
    usePageMeta({
        title: 'Cryp-Cross',
        description:
            'Cryp-Cross is a free daily cryptographic crossword: every clue is hidden behind a classical cipher. Decode the clues, fill the grid and climb the leaderboard.',
        path: '/',
    });
    const { user, loading } = useAuth();
    const [today, setToday] = useState(null);

    useEffect(() => {
        // Only a summary line; the page works without it.
        api('/puzzles/today').then(setToday, () => setToday(null));
    }, []);

    return (
        <div className="home">
            <section className="hero" aria-labelledby="hero-title">
                <div className="hero-copy">
                    <h1 id="hero-title">A daily crossword with encrypted clues</h1>
                    <p className="lead">
                        Crack each clue&apos;s Caesar shift, Atbash mirror or Vigenère keyword, then fill the grid. One new
                        puzzle for everyone, every day.
                    </p>
                    <div className="cta-row">
                        <Link to="/play" className="primary-btn">
                            Play today&apos;s puzzle
                        </Link>
                        {!loading && !user && (
                            <Link to="/login" className="secondary-link">
                                Sign in
                            </Link>
                        )}
                        {user && (
                            <Link to="/leaderboard" className="secondary-link">
                                Leaderboard
                            </Link>
                        )}
                    </div>
                    <p className="today-line">
                        {today &&
                            `Today: ${today.date} · ${CIPHER_INFO[today.cipher?.type]?.name ?? 'Cipher'} · ${today.entries?.length ?? 0} clues`}
                    </p>
                </div>
                <SampleBoard />
            </section>

            <section className="steps" aria-labelledby="steps-title">
                <h2 id="steps-title">How a day goes</h2>
                <ol className="step-list">
                    {STEPS.map((step) => (
                        <li key={step.title}>
                            <h3>{step.title}</h3>
                            <p>{step.text}</p>
                        </li>
                    ))}
                </ol>
            </section>

            <p className="home-links">
                <Link to="/idea">How it works</Link> · <Link to="/puzzles">Past puzzles</Link> · <Link to="/team">Team</Link>
            </p>
        </div>
    );
}
