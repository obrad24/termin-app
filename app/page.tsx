import Header from "@/components/header"
import LatestResult from "@/components/latest-result"
import ResultsSection from "@/components/results-section"
import HeroSection from "@/components/hero-section"
import TeamsSection from "@/components/teams-section"
import TopFantasySection from "@/components/top-fantasy-section"

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--fpl-p120)] pb-20 md:pb-0">
      <Header />
      <HeroSection />
      {/* <LatestResult /> */}
      <ResultsSection />
      <TopFantasySection />
    </main>
  )
}
