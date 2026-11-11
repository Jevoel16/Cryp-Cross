import SectionWrapper from '../components/SectionWrapper';
import TeamCarousel from '../components/TeamCarousel';
import usePageMeta from '../usePageMeta';

export default function TeamPage() {
  usePageMeta({
    title: 'Team',
    description:
      'Meet the Cryp-Cross team: project lead, front-end and back-end specialists, database administrator and quality testers.',
    path: '/team',
  });
  return (
    <SectionWrapper title="Cryp-Cross Team">
      <TeamCarousel />
    </SectionWrapper>
  );
}
