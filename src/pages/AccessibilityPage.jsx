import SectionWrapper from '../components/SectionWrapper';
import usePageMeta from '../usePageMeta';

const ISSUES_URL = 'https://github.com/Jevoel16/Cryp-Cross/issues/new?template=bug_report.md';

export default function AccessibilityPage() {
  usePageMeta({
    title: 'Accessibility',
    description:
      'Cryp-Cross aims for WCAG 2.2 AA. What has been checked, the gaps that are still open, and how to report a problem.',
    path: '/accessibility',
  });
  return (
    <SectionWrapper title="Accessibility">
      <article>
        <h2>Target</h2>
        <p>
          Cryp-Cross aims to meet <a href="https://www.w3.org/TR/WCAG22/">WCAG 2.2</a> level AA in both the light and
          dark themes.
        </p>
      </article>
      <article>
        <h2>What has been checked</h2>
        <p>Last checked on 17 November 2026, on every public page:</p>
        <ul>
          <li>Lighthouse Accessibility score of 100</li>
          <li>No violations reported by axe-core</li>
          <li>
            A keyboard-only run through the main flow: open today&apos;s puzzle, fill the grid, switch clues, submit,
            sign in
          </li>
          <li>Touch targets of at least 44 by 44 pixels, and no sideways scrolling at 360 pixels wide</li>
          <li>Right and wrong answers shown with a symbol and text, not colour alone</li>
        </ul>
      </article>
      <article>
        <h2>Known gaps</h2>
        <ul>
          <li>
            The crossword has not yet been tested end to end with a screen reader. The grid input announces the active
            clue, its direction and the letters filled so far, but the flow may still be slow to follow by ear.
          </li>
          <li>Sign-in goes through GitHub or Google, so their pages follow their own accessibility standards.</li>
        </ul>
      </article>
      <article>
        <h2>Report a problem</h2>
        <p>
          If something is hard to use with your setup, <a href={ISSUES_URL}>open an issue on GitHub</a>. Say which page,
          what you tried, and the browser and assistive technology you use.
        </p>
      </article>
    </SectionWrapper>
  );
}
