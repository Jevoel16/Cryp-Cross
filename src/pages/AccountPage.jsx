import { Navigate, useNavigate } from 'react-router-dom';
import SectionWrapper from '../components/SectionWrapper';
import usePageMeta from '../usePageMeta';
import { useAuth } from '../auth/authContext';

export default function AccountPage() {
    usePageMeta({ title: 'Account', description: 'Your Cryp-Cross account.', noindex: true });
    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();

    if (loading) {
        return (
            <SectionWrapper title="Account">
                <p>Loading...</p>
            </SectionWrapper>
        );
    }
    if (!user) return <Navigate to="/login" replace state={{ from: '/account' }} />;

    const onLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <SectionWrapper title="Account">
            <dl className="account-details">
                <dt>Username</dt>
                <dd>{user.username}</dd>
                <dt>Email</dt>
                <dd>
                    {user.email} {user.emailVerified ? '(verified)' : '(not verified yet)'}
                </dd>
            </dl>
            <button type="button" className="primary-btn" onClick={onLogout}>Log out</button>
        </SectionWrapper>
    );
}
