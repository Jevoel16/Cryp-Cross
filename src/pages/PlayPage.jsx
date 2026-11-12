import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SectionWrapper from '../components/SectionWrapper';
import { BoardSkeleton } from '../components/Skeleton';
import PuzzleBoard from '../components/PuzzleBoard';
import Timer from '../components/Timer';
import usePageMeta from '../usePageMeta';
import useCrossword from '../hooks/useCrossword';
import useLoad from '../hooks/useLoad';
import { api } from '../api';
import { useAuth } from '../auth/authContext';
import { buildBoard, entryCells, isFilled, lettersToRows, rowsToLetters } from '../lib/grid';
import { formatDuration } from '../lib/format';
import { ClockIcon } from '../components/Icons';
import { fetchTodayPuzzle } from '../lib/todayPuzzle';
import { readDraft, readGuestClock, writeDraft, writeGuestClock } from '../lib/playStorage';
import { PHASE, PLAYER_EVENT, initialPlayerState, playerReducer } from '../lib/playerMachine';
import { PLAY_STATUS, PROGRESS_EVENT, initialProgress, playStatus, progressReducer } from '../lib/playStatus';
import { LOAD } from '../lib/loadMachine';

const loadToday = () => fetchTodayPuzzle();

const SAVE_DELAY_MS = 1000;
const NO_STATUS = {};
const hasLetters = (rows) => Array.isArray(rows) && rows.some((row) => /[A-Z]/.test(row));

