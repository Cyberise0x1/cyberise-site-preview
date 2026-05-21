import { CheckCircle2 } from "lucide-react";

export default function About() {
  const features = [
    "Certified Professionals",
    "Global Operations",
    "Government Trusted",
    "24/7 SOC Support",
    "NDA Guaranteed",
    "Zero-Compromise Security",
  ];

  return (
    <section id="about" className="bg-[rgba(18,18,26,0.3)]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[40px] lg:gap-[80px] max-w-[1400px] mx-auto items-center">
        <div className="h-[300px] lg:h-[500px] flex items-center justify-center relative perspective-[1000px] reveal">
          <div
            className="w-[200px] h-[200px] relative transform-style-[preserve-3d] animate-[spin-slow_20s_linear_infinite]"
            style={{ transformStyle: "preserve-3d" }}
          >
            <style
              dangerouslySetInnerHTML={{
                __html: `
              @keyframes spin-slow {
                0% { transform: rotateX(0) rotateY(0); }
                100% { transform: rotateX(360deg) rotateY(360deg); }
              }
              .cube-face {
                position: absolute;
                width: 200px;
                height: 200px;
                border: 2px solid rgba(0, 240, 255, 0.3);
                background: rgba(18, 18, 26, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Orbitron', sans-serif;
                font-weight: 800;
                font-size: 2rem;
                color: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(5px);
                box-shadow: inset 0 0 30px rgba(0, 240, 255, 0.1);
              }
              .face-front { transform: translateZ(100px); border-color: rgba(0, 240, 255, 0.5); }
              .face-back { transform: rotateY(180deg) translateZ(100px); border-color: rgba(123, 47, 247, 0.5); }
              .face-right { transform: rotateY(90deg) translateZ(100px); }
              .face-left { transform: rotateY(-90deg) translateZ(100px); }
              .face-top { transform: rotateX(90deg) translateZ(100px); }
              .face-bottom { transform: rotateX(-90deg) translateZ(100px); }
            `,
              }}
            />
            <div className="cube-face face-front">CYBER</div>
            <div className="cube-face face-back">SECURE</div>
            <div className="cube-face face-right">CODE</div>
            <div className="cube-face face-left">BUILD</div>
            <div className="cube-face face-top">TECH</div>
            <div className="cube-face face-bottom">RISE</div>
          </div>
        </div>

        <div className="reveal">
          <div className="inline-block font-rajdhani text-[0.85rem] font-semibold tracking-[3px] uppercase text-[#00f0ff] mb-[20px] relative before:content-['—'] before:mx-[10px] before:text-[rgba(0,240,255,0.4)] after:content-['—'] after:mx-[10px] after:text-[rgba(0,240,255,0.4)]">
            Who We Are
          </div>
          <h2 className="font-orbitron text-[clamp(2rem,3vw,3rem)] font-extrabold leading-[1.2] mb-[25px]">
            A Global Force in Digital Innovation &{" "}
            <span className="text-gradient-1">Cybersecurity</span>
          </h2>
          <p className="text-[1.1rem] text-[#a0a0b8] leading-[1.8] mb-[30px]">
            Cyberise Technology was founded with a singular vision: to bridge
            the gap between cutting-edge technology and real-world security
            challenges. Based in Nigeria, operating globally.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[15px] mb-[40px]">
            {features.map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-[10px] text-[#ffffff] font-medium"
              >
                <CheckCircle2 className="w-5 h-5 text-[#00ff88]" />
                {feature}
              </div>
            ))}
          </div>

          <a href="#contact" className="btn-primary inline-block">
            Partner With Us
          </a>
        </div>
      </div>
    </section>
  );
}
