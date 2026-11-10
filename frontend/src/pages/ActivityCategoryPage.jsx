import { Link } from 'react-router-dom'
import { events } from '../data/campusData'

function ActivityCategoryPage({ category, eyebrow, title, description, emptyMessage }) {
  const activities = events.filter((event) => event.category === category)

  return (
    <section className="listing-page">
      <div className="page-intro">
        <div className="eyebrow section-eyebrow">{eyebrow}</div>
        <h1>{title}<span>.</span></h1>
        <p>{description}</p>
        <span className="sample-label">ILLUSTRATIVE EXAMPLES — NOT OFFICIAL COLLEGE ACTIVITIES</span>
      </div>

      {activities.length > 0 ? (
        <div className="event-list">
          {activities.map((activity) => (
            <article className={`event-detail-card event-${activity.color}`} key={activity.title}>
              <div className="date-block"><strong>{activity.day}</strong><span>{activity.month}</span></div>
              <div className="event-detail-copy">
                <span className="event-category">{activity.category}</span>
                <h2>{activity.title}</h2>
                <p>{activity.description}</p>
                <div className="event-detail-meta">
                  <span>{activity.time}</span>
                  <span>{activity.location}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="activity-empty-state">
          <h2>No examples listed yet</h2>
          <p>{emptyMessage}</p>
        </div>
      )}

      <Link className="section-more-link" to="/assistant">
        Ask Student Friendly Bot
      </Link>
    </section>
  )
}

export default ActivityCategoryPage
