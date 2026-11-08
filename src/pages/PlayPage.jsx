import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SectionWrapper from '../components/SectionWrapper';
import { BoardSkeleton } from '../components/Skeleton';
import PuzzleBoard from '../components/PuzzleBoard';
import usePageMeta from '../usePageMeta';
import useCrossword from '../hooks/useCrossword';
import { api } from '../api';
import { useAuth } from '../auth/authContext';
import { buildBoard, entryCells, isFilled, lettersToRows, rowsToLetters } from '../lib/grid';
import { formatDuration } from '../lib/format';
import { ClockIcon } from '../components/Icons';

const SAVE_DELAY_MS = 1000;
const NO_STATUS = {};
const storageKey = (date) => `cc:grid:${date}`;
const guestKey = (date) => `cc:guest:${date}`;

// Per-browser draft of the grid, so a refresh doesn't lose typed letters.
function readDraft(date) {
    try {
        return JSON.parse(localStorage.getItem(storageKey(date)));
    } catch {
        return null;
    }
}

function writeDraft(date, rows) {
    try {
        localStorage.setItem(storageKey(date), JSON.stringify(rows));
    } catch {
        // Storage blocked: the draft just won't survive a refresh.
    }
}

// Guest solves are timed in this browser only; they never reach the server.
function readGuestClock(date) {
    try {
        const saved = JSON.parse(localStorage.getItem(guestKey(date)));
        return saved && Number.isFinite(saved.startedAt) ? saved : null;
    } catch {
        return null;
    }
}

function writeGuestClock(date, clock) {
    try {
        localStorage.setItem(guestKey(date), JSON.stringify(clock));
    } catch {
        // Storage blocked: the guest timer restarts on refresh.
    }
}

const hasLetters = (rows) => Array.isArray(rows) && rows.some((row) => /[A-Z]/.test(row));

function Timer({ startedAt, timeMs }) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        if (timeMs !== null) return undefined;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [timeMs]);
    const elapsed = timeMs ?? Math.max(0, now - new Date(startedAt).getTime());
    return (
        <span className="timer" aria-label={`Time ${formatDuration(elapsed)}`}>
            <ClockIcon />
            {formatDuration(elapsed)}
        </span>
    );
}