// Players rank via a server attempt in `progress`; guests get the same Check and Submit, never stored.
function PuzzlePlayer({ puzzle, progress, initialRows, ranked = true }) {
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
  const [state, dispatch] = useReducer(playerReducer, { progress, guestClock }, initialPlayerState);
  const { phase, result, feedback, checked, saveError } = state;
  const solved = phase === PHASE.SOLVED;
  const busy = phase === PHASE.REQUESTING;
  const rows = lettersToRows(board, letters);
  const filled = isFilled(board, letters);
  const rowsKey = rows.join('|');
  const lastSaved = useRef(rowsKey);

  // Marked as saved only once the server accepted it, so a failed save is retried.
  const save = useCallback(
    (key) =>
      api('/puzzles/today/progress', { method: 'PUT', body: { date: puzzle.date, grid: key.split('|') } }).then(
        () => {
          lastSaved.current = key;
          dispatch({ type: PLAYER_EVENT.SAVED });
        },
        (error) => dispatch({ type: PLAYER_EVENT.SAVE_FAILED, error: error.message }),
      ),
    [puzzle.date],
  );

  // Local draft always; server save (debounced) for players.
  useEffect(() => {
    writeDraft(puzzle.date, rowsKey.split('|'));
    if (!progress || solved || rowsKey === lastSaved.current) return undefined;
    const id = setTimeout(() => save(rowsKey), SAVE_DELAY_MS);
    return () => clearTimeout(id);
  }, [rowsKey, puzzle.date, progress, solved, save]);

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

  // Returns the response data, or null after reporting the failure.
  const request = async (path) => {
    dispatch({ type: PLAYER_EVENT.REQUEST });
    try {
      return await api(path, { method: 'POST', body: { date: puzzle.date, grid: rows } });
    } catch (error) {
      dispatch({ type: PLAYER_EVENT.FAILED, error: error.message });
      return null;
    }
  };

  const onCheck = async () => {
    const data = await request(isGuest ? '/puzzles/today/guest-check' : '/puzzles/today/check');
    if (data) dispatch({ type: PLAYER_EVENT.CHECKED, rowsKey, entries: data.entries });
  };

  const onSubmit = async () => {
    if (isGuest) return onGuestSubmit();
    const data = await request('/puzzles/today/submit');
    if (!data) return;
    if (data.solved) {
      dispatch({ type: PLAYER_EVENT.SOLVED, result: { timeMs: data.timeMs, rank: data.rank, guest: false } });
    } else {
      dispatch({ type: PLAYER_EVENT.NOT_SOLVED, wrong: data.wrong, incomplete: data.incomplete });
    }
  };

  const onGuestSubmit = async () => {
    const data = await request('/puzzles/today/guest-check');
    if (!data) return;
    if (!data.solved) {
      const count = (status) => data.entries.filter((s) => s === status).length;
      dispatch({ type: PLAYER_EVENT.NOT_SOLVED, wrong: count('wrong'), incomplete: count('incomplete') });
      return;
    }
    // A draft restored from before the clock existed has no start time, so no time to show.
    const start = guestClock?.startedAt;
    const clock = { startedAt: start ?? Date.now(), timeMs: start ? Math.max(0, Date.now() - start) : null };
    writeGuestClock(puzzle.date, clock);
    setGuestClock(clock);
    dispatch({ type: PLAYER_EVENT.SOLVED, result: { timeMs: clock.timeMs, guest: true } });
  };

  return (
    <PuzzleBoard puzzle={puzzle} crossword={crossword} marks={marks} clueStatus={clueStatus} locked={solved}>
      <div className="play-actions">
        <span className={`mode-badge ${isGuest || !ranked ? 'guest' : 'ranked'}`}>
          {isGuest ? 'Guest · unranked' : ranked ? 'Ranked' : 'Demo · unranked'}
        </span>
        {startedAt && !(solved && result.timeMs === null) && (
          <Timer startedAt={startedAt} timeMs={result?.timeMs ?? null} />
        )}
        {!startedAt && !solved && (
          <span className="timer idle">
            <ClockIcon />
            Starts when you type
          </span>
        )}
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
          {result.rank ? ` · #${result.rank} today` : ''}
          {ranked ? '. ' : ' · the demo account is not ranked. '}
          <Link to="/leaderboard">See the leaderboard</Link>.
        </p>
      )}
      {solved && result.guest && (
        <p className="form-message success" role="status">
          {result.timeMs === null ? 'Solved' : `Solved in ${formatDuration(result.timeMs)}`} · not ranked.{' '}
          <Link to="/login" state={{ from: '/play' }}>
            Sign in with GitHub or Google
          </Link>{' '}
          to join the leaderboard tomorrow.
        </p>
      )}
      {feedback && (
        <p className={`form-message ${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>
          {feedback.text}
        </p>
      )}
      {saveError && (
        <p className="form-message error" role="alert">
          Not saved: {saveError}{' '}
          <button type="button" className="link-btn" onClick={() => save(rowsKey)}>
            Save again
          </button>
        </p>
      )}
    </PuzzleBoard>
  );
}

function TodayPuzzle({ puzzle }) {
  const { user, loading } = useAuth();
  const [request, dispatch] = useReducer(progressReducer, initialProgress);
  const status = playStatus({ authLoading: loading, user, request });
  const isPlayer = Boolean(user);

  useEffect(() => {
    if (!isPlayer) return;
    api('/puzzles/today/progress').then(
      (progress) => dispatch({ type: PROGRESS_EVENT.LOADED, progress }),
      (err) => dispatch({ type: PROGRESS_EVENT.FAILED, error: err.message }),
    );
  }, [isPlayer, request.tries]);

  switch (status) {
    case PLAY_STATUS.AUTH_LOADING:
    case PLAY_STATUS.LOADING:
      return <BoardSkeleton label="Loading your progress" />;
    case PLAY_STATUS.ERROR:
      return (
        <div className="form-message error" role="alert">
          <p>Your saved progress didn&apos;t load, so the ranked puzzle can&apos;t start yet. {request.error}</p>
          <button type="button" className="secondary-btn" onClick={() => dispatch({ type: PROGRESS_EVENT.RETRY })}>
            Try again
          </button>
        </div>
      );
    case PLAY_STATUS.GUEST:
      return (
        <>
          <p className="play-hint">
            You&apos;re playing as a guest: Check and Submit work, but your time isn&apos;t ranked.{' '}
            <Link to="/login" state={{ from: '/play' }}>
              Sign in
            </Link>{' '}
            with GitHub or Google to save progress across devices and join the{' '}
            <Link to="/leaderboard">leaderboard</Link>.
          </p>
          <PuzzlePlayer key="guest" puzzle={puzzle} progress={null} initialRows={readDraft(puzzle.date)} />
        </>
      );
    case PLAY_STATUS.READY: {
      // Server copy wins when it has letters; otherwise keep what this browser had.
      const { progress } = request;
      const initialRows = hasLetters(progress.grid) ? progress.grid : readDraft(puzzle.date);
      return (
        <PuzzlePlayer key="player" puzzle={puzzle} progress={progress} initialRows={initialRows} ranked={!user.demo} />
      );
    }
    default:
      throw new Error(`Unknown play status: ${status}`);
  }
}

function Today({ load }) {
  switch (load.status) {
    case LOAD.PENDING:
      return <BoardSkeleton label="Loading today's puzzle" />;
    case LOAD.FAILED:
      return (
        <p className="form-message error" role="alert">
          {load.error}
        </p>
      );
    case LOAD.LOADED:
      return (
        <>
          <TodayPuzzle key={load.data.date} puzzle={load.data} />
          <p className="archive-link">
            <Link to="/puzzles">Past puzzles</Link> · <Link to="/leaderboard">Today&apos;s leaderboard</Link>
          </p>
        </>
      );
    default:
      throw new Error(`Unknown load status: ${load.status}`);
  }
}

export default function PlayPage() {
  usePageMeta({
    title: "Today's Puzzle",
    description:
      "Play today's Cryp-Cross: a free daily crossword whose clues are encrypted with a classical cipher. Decode the clues, fill the grid and race the leaderboard.",
    path: '/play',
  });
  const load = useLoad(loadToday);
  const title = load.status === LOAD.LOADED ? `Today's Puzzle · ${load.data.date}` : "Today's Puzzle";

  return (
    <SectionWrapper title={title} className="play-section">
      <Today load={load} />
    </SectionWrapper>
  );
}
