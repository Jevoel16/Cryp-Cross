import { Link } from 'react-router-dom';
import SectionWrapper from '../components/SectionWrapper';
import usePageMeta from '../usePageMeta';

export default function IdeaPage() {
    usePageMeta({
        title: 'The Idea',
        description: 'The Cryp-Cross idea: daily crosswords, real-time answer validation, leaderboards and tamper-resistant blockchain token rewards.',
        path: '/idea',
    });
    return (
    <SectionWrapper title="Cryp-Cross: The Idea">
        <article>
            <h2>Problem Statement</h2>
            <p>Traditional crossword puzzle platforms, although playable, lack dynamic content and transparent, secure reward systems. This app delivers a new crossword each day with correct entries publicly recorded to prevent duplicate solving. Successful players receive <strong>blockchain-based tokens</strong> as rewards, which can be traded to others.</p>
        </article>
        <article>
            <h2>Key Features</h2>
            <ul>
                <li>Daily Crossword Generation</li>
                <li>User Registration and Authentication</li>
                <li>Real-Time Answer Submission and Validation</li>
                <li>Leaderboard and Progress Tracking</li>
                <li>Blockchain-Based Rewards</li>
                <li>Token Trading System</li>
                <li>Puzzle and User Data Management</li>
            </ul>
        </article>
        <article>
            <h2>Emerging Technology Integration</h2>
            <p>A built-in blockchain ledger records, verifies, and secures each player’s earned puzzle rewards, ensuring every achievement is transparently tracked and tamper-resistant without relying on external platforms. This approach brings trust, verifiability, and accountability to user incentives within the Cryp-Cross ecosystem.</p>
            <p><Link to="/team">Meet the team</Link> building it.</p>
        </article>
    </SectionWrapper>
    );
}
