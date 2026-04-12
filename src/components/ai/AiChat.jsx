import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Sparkles, Trash2 } from 'lucide-react';
import { useAiChat } from '../../hooks/useAiChat';
import { Button } from '../ui/Button';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

/**
 * Editor-integrated AI mentor chat with context-aware prompts and streaming output.
 * @param {{problemContext: {title?: string, description?: string, starterCode?: string, language?: string}, queuedPrompt?: string, onPromptConsumed?: () => void}} props AI chat props.
 * @returns {JSX.Element} AI chat panel.
 */
export function AiChat({ problemContext, queuedPrompt, onPromptConsumed }) {
  const [prompt, setPrompt] = useState('');
  const consumedPromptRef = useRef('');
  const { messages, isStreaming, error, suggestedPrompts, sendMessage, clearMessages } =
    useAiChat();

  useEffect(() => {
    const normalizedPrompt = String(queuedPrompt || '').trim();
    if (!normalizedPrompt || normalizedPrompt === consumedPromptRef.current) {
      return;
    }

    consumedPromptRef.current = normalizedPrompt;

    void (async () => {
      await sendMessage(normalizedPrompt, problemContext);
      if (onPromptConsumed) {
        onPromptConsumed();
      }
    })();
  }, [queuedPrompt, problemContext, sendMessage, onPromptConsumed]);

  return (
    <section
      className="surface-card"
      aria-label="AI assistant"
      style={{ display: 'grid', gap: 'var(--space-3)', padding: 'var(--space-4)' }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Sparkles size={16} color="var(--color-accent-primary)" />
          <h3 style={{ fontSize: 'var(--text-lg)' }}>AI Mentor</h3>
        </div>
        <Button variant="ghost" onClick={clearMessages} ariaLabel="Clear AI chat history">
          <Trash2 size={14} />
          Clear
        </Button>
      </header>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        {suggestedPrompts.map((item) => (
          <Button
            key={item}
            variant="secondary"
            onClick={() => sendMessage(item, problemContext)}
            className="ui-button"
          >
            {item}
          </Button>
        ))}
      </div>

      <div
        className="surface-elevated"
        style={{
          padding: 'var(--space-3)',
          display: 'grid',
          gap: 'var(--space-2)',
          maxHeight: 280,
          overflow: 'auto',
        }}
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} role={message.role} content={message.content} />
        ))}
        {isStreaming ? <TypingIndicator /> : null}
      </div>

      <form
        onSubmit={async (event) => {
          event.preventDefault();
          await sendMessage(prompt, problemContext);
          setPrompt('');
        }}
        style={{ display: 'grid', gap: 'var(--space-2)' }}
      >
        <label htmlFor="ai-prompt" className="visually-hidden">
          Ask AI mentor
        </label>
        <textarea
          id="ai-prompt"
          className="ui-textarea"
          placeholder="Ask about complexity, bugs, or optimization..."
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
            Context aware: current problem and editor code are included.
          </span>
          <Button type="submit" disabled={!prompt.trim() || isStreaming}>
            Send
          </Button>
        </div>
      </form>

      {error ? (
        <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>{error}</p>
      ) : null}
    </section>
  );
}

AiChat.propTypes = {
  problemContext: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    starterCode: PropTypes.string,
    language: PropTypes.string,
  }).isRequired,
  queuedPrompt: PropTypes.string,
  onPromptConsumed: PropTypes.func,
};
