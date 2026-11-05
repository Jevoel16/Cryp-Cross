import { Link } from 'react-router-dom';
import SectionWrapper from '../components/SectionWrapper';
import usePageMeta from '../usePageMeta';

export default function IdeaPage() {
    usePageMeta({
        title: 'How It Works',
        description:
            'How Cryp-Cross works: a daily generated crossword whose clues are encrypted with Caesar, Atbash or Vigenère ciphers, with accounts, streaks and a leaderboard.',
        path: '/idea',
    });
    return (
        <SectionWrapper title="Cryp-Cross: How It Works">
            <article>
                <h2>The idea</h2>
                <p>
                    Crosswords test vocabulary; ciphers test pattern spotting. Cryp-Cross combines both: before you can answer a
                    clue, you have to decrypt it. Everyone gets the same puzzle each day, so you can compare solves with friends.
                </p>
            </article>
            <article>
                <h2>The daily ciphers</h2>
                <ul>
                    <li>
                        <strong>Caesar shift</strong>: every letter moves the same number of places. The shift is secret, so try
                        all 25.
                    </li>
                    <li>
                        <strong>Atbash</strong>: the alphabet is mirrored, A↔Z, B↔Y. The gentlest day of the week.
                    </li>
                    <li>
                        <strong>Vigenère</strong>: a keyword shifts each letter by a different amount. Solve the plain-text key
                        clue first to get the keyword.
                    </li>
                </ul>
            </article>
            <article>
                <h2>Features</h2>
                <ul>
                    <li>A fresh crossword generated every day, the same for everyone</li>
                    <li>A decoder workbench for the day&apos;s cipher</li>
                    <li>Free accounts with email verification</li>
                    <li>Saved progress, answer checking and timed submissions</li>
                    <li>Daily leaderboard, solve streaks and an archive of past puzzles</li>
                </ul>
                <p>
                    Ready? <Link to="/play">Play today&apos;s puzzle</Link> or <Link to="/team">meet the team</Link>.
                </p>
            </article>
        </SectionWrapper>
    );
}
