import { useState, useEffect, useRef, useCallback } from 'react';

// Root-relative paths so images also load on nested routes.
const TEAM_MEMBERS = [
    { name: 'Jev', role: 'Project Lead', img: '/img/pic1.webp' },
    { name: 'Jev', role: 'Front-End Specialist', img: '/img/pic2.webp' },
    { name: 'Jev', role: 'Back-End Specialist', img: '/img/pic1.webp' },
    { name: 'Jev', role: 'Database Administrator', img: '/img/pic2.webp' },
    { name: 'Jev, Mark, & Al', role: 'Quality Tester', img: '/img/pic3.webp' },
];

export default function TeamCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFading, setIsFading] = useState(false);
    const autoSwitchRef = useRef(null);
    const currentMember = TEAM_MEMBERS[currentIndex];

    const startAutoSwitch = useCallback(() => {
        if (autoSwitchRef.current) clearInterval(autoSwitchRef.current);
        autoSwitchRef.current = setInterval(() => {
            setCurrentIndex((i) => (i + 1) % TEAM_MEMBERS.length);
        }, 4000);
    }, []);

    // Manual navigation fades out, switches, then restarts the auto-play timer.
    const step = (delta) => {
        if (autoSwitchRef.current) clearInterval(autoSwitchRef.current);
        setIsFading(true);
        setTimeout(() => {
            setCurrentIndex((i) => (i + delta + TEAM_MEMBERS.length) % TEAM_MEMBERS.length);
            setIsFading(false);
            startAutoSwitch();
        }, 500);
    };

    useEffect(() => {
        startAutoSwitch();
        return () => {
            if (autoSwitchRef.current) clearInterval(autoSwitchRef.current);
        };
    }, [startAutoSwitch]);

    return (
        <div id="teamContainer">
            <button id="prevTeamBtn" onClick={() => step(-1)} aria-label="Previous team member">&#8592;</button>
            <div id="teamProfile" className={isFading ? 'fade-out' : ''}>
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
            <button id="nextTeamBtn" onClick={() => step(1)} aria-label="Next team member">&#8594;</button>
        </div>
    );
}