// The board itself. Players (verified accounts) have a server attempt in `progress` and
// rank on the leaderboard; guests get the same Check and Submit, graded but never stored.
function PuzzlePlayer({ puzzle, progress, initialRows }) {
    const isGuest = !progress;
    const board = useMemo(() => buildBoard(puzzle), [puzzle]);
    const grid = useCrossword(puzzle, rowsToLetters(board, initialRows));
    const { letters } = grid;
    const [guestClock, setGuestClock] = useState(() => (isGuest ? readGuestClock(puzzle.date) : null));
    // A guest's clock starts with the first letter typed.
    const { handleKey } = grid;
    const crossword = useMemo(() => {
        if (!isGuest || guestClock) return grid;
        return {
            ...grid,
            handleKey: (key, options) => {
                const handled = handleKey(key, options);
                if (handled && /^[a-zA-Z]$/.test(key) && !options?.locked) {
                    const clock = { startedAt: Date.now() };
                    writeGuestClock(puzzle.date, clock);
                    setGuestClock(clock);
                }
                return handled;
            },
        };
    }, [grid, handleKey, isGuest, guestClock, puzzle.date]);
    const [result, setResult] = useState(() => {
        if (progress?.solvedAt) return { solved: true, timeMs: progress.timeMs };
        if (guestClock && 'timeMs' in guestClock) return { solved: true, timeMs: guestClock.timeMs, guest: true };
        return null;
    });
    // Check results belong to the grid they were made for; any edit hides them.
    const [checked, setChecked] = useState({ rowsKey: null, status: {} });
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);
    const solved = Boolean(result?.solved);
    const rows = lettersToRows(board, letters);
    const filled = isFilled(board, letters);
    const rowsKey = rows.join('|');
    const lastSaved = useRef(rowsKey);

    // Local draft always; server save (debounced) for players.
    useEffect(() => {
        writeDraft(puzzle.date, rowsKey.split('|'));
        if (!progress || solved || rowsKey === lastSaved.current) return undefined;
        const id = setTimeout(() => {
            lastSaved.current = rowsKey;
            api('/puzzles/today/progress', { method: 'PUT', body: { date: puzzle.date, grid: rowsKey.split('|') } }).catch(
                (error) => setMessage({ type: 'error', text: `Not saved: ${error.message}` })
            );
        }, SAVE_DELAY_MS);
        return () => clearTimeout(id);
    }, [rowsKey, puzzle.date, progress, solved]);

    const startedAt = isGuest ? guestClock?.startedAt : progress.startedAt;

    const clueStatus = checked.rowsKey === rowsKey ? checked.status : NO_STATUS;

    const marks = useMemo(() => {
        const out = {};
        Object.entries(clueStatus).forEach(([index, status]) => {
            if (status === 'incomplete') return;
            entryCells(puzzle.entries[index]).forEach(([r, c]) => {
                const key = `${r},${c}`;
                // A cell in any wrong entry shows as wrong.
                if (out[key] !== 'wrong') out[key] = status;
            });
        });
        return out;
    }, [clueStatus, puzzle.entries]);

    const run = async (path) => {
        setBusy(true);
        setMessage(null);
        try {
            return await api(path, { method: 'POST', body: { date: puzzle.date, grid: rows } });
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
            return null;
        } finally {
            setBusy(false);
        }
    };

    const onCheck = async () => {
        const data = await run(isGuest ? '/puzzles/today/guest-check' : '/puzzles/today/check');
        if (!data) return;
        setChecked({ rowsKey, status: Object.fromEntries(data.entries.map((s, i) => [i, s])) });
        const wrong = data.entries.filter((s) => s === 'wrong').length;
        const right = data.entries.filter((s) => s === 'right').length;
        setMessage({
            type: wrong ? 'error' : 'success',
            text: `${right} right, ${wrong} wrong, ${data.entries.length - right - wrong} unfinished.`,
        });
    };

    const onSubmit = async () => {
        if (isGuest) return onGuestSubmit();
        const data = await run('/puzzles/today/submit');
        if (!data) return;
        if (data.solved) {
            setResult(data);
            setMessage(null);
        } else {
            setMessage({
                type: 'error',
                text: `Not quite: ${data.wrong} wrong and ${data.incomplete} unfinished. Use Check to find them.`,
            });
        }
    };

    const onGuestSubmit = async () => {
        const data = await run('/puzzles/today/guest-check');
        if (!data) return;
        if (!data.solved) {
            const wrong = data.entries.filter((s) => s === 'wrong').length;
            const incomplete = data.entries.filter((s) => s === 'incomplete').length;
            setMessage({
                type: 'error',
                text: `Not quite: ${wrong} wrong and ${incomplete} unfinished. Use Check to find them.`,
            });
            return;
        }
        // A draft restored from before the clock existed has no start time, so no time to show.
        const start = guestClock?.startedAt;
        const clock = { startedAt: start ?? Date.now(), timeMs: start ? Math.max(0, Date.now() - start) : null };
        writeGuestClock(puzzle.date, clock);
        setGuestClock(clock);
        setResult({ solved: true, timeMs: clock.timeMs, guest: true });
    };

    return (
        <PuzzleBoard puzzle={puzzle} crossword={crossword} marks={marks} clueStatus={clueStatus} locked={solved}>
            <div className="play-actions">
                <span className={`mode-badge ${isGuest ? 'guest' : 'ranked'}`}>{isGuest ? 'Guest · unranked' : 'Ranked'}</span>
                {startedAt && !(solved && result.timeMs === null) && (
                    <Timer startedAt={startedAt} timeMs={result?.timeMs ?? null} />
                )}
                {!startedAt && !solved && <span className="timer idle">
                        <ClockIcon />
                        Starts when you type
                    </span>}
                {!solved && (
                    <>
                        <button type="button" className="secondary-btn" onClick={onCheck} disabled={busy}>
                            Check
                        </button>
                        <button
                            type="button"
                            className="submit-btn"
                            onClick={onSubmit}
                            disabled={busy || !filled}
                            aria-describedby={filled ? undefined : 'submit-hint'}
                        >
                            Submit
                        </button>
                        {!filled && (
                            <p id="submit-hint" className="submit-hint">
                                Fill every cell to submit.
                            </p>
                        )}
                    </>
                )}
            </div>
            {solved && !result.guest && (
                <p className="form-message success" role="status">
                    Solved in {formatDuration(result.timeMs)}
                    {result.rank ? ` · #${result.rank} today` : ''}. <Link to="/leaderboard">See the leaderboard</Link>.
                </p>
            )}
            {solved && result.guest && (
                <p className="form-message success" role="status">
                    {result.timeMs === null ? 'Solved' : `Solved in ${formatDuration(result.timeMs)}`} · not ranked.{' '}
                    <Link to="/login" state={{ from: '/play' }}>Sign in with GitHub or Google</Link> to join the
                    leaderboard tomorrow.
                </p>
            )}
            {message && (
                <p className={`form-message ${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>
                    {message.text}
                </p>
            )}
        </PuzzleBoard>
    );
}

function TodayPuzzle({ puzzle }) {
    const { user, loading } = useAuth();
    // Every account comes from a GitHub/Google sign-in, so any signed-in player is ranked.
    const isPlayer = Boolean(user);
    const [progress, setProgress] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isPlayer) return;
        api('/puzzles/today/progress').then(setProgress, (err) => setError(err.message));
    }, [isPlayer]);

    if (loading || (isPlayer && !progress && !error)) return <BoardSkeleton label="Loading your progress" />;

    // Server copy wins when it has letters; otherwise keep what this browser had.
    const draft = readDraft(puzzle.date);
    const initialRows = progress && hasLetters(progress.grid) ? progress.grid : draft;

    return (
        <>
            {error && (
                <p className="form-message error" role="alert">
                    {error}
                </p>
            )}
            {!user && (
                <p className="play-hint">
                    You&apos;re playing as a guest: Check and Submit work, but your time isn&apos;t ranked.{' '}
                    <Link to="/login" state={{ from: '/play' }}>
                        Sign in
                    </Link>{' '}
                    with GitHub or Google to save progress across devices and join the{' '}
                    <Link to="/leaderboard">leaderboard</Link>.
                </p>
            )}
            <PuzzlePlayer
                key={progress ? 'player' : 'guest'}
                puzzle={puzzle}
                progress={isPlayer ? progress : null}
                initialRows={initialRows}
            />
        </>
    );
}

export default function PlayPage() {
    usePageMeta({
        title: "Today's Puzzle",
        description:
            "Play today's Cryp-Cross: a free daily crossword whose clues are encrypted with a classical cipher. Decode the clues, fill the grid and race the leaderboard.",
        path: '/play',
    });
    const [puzzle, setPuzzle] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        api('/puzzles/today').then(setPuzzle, (err) => setError(err.message));
    }, []);

    return (
        <SectionWrapper title={puzzle ? `Today's Puzzle · ${puzzle.date}` : "Today's Puzzle"} className="play-section">
            {error && (
                <p className="form-message error" role="alert">
                    {error}
                </p>
            )}
            {!puzzle && !error && <BoardSkeleton label="Loading today's puzzle" />}
            {puzzle && <TodayPuzzle key={puzzle.date} puzzle={puzzle} />}
            {puzzle && (
                <p className="archive-link">
                    <Link to="/puzzles">Past puzzles</Link> · <Link to="/leaderboard">Today&apos;s leaderboard</Link>
                </p>
            )}
        </SectionWrapper>
    );
}
