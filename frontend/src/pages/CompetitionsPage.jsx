import ActivityCategoryPage from './ActivityCategoryPage'

function CompetitionsPage() {
  return (
    <ActivityCategoryPage
      category="COMPETITION"
      eyebrow="SHOW WHAT YOU CAN DO"
      title="Competitions"
      description="Find college competitions, challenges, and ways to put your ideas to the test."
      emptyMessage="No competition entries are available yet. Add verified competition details to the website data when your college provides them."
    />
  )
}

export default CompetitionsPage
