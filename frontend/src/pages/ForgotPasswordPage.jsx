import { Link } from 'react-router-dom'

function ForgotPasswordPage() {
  return (
    <main className="auth-page">
      <section className="auth-card auth-info-card">
        <Link className="auth-brand" to="/">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /><span /></span>
          <span>Student Friendly Assistant</span>
        </Link>
        <div className="auth-intro">
          <span className="eyebrow section-eyebrow">ACCOUNT SUPPORT</span>
          <h1>Password reset</h1>
          <p>Password reset emails are not configured for this installation. Please contact your campus administrator to reset your account securely.</p>
        </div>
        <Link className="auth-submit auth-back-link" to="/login">Back to sign in</Link>
      </section>
    </main>
  )
}

export default ForgotPasswordPage
