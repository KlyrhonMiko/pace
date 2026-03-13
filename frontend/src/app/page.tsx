import { Navbar } from "./_components/Navbar";
import { Footer } from "./_components/Footer";
import { HeroSection } from "./_components/landing/HeroSection";
import { FeaturesSection } from "./_components/landing/FeaturesSection";
import { CTASection } from "./_components/landing/CTASection";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow">
        <HeroSection />
        <FeaturesSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
