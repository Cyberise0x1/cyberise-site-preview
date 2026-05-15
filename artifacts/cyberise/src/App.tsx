import { useEffect, useState } from "react";
import { Switch, Route, Redirect } from "wouter";
import Preloader from "./components/Preloader";
import CustomCursor from "./components/CustomCursor";
import ThreeBackground from "./components/ThreeBackground";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import StatsBar from "./components/StatsBar";
import Marquee from "./components/Marquee";
import Services from "./components/Services";
import About from "./components/About";
import Projects from "./components/Projects";
import WhyUs from "./components/WhyUs";
import Testimonials from "./components/Testimonials";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import LegalModal, { type LegalTab } from "./components/LegalModal";
import Market from "./pages/Market";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import AdminUsers from "./pages/AdminUsers";
import AdminOrders from "./pages/AdminOrders";
import AdminSettings from "./pages/AdminSettings";
import AdminDev from "./pages/AdminDev";
import { Toaster } from "@/components/ui/toaster";

function HomePage() {
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTab>("privacy");

  const openLegal = (tab: LegalTab) => {
    setLegalTab(tab);
    setLegalOpen(true);
  };

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          if (entry.target.classList.contains('stat-item')) {
            const numElement = entry.target.querySelector('.stat-number') as HTMLElement;
            if (numElement && !numElement.classList.contains('counted')) {
              numElement.classList.add('counted');
              const target = parseInt(numElement.getAttribute('data-target') || '0', 10);
              let count = 0;
              const duration = 2000;
              const interval = 20;
              const step = Math.max(1, Math.floor(target / (duration / interval)));

              const counter = setInterval(() => {
                count += step;
                if (count >= target) {
                  numElement.innerText = target.toString() + (numElement.getAttribute('data-suffix') || '');
                  clearInterval(counter);
                } else {
                  numElement.innerText = count.toString() + (numElement.getAttribute('data-suffix') || '');
                }
              }, interval);
            }
          }
        }
      });
    }, observerOptions);

    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(element => {
      observer.observe(element);
    });

    return () => {
      reveals.forEach(element => observer.unobserve(element));
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div className="relative z-[1] flex flex-col min-h-screen">
        <Navbar />
        <Hero />
        <StatsBar />
        <Marquee />
        <Services />
        <About />
        <Projects />
        <WhyUs />
        <Testimonials />
        <Contact />
        <Footer onOpenLegal={openLegal} />
      </div>
      <LegalModal
        open={legalOpen}
        activeTab={legalTab}
        onTabChange={setLegalTab}
        onClose={() => setLegalOpen(false)}
      />
    </>
  );
}

export default function App() {
  return (
    <>
      <Preloader />
      <CustomCursor />
      <ThreeBackground />
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/market" component={Market} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/orders" component={Orders} />
        <Route path="/admin" component={() => <Redirect to="/admin/users" />} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/orders" component={AdminOrders} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route path="/admin/dev" component={AdminDev} />
      </Switch>
      <Toaster />
    </>
  );
}
