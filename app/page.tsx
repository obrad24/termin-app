import Header from "@/components/header"
import LatestResult from "@/components/latest-result"
import ResultsSection from "@/components/results-section"
import HeroSection from "@/components/hero-section"
import TeamsSection from "@/components/teams-section"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <LatestResult />
      <ResultsSection />
      <TeamsSection />
    </main>
  )
}
