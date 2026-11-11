import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { apiRequest } from '../lib/api'

const welcomeMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm Student Friendly Assistant. Ask me about KARE events, clubs, workshops, or campus life. I'll search the live web and available college records, then show my sources.",
  sources: [],
}

function createMessage(role, content, sources = []) {
  return {
    id: `${Date.now()}-${role}`,
    role,
    content,
    sources,
    timestamp: new Date().toISOString(),
  }
}

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

function SourceLinks({ sources }) {
  if (!sources?.length) return null
  const entries = sources.map((source, index) => {
    const label = typeof source === 'string'
      ? source
      : source && typeof source === 'object'
        ? [
          source.source_type === 'official' ? 'Official' : source.source_type === 'web' ? 'Web' : null,
          typeof source.title === 'string'
            ? source.title
            : typeof source.filename === 'string'
              ? `${source.filename}${Number.isInteger(source.page_number) ? ` · page ${source.page_number}` : ''}`
              : null,
        ].filter(Boolean).join(' · ')
        : null
    const url = typeof source?.url === 'string' && /^https?:\/\//i.test(source.url)
      ? source.url
      : null
    return label ? { key: `${label}-${index}`, label, url } : null
  }).filter(Boolean)

  if (!entries.length) return null
  return (
    <p className="chat-sources">
      Sources:{' '}
      {entries.map(({ key, label, url }) => url
        ? <a className="chat-source" href={url} key={key} rel="noreferrer noopener" target="_blank">{label}</a>
        : <span className="chat-source" key={key}>{label}</span>)}
    </p>
  )
}

