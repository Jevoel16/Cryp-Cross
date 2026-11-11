import { useEffect, useState } from 'react';
import { ChevronIcon, PauseIcon, PlayIcon } from './Icons';

// Root-relative paths so images also load on nested routes.
const TEAM_MEMBERS = [
  { name: 'Jev', role: 'Project Lead', img: '/img/pic1.webp' },
  { name: 'Jev', role: 'Front-End Specialist', img: '/img/pic2.webp' },
  { name: 'Jev', role: 'Back-End Specialist', img: '/img/pic1.webp' },
  { name: 'Jev', role: 'Database Administrator', img: '/img/pic2.webp' },
  { name: 'Jev, Mark, & Al', role: 'Quality Tester', img: '/img/pic3.webp' },
];

const AUTO_MS = 6000;
const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export default function TeamCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  // Auto-advance is opt-out, and never starts for reduced-motion users.
  const [playing, setPlaying] = useState(() => !prefersReducedMotion());
  const currentMember = TEAM_MEMBERS[currentIndex];

  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => setCurrentIndex((i) => (i + 1) % TEAM_MEMBERS.length), AUTO_MS);
    return () => clearInterval(id);
  }, [playing, currentIndex]);

  const step = (delta) => setCurrentIndex((i) => (i + delta + TEAM_MEMBERS.length) % TEAM_MEMBERS.length);

  return (
    <div>
      <div id="teamContainer">
        <button id="prevTeamBtn" type="button" onClick={() => step(-1)} aria-label="Previous team member">
          <ChevronIcon direction="left" />
        </button>
        <div id="teamProfile" aria-live={playing ? 'off' : 'polite'}>
          <img
            id="teamImage"
            src={currentMember.img}
            alt={`${currentMember.name}, ${currentMember.role}`}
            width="200"
            height="200"
            decoding="async"
          />
          <div id="teamText">
            <h2 id="teamName">{currentMember.name}</h2>
            <p id="teamRole">{currentMember.role}</p>
          </div>
        </div>
        <button id="nextTeamBtn" type="button" onClick={() => step(1)} aria-label="Next team member">
          <ChevronIcon direction="right" />
        </button>
      </div>
      <p className="team-pause">
        <button type="button" className="link-btn" onClick={() => setPlaying((p) => !p)} aria-pressed={!playing}>
          {playing ? <PauseIcon /> : <PlayIcon />}
          {playing ? 'Pause' : 'Play'}
        </button>
      </p>
    </div>
  );
}
