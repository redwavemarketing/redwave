/**
 * MessageBubble — one message in the conversation. User messages align right (the user's Avatar); assistant
 * messages align left (a Redwave Avatar + a subtle intent chip showing which scoped tool answered). The text
 * is the SERVER's — refusals ("I can't answer that…") render as ordinary assistant bubbles. Tokens only.
 */
import { Avatar, Badge, cx } from '../../../components/ui';
import { INTENT_LABELS, type ChatMessage } from '../chatbot.types';
import styles from './chatbot.module.css';

export function MessageBubble({ message, userName, userAvatar }: { message: ChatMessage; userName: string; userAvatar: string | null }) {
  const isUser = message.role === 'user';
  const showIntent = !isUser && message.intent && message.intent !== 'unknown';
  return (
    <div className={cx(styles.row, isUser && styles.rowUser)}>
      <Avatar name={isUser ? userName : 'Redwave'} src={isUser ? userAvatar : null} size="sm" />
      <div className={styles.bubbleWrap}>
        <div className={cx(styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant)}>{message.text}</div>
        {showIntent && (
          <span className={styles.meta}>
            <Badge tone="muted">{INTENT_LABELS[message.intent!]}</Badge>
          </span>
        )}
      </div>
    </div>
  );
}
