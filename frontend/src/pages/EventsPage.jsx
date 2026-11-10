import { events } from '../data/campusData'

function PinIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" fill="none">
      <path d="M14.25 7.5c0 4.1-5.25 8.25-5.25 8.25S3.75 11.6 3.75 7.5a5.25 5.25 0 1 1 10.5 0Z" />
      <circle cx="9" cy="7.5" r="1.75" />
    </svg>
  )
}

function EventsPage() {
  return (
    <section className="listing-page">
      <div className="page-intro">
        <div className="eyebrow section-eyebrow">MAKE A LITTLE ROOM FOR FUN</div>
        <h1>Events on campus<span>.</span></h1>
        <p>Find a reason to step out, meet someone new, or try something different.</p>
        <span className="sample-label">ILLUSTRATIVE EXAMPLES — NOT OFFICIAL COLLEGE EVENTS</span>
      </div>

      <div className="event-list">
        {events.map((event) => (
          <article className={`event-detail-card event-${event.color}`} key={event.title}>
            <div className="date-block"><strong>{event.day}</strong><span>{event.month}</span></div>
            <div className="event-detail-copy">
              <span className="event-category">{event.category}</span>
              <h2>{event.title}</h2>
              <p>{event.description}</p>
              <div className="event-detail-meta">
                <span>{event.time}</span>
                <span><PinIcon />{event.location}</span>
              </div>
              <div className="registration-note">
                Registration details are not available in this sample. Check your college&apos;s official event listing.
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default EventsPage
