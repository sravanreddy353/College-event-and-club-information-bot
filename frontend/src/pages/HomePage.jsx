import { Link } from 'react-router-dom'
import { clubs, events } from '../data/campusData'

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="M4.2 10h11.6M10 4.2l5.8 5.8-5.8 5.8" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" fill="none">
      <path d="M14.25 7.5c0 4.1-5.25 8.25-5.25 8.25S3.75 11.6 3.75 7.5a5.25 5.25 0 1 1 10.5 0Z" />
      <circle cx="9" cy="7.5" r="1.75" />
    </svg>
  )
}

function EventCard({ event }) {
  return (
    <article className={`event-card event-${event.color}`}>
      <div className="event-card-top">
        <div className="date-block"><strong>{event.day}</strong><span>{event.month}</span></div>
        <span className="event-category">{event.category}</span>
      </div>
      <h3>{event.title}</h3>
      <p className="event-time">{event.time || 'Historical event'}</p>
      {event.location && <div className="event-location"><PinIcon />{event.location}</div>}
    </article>
  )
}

function ClubCard({ club }) {
  return (
    <article className="club-card">
      <div className={`club-avatar ${club.color}`}>{club.initials}</div>
      <span className="club-type">{club.type}</span>
      <h3>{club.name}</h3>
      <p>{club.description}</p>
      <Link to="/clubs" aria-label={`Learn about ${club.name}`}>
        Learn about clubs <ArrowIcon />
      </Link>
    </article>
  )
}

function HomePage() {
  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow"><span className="status-dot" /> YOUR CAMPUS, CONNECTED</div>
          <h1>Make campus<br />feel a little <span>smaller.</span></h1>
          <p className="hero-description">
            Find the events, clubs, and little moments that turn college into your community.
          </p>
          <div className="hero-actions">
            <Link className="button button-dark" to="/events">Explore what&apos;s on <ArrowIcon /></Link>
            <Link className="text-link" to="/clubs">Find your people</Link>
          </div>
          <div className="hero-footnote">
            <span className="avatar-stack" aria-hidden="true">
              <span>J</span><span>M</span><span>A</span>
            </span>
            <span>A better campus day starts with a hello.</span>
          </div>
        </div>

        <div className="hero-art" aria-label="Preview of campus events and clubs">
          <div className="art-sun" />
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="campus-building building-back"><span /><span /><span /></div>
          <div className="campus-building building-front"><span /><span /><span /><span /></div>
          <div className="art-ground" />
          <div className="floating-note note-top">
            <span className="note-icon note-star">✳</span>
            <span><strong>Find your thing</strong><small>Clubs for every kind of curious</small></span>
          </div>
          <div className="floating-note note-bottom">
            <span className="note-icon note-calendar">08</span>
            <span><strong>Something&apos;s happening</strong><small>Make room for a little fun</small></span>
            <span className="note-arrow"><ArrowIcon /></span>
          </div>
          <span className="art-caption">A CAMPUS FULL OF POSSIBILITIES</span>
        </div>
      </section>

      <section className="stats-strip" aria-label="Campus highlights">
        <p>YOUR NEXT FAVORITE THING IS OUT THERE</p>
        <div><strong>01</strong><span>Find events<br />worth showing up for</span></div>
        <div><strong>02</strong><span>Meet people<br />who get you</span></div>
        <div><strong>03</strong><span>Get answers<br />without the search</span></div>
        <Link to="/about" aria-label="Learn how Student Friendly Bot works"><ArrowIcon /></Link>
      </section>

      <section className="content-section events-section" id="events">
        <div className="section-heading">
          <div>
            <div className="eyebrow section-eyebrow">SAVE YOURSELF A SEAT</div>
            <h2>Past events at KARE<span>.</span></h2>
            <p>A few activities documented on the university&apos;s official website.</p>
          </div>
          <span className="sample-label">HISTORICAL · NOT UPCOMING</span>
        </div>
        <div className="event-grid">{events.map((event) => <EventCard event={event} key={event.title} />)}</div>
        <Link className="section-more-link" to="/events">See all events <ArrowIcon /></Link>
      </section>

      <section className="content-section clubs-section" id="clubs">
        <div className="section-heading">
          <div>
            <div className="eyebrow section-eyebrow">YOUR PEOPLE ARE HERE</div>
            <h2>Find a club. Find your thing<span>.</span></h2>
            <p>Try something new, or go deeper into what you already love.</p>
          </div>
          <span className="sample-label">ILLUSTRATIVE EXAMPLES</span>
        </div>
        <div className="club-grid">{clubs.map((club) => <ClubCard club={club} key={club.name} />)}</div>
        <Link className="section-more-link" to="/clubs">Explore all clubs <ArrowIcon /></Link>
      </section>

      <section className="assistant-banner" id="assistant">
        <div className="assistant-spark" aria-hidden="true">✳</div>
        <div>
          <div className="eyebrow">MEET YOUR CAMPUS SIDEKICK</div>
          <h2>Wondering where to start?</h2>
          <p>Our AI assistant will help you find campus answers, from event details to club info.</p>
        </div>
        <div className="assistant-cta">
          <span>Here when you need it</span>
          <Link
            className="button button-light"
            to="/assistant"
          >
            Chat with Student Friendly Bot <ArrowIcon />
          </Link>
        </div>
      </section>

      <section className="about-note" id="about">
        <span>BUILT FOR THE IN-BETWEEN MOMENTS</span>
        <p>Student Friendly Bot brings your college&apos;s events, clubs, and helpful answers together in one friendly place.</p>
      </section>
    </>
  )
}

export default HomePage
