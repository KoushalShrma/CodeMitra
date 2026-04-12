import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { chatWithAi } from '../services/apiClient';

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

/**
 * Generates a short random id for message tracking.
 * @returns {string} Message id.
 */
function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Builds a strict mentorship prompt using problem and code context.
 * @param {{ title?: string, description?: string, starterCode?: string, language?: string }} context Runtime editor context.
 * @returns {string} System prompt for Groq.
 */
function buildSystemPrompt(context) {
  return [
    'You are Code_Mitra AI Mentor.',
    'Be concise, practical, and educational.',
    'Prefer guided hints over full answers unless the user explicitly asks for full code.',
    `Current problem title: ${context?.title || 'Unknown'}`,
    `Current language: ${context?.language || 'Unknown'}`,
    `Problem description: ${context?.description || 'Not provided'}`,
    `Current user code: ${context?.starterCode || 'Not provided'}`,
  ].join('\n');
}

/**
 * Calls backend proxy for AI responses.
 * @param {Array<{role: string, content: string}>} messages Chat messages.
 * @returns {Promise<string>} Assistant response text.
 */
async function callProxy(messages) {
  const payload = await chatWithAi({
    model: import.meta.env.VITE_GROQ_MODEL || DEFAULT_MODEL,
    temperature: 0.35,
    maxTokens: 460,
    messages,
  });
  return payload?.content || 'I could not generate a response right now.';
}

/**
 * Fallback call directly to Groq from browser environment.
 * @param {Array<{role: string, content: string}>} messages Chat messages.
 * @returns {Promise<string>} Assistant response text.
 */
async function callDirect(messages) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Groq key missing. Add VITE_GROQ_API_KEY for direct fallback.');
  }

  const response = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: import.meta.env.VITE_GROQ_MODEL || DEFAULT_MODEL,
      temperature: 0.35,
      max_tokens: 460,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq fallback failed (${response.status}).`);
  }

  const payload = await response.json();
  return payload?.choices?.[0]?.message?.content || 'I could not generate a response right now.';
}

/**
 * Provides AI chat state with simulated token streaming and typing indicator behavior.
 * @returns {{messages: Array, isStreaming: boolean, error: string, suggestedPrompts: string[], sendMessage: (prompt: string, context: object) => Promise<void>, clearMessages: () => void}} AI chat API.
 */
export function useAiChat() {
  const [messages, setMessages] = useState([
    {
      id: makeId(),
      role: 'assistant',
      content:
        'Ask me for hints, bug finding, optimization, or explanation. I will use your current problem and code context.',
    },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const suggestedPrompts = useMemo(
    () => ['Explain this problem', 'Review my approach', 'Find the bug', 'Optimize my solution'],
    []
  );

  const sendMessage = useCallback(
    async (prompt, context) => {
      const trimmed = String(prompt || '').trim();
      if (!trimmed || isStreaming) {
        return;
      }

      setError('');
      setIsStreaming(true);

      const userMessage = { id: makeId(), role: 'user', content: trimmed };
      const assistantId = makeId();

      setMessages((current) => [
        ...current,
        userMessage,
        { id: assistantId, role: 'assistant', content: '' },
      ]);

      try {
        const modelMessages = [
          { role: 'system', content: buildSystemPrompt(context) },
          ...messages
            .filter((message) => message.role === 'user' || message.role === 'assistant')
            .slice(-10)
            .map((message) => ({ role: message.role, content: message.content })),
          { role: 'user', content: trimmed },
        ];

        let fullResponse = '';
        try {
          fullResponse = await callProxy(modelMessages);
        } catch {
          fullResponse = await callDirect(modelMessages);
        }

        const text = String(fullResponse || '').trim();
        for (let index = 0; index < text.length; index += 1) {
          const partial = text.slice(0, index + 1);

          if (!mountedRef.current) {
            return;
          }

          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId ? { ...message, content: partial } : message
            )
          );

          await new Promise((resolve) => window.setTimeout(resolve, 8));
        }
      } catch (requestError) {
        const message = requestError instanceof Error ? requestError.message : 'AI request failed.';
        setError(message);
        setMessages((current) =>
          current.map((item) =>
            item.id === assistantId
              ? { ...item, content: 'I could not answer right now. Please try again.' }
              : item
          )
        );
      } finally {
        if (mountedRef.current) {
          setIsStreaming(false);
        }
      }
    },
    [isStreaming, messages]
  );

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: makeId(),
        role: 'assistant',
        content: 'Chat cleared. Ask me about your current problem whenever you are ready.',
      },
    ]);
    setError('');
  }, []);

  return {
    messages,
    isStreaming,
    error,
    suggestedPrompts,
    sendMessage,
    clearMessages,
  };
}
