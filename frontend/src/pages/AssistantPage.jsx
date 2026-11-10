import ChatAssistant from '../components/ChatAssistant'

function AssistantPage() {
  return (
    <section className="listing-page assistant-page">
      <div className="page-intro">
        <div className="eyebrow section-eyebrow">YOUR CAMPUS INFORMATION ASSISTANT</div>
        <h1>Ask Student Friendly Assistant<span>.</span></h1>
        <p>Ask about college events, clubs, workshops, and activities. The assistant searches live web sources alongside college records and shows citations.</p>
      </div>
      <ChatAssistant standalone />
    </section>
  )
}

export default AssistantPage
