import { useEffect, useRef, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.PROD ? '/api' : 'http://127.0.0.1:8000')
const SUGGESTED_QUESTIONS = [
  'What events are happening this month?',
  'What clubs are available in our college?',
  'How can I register for a technical event?',
  'When is the next cultural fest?',
  'How can I join the coding club?',
  'Where can I find event schedules?',
]

const welcomeMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm Student Friendly Assistant. Ask me about KARE events, clubs, workshops, or campus life. I'll search the live web and available college records, then show my sources.",
  sources: [],
}

function ChatAssistant({ onClose, standalone = false }) {
  const [messages, setMessages] = useState([welcomeMessage])
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    if (standalone) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, standalone])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isLoading])

  async function sendMessage(message) {
    const text = message.trim()
    if (!text || isLoading) return

    const history = messages
      .filter((item) => item.role === 'user' || item.role === 'assistant')
      .slice(-8)
      .map(({ role, content }) => ({ role, content }))

    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-user`, role: 'user', content: text, sources: [] },
    ])
    setDraft('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || `The chatbot request failed (${response.status}).`)
      }
      if (typeof data.answer !== 'string' || !data.answer.trim()) {
        throw new Error('The chatbot returned an empty response. Please try again.')
      }

      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: data.answer,
          sources: Array.isArray(data.sources) ? data.sources : [],
        },
      ])
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-error`,
          role: 'error',
          content: error instanceof Error
            ? `There was a problem getting an answer: ${error.message}`
            : 'There was a problem getting an answer. Please try again.',
          sources: [],
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    sendMessage(draft)
  }

  function startNewConversation() {
    setMessages([welcomeMessage])
    setDraft('')
    inputRef.current?.focus()
  }

  return (
    <div
      className={standalone ? 'chat-page' : 'chat-backdrop'}
      onMouseDown={(event) => {
        if (!standalone && event.target === event.currentTarget) onClose?.()
      }}
    >
      <section
        className={`chat-panel${standalone ? ' chat-panel-inline' : ''}`}
        role="dialog"
        aria-modal={!standalone}
        aria-labelledby="chat-title"
      >
        <header className="chat-header">
          <div className="chat-heading">
            <span className="chat-brand-icon" aria-hidden="true">✳</span>
            <div>
              <h2 id="chat-title">Student Friendly Assistant</h2>
              <p><span className="chat-online-dot" /> College information assistant</p>
            </div>
          </div>
          <div className="chat-header-actions">
            <button
              className="chat-new-button"
              type="button"
              onClick={startNewConversation}
              disabled={isLoading}
            >
              New chat
            </button>
            {!standalone && (
              <button
                className="chat-close-button"
                type="button"
                onClick={onClose}
                aria-label="Close chatbot"
              >
                ×
              </button>
            )}
          </div>
        </header>

        <div className="chat-messages" aria-live="polite">
          {messages.map((message) => (
            <div className={`chat-message-row is-${message.role}`} key={message.id}>
              <span className="chat-avatar" aria-hidden="true">
                {message.role === 'user' ? 'You' : 'AI'}
              </span>
              <div className="chat-message-content">
                <div className="chat-bubble">{message.content}</div>
                {message.sources?.length > 0 && (
                  <p className="chat-sources">
                    Sources:{' '}
                    {message.sources.map((source, index) => {
                      const label = typeof source === 'string'
                        ? source
                        : source && typeof source === 'object'
                          ? [
                            source.source_type === 'official'
                              ? 'Official'
                              : source.source_type === 'web'
                                ? 'Web'
                                : null,
                            typeof source.title === 'string'
                              ? source.title
                              : typeof source.filename === 'string'
                                ? `${source.filename}${Number.isInteger(source.page_number) ? ` · page ${source.page_number}` : ''}`
                                : null,
                          ].filter(Boolean).join(' · ')
                          : null
                      const validUrl = typeof source?.url === 'string'
                        && /^https?:\/\//i.test(source.url)

                      return label ? (
                        validUrl ? (
                          <a
                            className="chat-source"
                            href={source.url}
                            key={`${label}-${index}`}
                            target="_blank"
                            rel="noreferrer noopener"
                          >
                            {label}
                          </a>
                        ) : (
                          <span className="chat-source" key={`${label}-${index}`}>{label}</span>
                        )
                      ) : null
                    })}
                  </p>
                )}
              </div>
            </div>
          ))}
          {messages.length === 1 && (
            <div className="chat-suggestions">
              <p>Try asking</p>
              {SUGGESTED_QUESTIONS.map((question) => (
                <button
                  type="button"
                  key={question}
                  onClick={() => sendMessage(question)}
                  disabled={isLoading}
                >
                  {question}
                </button>
              ))}
            </div>
          )}
          {isLoading && (
            <div className="chat-message-row is-assistant">
              <span className="chat-avatar" aria-hidden="true">AI</span>
              <div className="chat-bubble chat-typing" role="status" aria-label="Generating answer">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form className="chat-composer" onSubmit={handleSubmit}>
          <label className="visually-hidden" htmlFor="chat-message">
            Ask about college events and clubs
          </label>
          <input
            id="chat-message"
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask a question about campus…"
            maxLength={2000}
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !draft.trim()} aria-label="Send message">
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
              <path d="M3 10h13M10 4l6 6-6 6" />
            </svg>
          </button>
        </form>
        <p className="chat-disclaimer">Answers use live web sources and available college records.</p>
      </section>
    </div>
  )
}

export default ChatAssistant
