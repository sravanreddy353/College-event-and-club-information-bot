import { clubs } from '../data/campusData'

function ClubsPage() {
  return (
    <section className="listing-page">
      <div className="page-intro">
        <div className="eyebrow section-eyebrow">YOUR PEOPLE ARE HERE</div>
        <h1>Find your kind of people<span>.</span></h1>
        <p>Explore interests, learn something new, and find a community that feels like yours.</p>
        <span className="sample-label">ILLUSTRATIVE EXAMPLES — NOT OFFICIAL COLLEGE CLUBS</span>
      </div>

      <div className="club-grid club-list">
        {clubs.map((club) => (
          <article className="club-card club-detail-card" key={club.name}>
            <div className={`club-avatar ${club.color}`}>{club.initials}</div>
            <span className="club-type">{club.type}</span>
            <h2>{club.name}</h2>
            <p>{club.description}</p>
            <div className="club-contact">
              Club contact information has not been provided. Check your college&apos;s official club directory.
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default ClubsPage
