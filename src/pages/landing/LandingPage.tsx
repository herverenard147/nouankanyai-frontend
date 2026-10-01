import { useScrollToHash } from '@/lib/useScrollToHash'
import { AboutSection } from '@/pages/landing/sections/AboutSection'
import { BoitierSection } from '@/pages/landing/sections/BoitierSection'
import { ConstatSection } from '@/pages/landing/sections/ConstatSection'
import { ContactSection } from '@/pages/landing/sections/ContactSection'
import { FaqSection } from '@/pages/landing/sections/FaqSection'
import { Footer } from '@/pages/landing/sections/Footer'
import { Hero } from '@/pages/landing/sections/Hero'
import { NavBar } from '@/pages/landing/sections/NavBar'
import { NewsletterSection } from '@/pages/landing/sections/NewsletterSection'
import { PricingSection } from '@/pages/landing/sections/PricingSection'
import { ProfilesSection } from '@/pages/landing/sections/ProfilesSection'
import { ProofSection } from '@/pages/landing/sections/ProofSection'
import { TrustSection } from '@/pages/landing/sections/TrustSection'

export function LandingPage() {
  useScrollToHash()

  return (
    <div id="main-content">
      <NavBar />
      <Hero />
      <ProofSection />
      <ConstatSection />
      <ProfilesSection />
      <BoitierSection />
      <AboutSection />
      <TrustSection />
      <PricingSection />
      <FaqSection />
      <ContactSection />
      <NewsletterSection />
      <Footer />
    </div>
  )
}