function ChatWorkspace() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [chats, setChats] = useState([])
  const [chatId, setChatId] = useState(null)
  const [messages, setMessages] = useState([welcomeMessage])
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingChats, setIsLoadingChats] = useState(true)
  const [historyError, setHistoryError] = useState('')
  const [logoutError, setLogoutError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const inputRef = useRef(null)
  const bottomRef = useRef(null)

  const handleUnauthorized = useCallback((error) => {
    if (error?.status === 401) {
      setUser(null)
      navigate('/login', { replace: true })
      return true
    }
    return false
  }, [navigate, setUser])

  const refreshChats = useCallback(async () => {
    setChats(await apiRequest('/chats'))
    setHistoryError('')
  }, [])

  const openConversation = useCallback(async (id) => {
    const conversation = await apiRequest(`/chats/${encodeURIComponent(id)}`)
    setChatId(conversation.id)
    setMessages(conversation.messages.length ? conversation.messages : [welcomeMessage])
    setHistoryError('')
    setSidebarOpen(false)
  }, [])

  useEffect(() => {
    let active = true
    async function loadInitialHistory() {
      setIsLoadingChats(true)
      try {
        const history = await apiRequest('/chats')
        if (!active) return
        setChats(history)
        if (history.length) {
          const conversation = await apiRequest(`/chats/${encodeURIComponent(history[0].id)}`)
          if (!active) return
          setChatId(conversation.id)
          setMessages(conversation.messages.length ? conversation.messages : [welcomeMessage])
        }
      } catch (error) {
        if (!handleUnauthorized(error) && active) {
          setHistoryError(error instanceof Error ? error.message : 'Unable to load your conversations.')
        }
      } finally {
        if (active) setIsLoadingChats(false)
      }
    }
    loadInitialHistory()
    return () => { active = false }
  }, [handleUnauthorized])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isLoading])

  useEffect(() => {
    inputRef.current?.focus()
  }, [chatId])

  function startNewConversation() {
    setChatId(null)
    setMessages([welcomeMessage])
    setDraft('')
    setHistoryError('')
    setSidebarOpen(false)
    inputRef.current?.focus()
  }

  async function deleteConversation(event, id) {
    event.stopPropagation()
    try {
      await apiRequest(`/chats/${encodeURIComponent(id)}`, { method: 'DELETE' })
      setChats((current) => current.filter((item) => item.id !== id))
      if (chatId === id) startNewConversation()
    } catch (error) {
      if (!handleUnauthorized(error)) {
        setHistoryError(error instanceof Error ? error.message : 'Unable to delete this conversation.')
      }
    }
  }

  async function sendMessage(message) {
    const text = message.trim()
    if (!text || isLoading) return
    const optimisticUserMessage = createMessage('user', text)
    setMessages((current) => [...current, optimisticUserMessage])
    setDraft('')
    setIsLoading(true)
    try {
      const data = await apiRequest('/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text, chat_id: chatId }),
      })
      setChatId(data.chat_id)
      setMessages((current) => [
        ...current,
        createMessage('assistant', data.answer, Array.isArray(data.sources) ? data.sources : []),
      ])
      try {
        await refreshChats()
      } catch (error) {
        if (!handleUnauthorized(error)) {
          setHistoryError(error instanceof Error ? error.message : 'Unable to refresh your conversations.')
        }
      }
    } catch (error) {
      if (!handleUnauthorized(error)) {
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
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleLogout() {
    setLogoutError('')
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
      setUser(null)
      navigate('/login', { replace: true })
    } catch (error) {
      if (!handleUnauthorized(error)) {
        setLogoutError(error instanceof Error ? error.message : 'Unable to sign out. Please try again.')
      }
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    sendMessage(draft)
  }

  const suggestions = [
    'What events are happening this month?',
    'What clubs are available in our college?',
    'How can I register for a technical event?',
  ]

  return (
    <main className="chat-workspace">
      {sidebarOpen && (
        <button
          aria-label="Close conversation menu"
          className="chat-sidebar-scrim"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
      )}
      <aside className={`chat-sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <Link className="workspace-brand" to="/">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /><span /></span>
          <span>Student Friendly Assistant</span>
        </Link>
        <button className="workspace-new-chat" disabled={isLoading} onClick={startNewConversation} type="button">
          <span aria-hidden="true">＋</span> New chat
        </button>
        <div className="chat-history-heading">Recent conversations</div>
        <div className="chat-history-list">
          {isLoadingChats && <p className="chat-history-note">Loading conversations…</p>}
          {!isLoadingChats && chats.length === 0 && (
            <p className="chat-history-note">Your conversations will appear here.</p>
          )}
          {chats.map((chat) => (
            <div className={`chat-history-item${chatId === chat.id ? ' is-active' : ''}`} key={chat.id}>
              <button
                className="chat-history-open"
                disabled={isLoading}
                onClick={() => {
                  openConversation(chat.id).catch((error) => {
                    if (!handleUnauthorized(error)) {
                      setHistoryError(error instanceof Error ? error.message : 'Unable to open this conversation.')
                    }
                  })
                }}
                type="button"
              >
                <span aria-hidden="true">▤</span>
                <span>{chat.title}</span>
              </button>
              <button
                aria-label={`Delete ${chat.title}`}
                className="chat-history-delete"
                disabled={isLoading}
                onClick={(event) => deleteConversation(event, chat.id)}
                type="button"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {historyError && <p className="chat-history-error" role="alert">{historyError}</p>}
        <div className="workspace-profile">
          <span className="workspace-avatar">{user?.name?.trim().charAt(0).toUpperCase() || 'S'}</span>
          <span className="workspace-user">
            <strong>{user?.name}</strong>
            <small>{user?.email}</small>
          </span>
          <button aria-label="Sign out" className="workspace-logout" onClick={handleLogout} type="button">
            ↪
          </button>
        </div>
        {logoutError && <p className="chat-history-error" role="alert">{logoutError}</p>}
      </aside>

      <section className="chat-main">
        <header className="workspace-header">
          <button
            aria-label="Open conversation menu"
            className="workspace-menu-toggle"
            onClick={() => setSidebarOpen(true)}
            type="button"
          >
            ☰
          </button>
          <div className="workspace-title">
            <span className="chat-brand-icon" aria-hidden="true">✳</span>
            <div>
              <h1>Student Friendly Assistant</h1>
              <p><span className="chat-online-dot" /> College information assistant</p>
            </div>
          </div>
          <button className="workspace-mobile-new" disabled={isLoading} onClick={startNewConversation} type="button">New chat</button>
          <div className="workspace-header-account">
            <span className="workspace-avatar">
              {user?.name?.trim().charAt(0).toUpperCase() || 'S'}
            </span>
            <span className="workspace-user">
              <strong>{user?.name}</strong>
              <small>{user?.email}</small>
            </span>
            <button
              aria-label="Sign out"
              className="workspace-header-logout"
              onClick={handleLogout}
              type="button"
            >
              <span aria-hidden="true">↪</span>
              <span className="workspace-logout-label">Sign out</span>
            </button>
          </div>
        </header>

        <div className="workspace-messages" aria-live="polite">
          <div className="workspace-message-list">
            {messages.map((message) => (
              <article className={`chat-message-row is-${message.role}`} key={message.id}>
                <span className="chat-avatar" aria-hidden="true">{message.role === 'user' ? 'You' : 'AI'}</span>
                <div className="chat-message-content">
                  <div className="chat-bubble">{message.content}</div>
                  <SourceLinks sources={message.sources} />
                  {message.timestamp && <time className="chat-timestamp" dateTime={message.timestamp}>{formatTime(message.timestamp)}</time>}
                </div>
              </article>
            ))}
            {messages.length === 1 && (
              <div className="chat-suggestions">
                <p>Try asking</p>
                {suggestions.map((question) => (
                  <button disabled={isLoading} key={question} onClick={() => sendMessage(question)} type="button">
                    {question}
                  </button>
                ))}
              </div>
            )}
            {isLoading && (
              <div className="chat-message-row is-assistant">
                <span className="chat-avatar" aria-hidden="true">AI</span>
                <div aria-label="Generating answer" className="chat-bubble chat-typing" role="status">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <form className="chat-composer workspace-composer" onSubmit={handleSubmit}>
          <label className="visually-hidden" htmlFor="chat-message">Ask about college events and clubs</label>
          <input
            disabled={isLoading}
            id="chat-message"
            maxLength={2000}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask a question about campus…"
            ref={inputRef}
            value={draft}
          />
          <button aria-label="Send message" disabled={isLoading || !draft.trim()} type="submit">
            <svg aria-hidden="true" fill="none" viewBox="0 0 20 20"><path d="M3 10h13M10 4l6 6-6 6" /></svg>
          </button>
        </form>
        <p className="workspace-disclaimer">Answers use live web sources and available college records.</p>
      </section>
    </main>
  )
}

export default ChatWorkspace
