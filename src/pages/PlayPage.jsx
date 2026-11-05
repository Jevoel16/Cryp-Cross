import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SectionWrapper from '../components/SectionWrapper';
import PuzzleBoard from '../components/PuzzleBoard';
import usePageMeta from '../usePageMeta';
import useCrossword from '../hooks/useCrossword';
import { api } from '../api';
import { useAuth } from '../auth/authContext';
import { buildBoard, entryCells, isFilled, lettersToRows, rowsToLetters } from '../lib/grid';
import { formatDuration } from '../lib/format';

const SAVE_DELAY_MS = 1000;
const NO_STATUS = {};
const storageKey = (date) => `cc:grid:${date}`;

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
            ⏱ {formatDuration(elapsed)}
        </span>
    );
}

// The board itself. `progress` is the server attempt for verified players, else null.
function PuzzlePlayer({ puzzle, progress, initialRows }) {
    const board = useMemo(() => buildBoard(puzzle), [puzzle]);
    const crossword = useCrossword(puzzle, rowsToLetters(board, initialRows));
    const { letters } = crossword;
    const [result, setResult] = useState(() =>
        progress?.solvedAt ? { solved: true, timeMs: progress.timeMs } : null
    );
    // Check results belong to the grid they were made for; any edit hides them.
    const [checked, setChecked] = useState({ rowsKey: null, status: {} });
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);
    const solved = Boolean(result?.solved);
    const rows = lettersToRows(board, letters);
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
        const data = await run('/puzzles/today/check');
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

    return (
        <PuzzleBoard puzzle={puzzle} crossword={crossword} marks={marks} clueStatus={clueStatus} locked={solved}>
            {progress && (
                <div className="play-actions">
                    <Timer startedAt={progress.startedAt} timeMs={result?.timeMs ?? null} />
                    {!solved && (
                        <>
                            <button type="button" className="primary-btn" onClick={onCheck} disabled={busy}>
                                Check
                            </button>
                            <button
                                type="button"
                                className="submit-btn"
                                onClick={onSubmit}
                                disabled={busy || !isFilled(board, letters)}
                                title={isFilled(board, letters) ? undefined : 'Fill every cell first'}
                            >
                                Submit
                            </button>
                        </>
                    )}
                </div>
            )}
            {solved && (
                <p className="form-message success" role="status">
                    Solved in {formatDuration(result.timeMs)}
                    {result.rank ? ` · #${result.rank} today` : ''}. <Link to="/leaderboard">See the leaderboard</Link>.
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
    const isPlayer = Boolean(user?.emailVerified);
    const [progress, setProgress] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isPlayer) return;
        api('/puzzles/today/progress').then(setProgress, (err) => setError(err.message));
    }, [isPlayer]);

    if (loading || (isPlayer && !progress && !error)) return <p>Loading your progress...</p>;

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
                    <Link to="/login" state={{ from: '/play' }}>
                        Log in
                    </Link>{' '}
                    or <Link to="/signup">sign up</Link> to save progress, check answers, submit a timed solve and join the{' '}
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
            {!puzzle && !error && <p>Loading today&apos;s puzzle...</p>}
            {puzzle && <TodayPuzzle key={puzzle.date} puzzle={puzzle} />}
            {puzzle && (
                <p className="archive-link">
                    <Link to="/puzzles">Past puzzles</Link> · <Link to="/leaderboard">Today&apos;s leaderboard</Link>
                </p>
            )}
        </SectionWrapper>
    );
}
