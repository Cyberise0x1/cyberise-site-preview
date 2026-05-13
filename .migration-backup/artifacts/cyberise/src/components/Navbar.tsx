import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const DRAWER_MS = 220;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerMounted, setDrawerMounted] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const unmountTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      if (unmountTimer.current) clearTimeout(unmountTimer.current);
      setDrawerMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setDrawerVisible(true));
      });
      document.body.style.overflow = "hidden";
    } else {
      setDrawerVisible(false);
      unmountTimer.current = setTimeout(
        () => setDrawerMounted(false),
        DRAWER_MS + 20
      );
      document.body.style.overflow = "";
    }
    return () => {
      if (unmountTimer.current) clearTimeout(unmountTimer.current);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [menuOpen]);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 w-full flex items-center justify-between z-[1000] transition-all duration-400 ease-in-out",
        scrolled
          ? "bg-[rgba(10,10,15,0.85)] backdrop-blur-[20px] px-8 md:px-[60px] py-[15px] border-b border-[rgba(0,240,255,0.1)]"
          : "px-8 md:px-[60px] py-[20px] bg-transparent backdrop-blur-none border-b border-transparent"
      )}
    >
      <a
        href="#"
        className="font-orbitron text-xl md:text-[1.5rem] font-extrabold tracking-[2px] text-gradient-1 no-underline"
      >
        CYBERISE{" "}
        <span
          className="font-normal text-[1rem] md:text-[1.2rem] !text-white !bg-none"
          style={{ WebkitTextFillColor: "white" }}
        >
          TECHNOLOGY
        </span>
      </a>

      <ul className="hidden md:flex items-center gap-[40px] list-none">
        <li>
          <Link
            href="/market"
            className="text-[#00f0ff] no-underline font-rajdhani text-[1rem] font-medium tracking-[1.5px] uppercase transition-all duration-300 relative hover:text-[#7b2ff7] after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-[linear-gradient(135deg,#00f0ff,#7b2ff7)] hover:after:w-full after:transition-all after:duration-300"
          >
            Marketplace
          </Link>
        </li>
        <li>
          <Link
            href="/dashboard"
            className="text-[#a0a0b8] no-underline font-rajdhani text-[1rem] font-medium tracking-[1.5px] uppercase transition-all duration-300 relative hover:text-[#00f0ff] after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-[linear-gradient(135deg,#00f0ff,#7b2ff7)] hover:after:w-full after:transition-all after:duration-300"
          >
            Dashboard
          </Link>
        </li>
        {["Services", "About", "Projects", "Why Us", "Testimonials"].map(
          (item) => (
            <li key={item}>
              <a
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="text-[#a0a0b8] no-underline font-rajdhani text-[1rem] font-medium tracking-[1.5px] uppercase transition-all duration-300 relative hover:text-[#00f0ff] after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-[linear-gradient(135deg,#00f0ff,#7b2ff7)] hover:after:w-full after:transition-all after:duration-300"
              >
                {item}
              </a>
            </li>
          )
        )}
        <li>
          <a
            href="#contact"
            className="px-[30px] py-[12px] bg-[linear-gradient(135deg,#00f0ff,#7b2ff7)] rounded-full text-[#0a0a0f] font-rajdhani text-[0.95rem] font-bold tracking-[1.5px] uppercase hover:translate-y-[-2px] hover:shadow-[0_0_30px_rgba(0,240,255,0.3)] transition-all duration-300 inline-block"
          >
            Get In Touch
          </a>
        </li>
      </ul>

      <div
        className="md:hidden flex flex-col gap-[6px] cursor-pointer z-[1002]"
        onClick={toggleMenu}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
      >
        <span
          className={cn(
            "w-[30px] h-[2px] bg-[#00f0ff] transition-all duration-300",
            menuOpen && "rotate-45 translate-x-[6px] translate-y-[6px]"
          )}
        />
        <span
          className={cn(
            "w-[30px] h-[2px] bg-[#00f0ff] transition-all duration-300",
            menuOpen && "opacity-0"
          )}
        />
        <span
          className={cn(
            "w-[30px] h-[2px] bg-[#00f0ff] transition-all duration-300",
            menuOpen && "-rotate-45 translate-x-[6px] -translate-y-[6px]"
          )}
        />
      </div>

      {drawerMounted && (
        <>
          <div
            className="fixed inset-0 z-[1000]"
            style={{
              background: "rgba(10,10,15,0.75)",
              backdropFilter: "blur(6px)",
              opacity: drawerVisible ? 1 : 0,
              transition: `opacity ${DRAWER_MS}ms ease`,
            }}
            onClick={closeMenu}
          />

          <ul
            className="fixed top-0 right-0 w-[80%] max-w-[400px] h-screen z-[1001] flex flex-col justify-center items-start gap-[32px] list-none p-[40px] bg-[rgba(10,10,15,0.98)] backdrop-blur-[30px] border-l border-[rgba(0,240,255,0.1)]"
            style={{
              opacity: drawerVisible ? 1 : 0,
              transform: drawerVisible ? "translateX(0)" : "translateX(100%)",
              transition: `opacity ${DRAWER_MS}ms ease, transform ${DRAWER_MS}ms ease`,
            }}
          >
            <li>
              <Link
                href="/market"
                onClick={closeMenu}
                className="text-[#00f0ff] no-underline font-rajdhani text-[1.1rem] font-medium tracking-[1.5px] uppercase transition-all duration-300 relative hover:text-[#7b2ff7] after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-[linear-gradient(135deg,#00f0ff,#7b2ff7)] hover:after:w-full after:transition-all after:duration-300"
              >
                Marketplace
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard"
                onClick={closeMenu}
                className="text-[#a0a0b8] no-underline font-rajdhani text-[1.1rem] font-medium tracking-[1.5px] uppercase transition-all duration-300 relative hover:text-[#00f0ff] after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-[linear-gradient(135deg,#00f0ff,#7b2ff7)] hover:after:w-full after:transition-all after:duration-300"
              >
                Dashboard
              </Link>
            </li>
            {["Services", "About", "Projects", "Why Us", "Testimonials"].map(
              (item) => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase().replace(" ", "-")}`}
                    onClick={closeMenu}
                    className="text-[#a0a0b8] no-underline font-rajdhani text-[1.1rem] font-medium tracking-[1.5px] uppercase transition-all duration-300 relative hover:text-[#00f0ff] after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-[linear-gradient(135deg,#00f0ff,#7b2ff7)] hover:after:w-full after:transition-all after:duration-300"
                  >
                    {item}
                  </a>
                </li>
              )
            )}
            <li>
              <a
                href="#contact"
                onClick={closeMenu}
                className="px-[30px] py-[12px] bg-[linear-gradient(135deg,#00f0ff,#7b2ff7)] rounded-full text-[#0a0a0f] font-rajdhani text-[0.95rem] font-bold tracking-[1.5px] uppercase hover:translate-y-[-2px] hover:shadow-[0_0_30px_rgba(0,240,255,0.3)] transition-all duration-300 inline-block"
              >
                Get In Touch
              </a>
            </li>
          </ul>
        </>
      )}
    </nav>
  );
}
