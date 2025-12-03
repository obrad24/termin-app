import Header from "@/components/header"
import LatestResult from "@/components/latest-result"
import ResultsSection from "@/components/results-section"
import LeaguesSection from "@/components/leagues-section"
import HeroSection from "@/components/hero-section"
import TeamsSection from "@/components/teams-section"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-800 to-purple-900">
      <Header />
      <HeroSection />
      <LatestResult />
      <ResultsSection />
      <LeaguesSection />
      <TeamsSection />
    </main>
  )
}
