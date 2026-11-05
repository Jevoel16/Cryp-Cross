import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DecryptText from '../components/DecryptText';
import usePageMeta from '../usePageMeta';
import { api } from '../api';
import { useAuth } from '../auth/authContext';
import { CIPHER_INFO } from '../lib/ciphers';

const STEPS = [
    {
        n: '01',
        title: 'Decode',
        text: "Each clue is encrypted with the day's cipher. Use the decoder to find the shift, mirror or keyword.",
        sample: ['WKUHH OHWWHUV', 'THREE LETTERS'],
    },
    {
        n: '02',
        title: 'Fill',
        text: 'Type answers straight into the grid. Check marks each clue right or wrong without giving anything away.',
        sample: ['C _ P H E R', 'C I P H E R'],
    },
    {
        n: '03',
        title: 'Race',
        text: 'Sign in and your solve is timed by the server. The fastest times of the day make the leaderboard.',
        sample: ['#1  04:12', 'STREAK  7'],
    },
];

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
        // Only a teaser; the page works without it.
        api('/puzzles/today').then(setToday, () => setToday(null));
    }, []);

    return (
        <div className="home">
            <section className="hero" aria-labelledby="hero-title">
                <div className="hero-copy">
                    <p className="eyebrow">Daily cipher crossword</p>
                    <h1 id="hero-title">Cryp-Cross</h1>
                    <p className="hero-tagline">
                        <DecryptText text="Every clue is encrypted." />
                    </p>
                    <p className="lead">
                        Crack a <strong>Caesar shift</strong>, an <strong>Atbash</strong> mirror or a{' '}
                        <strong>Vigenère</strong> keyword, then fill the grid. One new puzzle for everyone, every day.
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
                    {today && (
                        <p className="today-chip">
                            <span className="pulse" aria-hidden="true" />
                            Today · {today.date} · {CIPHER_INFO[today.cipher?.type]?.name ?? 'Cipher'} ·{' '}
                            {today.entries?.length ?? 0} clues
                        </p>
                    )}
                </div>
                <div className="hero-art">
                    <div className="hero-ring" aria-hidden="true" />
                    <img
                        src="/img/logo-440.webp"
                        width="308"
                        height="440"
                        alt="The Cryp-Cross logo, a green puzzle piece"
                        fetchPriority="high"
                    />
                </div>
            </section>

            <section className="steps" aria-labelledby="steps-title">
                <h2 id="steps-title">How a day goes</h2>
                <ol className="step-list">
                    {STEPS.map((step) => (
                        <li key={step.n} className="step-card">
                            <span className="step-n">{step.n}</span>
                            <h3>{step.title}</h3>
                            <p>{step.text}</p>
                            <p className="step-sample" aria-hidden="true">
                                <code className="from">{step.sample[0]}</code>
                                <span className="arrow">→</span>
                                <code className="to">{step.sample[1]}</code>
                            </p>
                        </li>
                    ))}
                </ol>
            </section>

            <section className="tab-content home-more" aria-labelledby="more-title">
                <h2 id="more-title">Play now, sign in to rank</h2>
                <p>
                    Anyone can play today&apos;s puzzle as a guest: Check and Submit work, but guest times aren&apos;t ranked.
                    Create a free account, or continue with GitHub or Google, to save progress across devices, submit a timed
                    solve, keep a streak going and see your name on the daily leaderboard.
                </p>
                <p>
                    Read <Link to="/idea">how Cryp-Cross works</Link>, browse <Link to="/puzzles">past puzzles</Link> or{' '}
                    <Link to="/team">meet the team</Link> behind it.
                </p>
            </section>
        </div>
    );
}
