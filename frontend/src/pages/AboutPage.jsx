const steps = [
  ['01', 'Add college documents', 'Start with event calendars, club directories, FAQs, and campus guides.'],
  ['02', 'Prepare trusted information', 'The backend will extract, split, and index document text for searching.'],
  ['03', 'Ask a campus question', 'Relevant document passages will be retrieved before an answer is generated.'],
  ['04', 'Answer with context', 'The assistant will use Gemini with retrieved information and say when it cannot find an answer.'],
]

const technologies = [
  ['React', 'Responsive student-facing website'],
  ['FastAPI', 'Python API for the assistant and college data'],
  ['ChromaDB', 'Vector store for searching document passages'],
  ['Gemini', 'Language model for context-grounded answers'],
]

function AboutPage() {
  return (
    <section className="listing-page about-page">
      <div className="page-intro">
        <div className="eyebrow section-eyebrow">A MORE CONNECTED CAMPUS</div>
        <h1>Campus life, a little easier<span>.</span></h1>
        <p>
          Student Friendly Bot is a college information assistant concept that brings campus events,
          student clubs, and helpful answers into one place.
        </p>
      </div>

      <section className="about-panel">
        <div>
          <div className="eyebrow section-eyebrow">WHAT WE&apos;RE HERE TO DO</div>
          <h2>Make reliable campus information easier to find.</h2>
        </div>
        <p>
          College information can live in calendars, documents, and club pages.
          This project aims to help students discover opportunities and get answers
          grounded in their college&apos;s own materials—not guesses.
        </p>
      </section>

      <div className="about-columns">
        <section className="about-flow">
          <div className="eyebrow section-eyebrow">HOW THE ASSISTANT WILL WORK</div>
          <h2>From college documents to helpful answers.</h2>
          <ol>
            {steps.map(([number, title, description]) => (
              <li key={number}>
                <span>{number}</span>
                <div><h3>{title}</h3><p>{description}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <section className="technology-panel">
          <div className="eyebrow section-eyebrow">THE TOOLKIT</div>
          <h2>Built with approachable tools.</h2>
          <ul>
            {technologies.map(([name, description]) => (
              <li key={name}><strong>{name}</strong><span>{description}</span></li>
            ))}
          </ul>
          <p className="planned-note">
            Add official college PDFs or text files to the knowledge folder and configure the backend Gemini API key to enable answers grounded in your records.
          </p>
        </section>
      </div>
    </section>
  )
}

export default AboutPage
