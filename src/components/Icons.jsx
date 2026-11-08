// One icon set: 24px viewBox, 2px round strokes, sized by CSS (.icon, 18px).
function Icon({ children, className = 'icon' }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            {children}
        </svg>
    );
}

export function SunIcon() {
    return (
        <Icon>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </Icon>
    );
}

export function MoonIcon() {
    return (
        <Icon>
            <path d="M20.5 13.3A8.5 8.5 0 1 1 10.7 3.5a6.6 6.6 0 0 0 9.8 9.8z" />
        </Icon>
    );
}

export function MenuIcon({ open }) {
    return <Icon>{open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}</Icon>;
}

export function ClockIcon() {
    return (
        <Icon>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </Icon>
    );
}

export function ChevronIcon({ direction }) {
    return <Icon>{direction === 'left' ? <path d="M15 6l-6 6 6 6" /> : <path d="M9 6l6 6-6 6" />}</Icon>;
}

export function PauseIcon() {
    return (
        <Icon>
            <path d="M9 6v12M15 6v12" />
        </Icon>
    );
}

export function PlayIcon() {
    return (
        <Icon>
            <path d="M8 5.5v13l10.5-6.5z" />
        </Icon>
    );
}
