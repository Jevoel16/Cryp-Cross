import { Link } from 'react-router-dom';
import SectionWrapper from '../components/SectionWrapper';
import usePageMeta from '../usePageMeta';

export default function HomePage() {
    usePageMeta({
        title: 'Cryp-Cross',
        description:
            'Cryp-Cross is a free daily cryptographic crossword: every clue is hidden behind a classical cipher. Decode the clues, fill the grid and climb the leaderboard.',
        path: '/',
    });
    return (
        <SectionWrapper title="Cryp-Cross">
            <article>
                <p className="lead">A new cryptographic crossword every day.</p>
                <p>
                    Every clue in today&apos;s grid is encrypted with a classical cipher: a <strong>Caesar shift</strong>, an{' '}
                    <strong>Atbash</strong> mirror or a <strong>Vigenère</strong> keyword. Crack the cipher, read the clues, then
                    fill the grid. The built-in decoder helps you test your guesses.
                </p>
                <p>
                    Create a free account to save your progress, check your answers, submit your solve and see how your time
                    compares on the daily leaderboard. Keep a streak going by solving every day.
                </p>
                <p className="cta-row">
                    <Link to="/play" className="primary-btn">Play today&apos;s puzzle</Link>
                    <Link to="/signup" className="secondary-link">Create an account</Link>
                </p>
                <p>
                    Read <Link to="/idea">how Cryp-Cross works</Link> and <Link to="/team">meet the team</Link> behind it.
                </p>
            </article>
        </SectionWrapper>
    );
}
