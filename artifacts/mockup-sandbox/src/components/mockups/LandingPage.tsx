import Navbar from "./Navbar";
import FourCardHero from "./FourCardHero";
import Services from "./Services";
import Tools from "./Tools";
import PlansTeaser from "./PlansTeaser";
import Testimonials from "./Testimonials";
import Contact from "./Contact";
import Footer from "./Footer";

/**
 * Full landing page composite — assembles every redesigned section.
 * Preview at /preview/LandingPage.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      <FourCardHero />
      <Services />
      <Tools />
      <PlansTeaser />
      <Testimonials />
      <Contact />
      <Footer />
    </div>
  );
}
