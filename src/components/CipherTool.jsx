import { useState } from 'react';
import { atbashDecode, caesarDecode, CIPHER_INFO, vigenereDecode } from '../lib/ciphers';

// Decoder workbench for the day's cipher. `text` is the selected clue's cipher text.
export default function CipherTool({ cipher, text }) {
    const [shift, setShift] = useState(1);
    const [showAll, setShowAll] = useState(false);
    const [keyword, setKeyword] = useState('');
    const info = CIPHER_INFO[cipher.type];

    let output = null;
    if (cipher.type === 'caesar') output = caesarDecode(text, shift);
    if (cipher.type === 'atbash') output = atbashDecode(text);
    if (cipher.type === 'vigenere') output = vigenereDecode(text, keyword);

    return (
        <aside className="cipher-tool" aria-labelledby="cipher-tool-title">
            <h2 id="cipher-tool-title">Decoder: {info.name}</h2>
            <p className="cipher-help">{info.help}</p>

            {cipher.type === 'vigenere' && (
                <div className="key-clue">
                    <strong>Key clue</strong> (plain text, {cipher.keyLength} letters): {cipher.keyClue}
                    {cipher.key && <span className="answer-text"> {cipher.key}</span>}
                </div>
            )}

            {cipher.type === 'caesar' && (
                <div className="form-group">
                    <label htmlFor="caesar-shift">Shift back by {shift}</label>
                    <input
                        id="caesar-shift"
                        type="range"
                        min="1"
                        max="25"
                        value={shift}
                        onChange={(e) => setShift(Number(e.target.value))}
                    />
                </div>
            )}

            {cipher.type === 'vigenere' && (
                <div className="form-group">
                    <label htmlFor="vigenere-key">Keyword</label>
                    <input
                        id="vigenere-key"
                        value={keyword}
                        maxLength={20}
                        autoComplete="off"
                        onChange={(e) => setKeyword(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())}
                        placeholder="Answer to the key clue"
                    />
                </div>
            )}

            <p className="cipher-output" aria-live="polite">
                <span className="label">Decoded</span> <code>{output ?? 'Enter the keyword to decode'}</code>
            </p>

            {cipher.type === 'caesar' && (
                <>
                    <button type="button" className="link-btn" onClick={() => setShowAll((v) => !v)}>
                        {showAll ? 'Hide all shifts' : 'Show all 25 shifts'}
                    </button>
                    {showAll && (
                        <ol className="all-shifts">
                            {Array.from({ length: 25 }, (_, i) => i + 1).map((s) => (
                                <li key={s}>
                                    <button type="button" className="link-btn" onClick={() => setShift(s)}>
                                        {s}
                                    </button>{' '}
                                    <code>{caesarDecode(text, s)}</code>
                                </li>
                            ))}
                        </ol>
                    )}
                </>
            )}
        </aside>
    );
}
