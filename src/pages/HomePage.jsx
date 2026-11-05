import { Link } from 'react-router-dom';
import SectionWrapper from '../components/SectionWrapper';
import usePageMeta from '../usePageMeta';

export default function HomePage() {
    usePageMeta({
        title: 'Cryp-Cross',
        description: 'Cryp-Cross is a crypto crossword challenge: solve a fresh crossword every day and earn blockchain-based token rewards on a verifiable ledger.',
        path: '/',
    });
    return (
    <SectionWrapper title="Cryp-Cross">
        &nbsp;
        <article>
             &nbsp;
            <p>
                Welcome to Cryp-Cross, the ultimate Crypto Crossword Challenge!
            </p>
             &nbsp;
            <p>
                Cryp-Cross is a next-generation crossword puzzle platform that merges timeless word challenges with the transparency and excitement of <strong>blockchain rewards</strong>. Each day, users can solve fresh crossword puzzles, earn digital tokens for every correct answer, and track their achievements on an immutable, verifiable ledger.
            </p>
             &nbsp;
            <p>
                Designed for both puzzle enthusiasts and tech-savvy players, Cryp-Cross brings together classic gameplay and modern innovation in a secure, interactive environment.
            </p>
             &nbsp;
            <p>
                Explore the <Link to="/idea">project overview and unique features</Link>, and <Link to="/team">meet the team</Link> driving its development.
            </p>
             &nbsp;
        </article>
         &nbsp;
    </SectionWrapper>
    );
}
