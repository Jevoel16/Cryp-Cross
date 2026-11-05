import { Link } from 'react-router-dom';
import SectionWrapper from '../components/SectionWrapper';
import usePageMeta from '../usePageMeta';

export default function NotFoundPage() {
    usePageMeta({
        title: 'Page Not Found',
        description: 'The page you requested does not exist on Cryp-Cross.',
        noindex: true,
    });
    return (
        <SectionWrapper title="404 Not Found">
            <p>The page you requested does not exist. <Link to="/">Go Home</Link></p>
        </SectionWrapper>
    );
}
