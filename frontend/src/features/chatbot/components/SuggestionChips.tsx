/**
 * SuggestionChips — the prompts the stubbed keyword router actually understands. They make the preview usable
 * and are honest about what it can answer (clicking one sends it). Tokens only.
 */
import { SUGGESTIONS } from '../chatbot.types';
import styles from './chatbot.module.css';

export function SuggestionChips({ onSelect, disabled }: { onSelect: (prompt: string) => void; disabled?: boolean }) {
  return (
    <div className={styles.chips}>
      {SUGGESTIONS.map((s) => (
        <button key={s} type="button" className={styles.chip} disabled={disabled} onClick={() => onSelect(s)}>
          {s}
        </button>
      ))}
    </div>
  );
}
