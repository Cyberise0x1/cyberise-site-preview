import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Mail, Phone, Clock, ShieldAlert } from "lucide-react";

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    waitMinutes: number;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setRateLimitInfo(null);

    const form = e.target as HTMLFormElement;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      service: (form.elements.namedItem("service") as HTMLSelectElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement)
        .value,
    };

    try {
      const apiBase = import.meta.env.VITE_API_URL ?? "";
      const res = await fetch(`${apiBase}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok) {
        toast({
          title: "Message Transmitted",
          description:
            "Your inquiry has been received. Our operators will contact you shortly.",
          duration: 5000,
        });
        form.reset();
      } else if (res.status === 429) {
        const retryAfterRaw = parseInt(
          res.headers.get("Retry-After") ?? "900",
          10,
        );
        const retryAfterSeconds = isNaN(retryAfterRaw) ? 900 : retryAfterRaw;
        const waitMinutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
        setRateLimitInfo({ waitMinutes });
      } else {
        toast({
          title: "Transmission Failed",
          description:
            (json as { error?: string }).error ??
            "Something went wrong. Please try again.",
          duration: 6000,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Transmission Failed",
        description:
          "Could not reach the server. Please check your connection and try again.",
        duration: 6000,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="bg-[rgba(18,18,26,0.3)] border-y border-[rgba(0,240,255,0.05)]"
    >
      <div className="text-center mb-[80px] reveal">
        <div className="inline-block font-rajdhani text-[0.85rem] font-semibold tracking-[3px] uppercase text-[#00f0ff] mb-[20px] relative before:content-['—'] before:mx-[10px] before:text-[rgba(0,240,255,0.4)] after:content-['—'] after:mx-[10px] after:text-[rgba(0,240,255,0.4)]">
          Initiate Contact
        </div>
        <h2 className="font-orbitron text-[clamp(2rem,4vw,3.5rem)] font-extrabold leading-[1.2] mb-[20px]">
          Establish <span className="text-gradient-3">Connection</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[40px] lg:gap-[60px] max-w-[1400px] mx-auto reveal">
        <div className="p-[40px] md:p-[50px] bg-[rgba(18,18,26,0.6)] border border-[rgba(0,240,255,0.08)] rounded-[24px] backdrop-blur-[20px]">
          <h3 className="font-orbitron text-[1.8rem] md:text-[2rem] font-extrabold mb-[20px] text-white">
            Headquarters
          </h3>
          <p className="text-[#a0a0b8] leading-[1.8] mb-[40px]">
            Secure communications channel. Whether you need a complex web
            platform or an elite red team operation, our lines are open.
          </p>

          <div className="flex flex-col gap-[25px]">
            <div className="flex items-center gap-[20px]">
              <div className="w-[50px] h-[50px] rounded-[14px] bg-[rgba(0,240,255,0.08)] border border-[rgba(0,240,255,0.15)] flex items-center justify-center shrink-0 text-[#00f0ff]">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-rajdhani text-[0.85rem] tracking-[1.5px] uppercase text-[#a0a0b8] mb-[4px]">
                  Location
                </h5>
                <span className="text-[1rem] font-medium text-white">
                  Lagos, Nigeria | Global Ops
                </span>
              </div>
            </div>

            <div className="flex items-center gap-[20px]">
              <div className="w-[50px] h-[50px] rounded-[14px] bg-[rgba(0,240,255,0.08)] border border-[rgba(0,240,255,0.15)] flex items-center justify-center shrink-0 text-[#00f0ff]">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-rajdhani text-[0.85rem] tracking-[1.5px] uppercase text-[#a0a0b8] mb-[4px]">
                  Email
                </h5>
                <span className="text-[1rem] font-medium text-white">
                  Cyberisetecnologies@consultant.com
                </span>
              </div>
            </div>

            <div className="flex items-center gap-[20px]">
              <div className="w-[50px] h-[50px] rounded-[14px] bg-[rgba(0,240,255,0.08)] border border-[rgba(0,240,255,0.15)] flex items-center justify-center shrink-0 text-[#00f0ff]">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-rajdhani text-[0.85rem] tracking-[1.5px] uppercase text-[#a0a0b8] mb-[4px]">
                  Phone / WhatsApp
                </h5>
                <span className="text-[1rem] font-medium text-white">
                  +1 224 350-2469 · +234 8100737315
                </span>
              </div>
            </div>

            <div className="flex items-center gap-[20px]">
              <div className="w-[50px] h-[50px] rounded-[14px] bg-[rgba(0,240,255,0.08)] border border-[rgba(0,240,255,0.15)] flex items-center justify-center shrink-0 text-[#00f0ff]">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-rajdhani text-[0.85rem] tracking-[1.5px] uppercase text-[#a0a0b8] mb-[4px]">
                  Availability
                </h5>
                <span className="text-[1rem] font-medium text-white">
                  24/7 Global Coverage
                </span>
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-[40px] md:p-[50px] bg-[rgba(18,18,26,0.6)] border border-[rgba(0,240,255,0.08)] rounded-[24px] backdrop-blur-[20px]"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px] mb-[25px]">
            <div className="form-group mb-0">
              <label className="block font-rajdhani text-[0.85rem] font-semibold tracking-[1.5px] uppercase text-[#a0a0b8] mb-[10px]">
                Name / Callsign
              </label>
              <input
                required
                name="name"
                type="text"
                className="w-full p-[14px_20px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-[12px] text-white font-sans text-[1rem] transition-all outline-none focus:border-[#00f0ff] focus:shadow-[0_0_20px_rgba(0,240,255,0.1)] focus:bg-[rgba(0,240,255,0.03)]"
              />
            </div>
            <div className="form-group mb-0">
              <label className="block font-rajdhani text-[0.85rem] font-semibold tracking-[1.5px] uppercase text-[#a0a0b8] mb-[10px]">
                Email Address
              </label>
              <input
                required
                name="email"
                type="email"
                className="w-full p-[14px_20px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-[12px] text-white font-sans text-[1rem] transition-all outline-none focus:border-[#00f0ff] focus:shadow-[0_0_20px_rgba(0,240,255,0.1)] focus:bg-[rgba(0,240,255,0.03)]"
              />
            </div>
          </div>

          <div className="form-group mb-[25px]">
            <label className="block font-rajdhani text-[0.85rem] font-semibold tracking-[1.5px] uppercase text-[#a0a0b8] mb-[10px]">
              Service Required
            </label>
            <select
              required
              name="service"
              className="w-full p-[14px_20px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-[12px] text-white font-sans text-[1rem] transition-all outline-none focus:border-[#00f0ff] focus:shadow-[0_0_20px_rgba(0,240,255,0.1)] focus:bg-[rgba(0,240,255,0.03)] appearance-none cursor-pointer"
            >
              <option value="" disabled className="bg-[#0a0a0f]">
                Select an option...
              </option>
              <option value="web" className="bg-[#0a0a0f]">
                Web/App Development
              </option>
              <option value="cyber" className="bg-[#0a0a0f]">
                Cybersecurity & Red Teaming
              </option>
              <option value="gov" className="bg-[#0a0a0f]">
                Government Consultancy
              </option>
              <option value="intel" className="bg-[#0a0a0f]">
                Intelligence & Tracking
              </option>
              <option value="other" className="bg-[#0a0a0f]">
                Other / Classified
              </option>
            </select>
          </div>

          <div className="form-group mb-[30px]">
            <label className="block font-rajdhani text-[0.85rem] font-semibold tracking-[1.5px] uppercase text-[#a0a0b8] mb-[10px]">
              Transmission Details
            </label>
            <textarea
              required
              name="message"
              className="w-full p-[14px_20px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-[12px] text-white font-sans text-[1rem] transition-all outline-none focus:border-[#00f0ff] focus:shadow-[0_0_20px_rgba(0,240,255,0.1)] focus:bg-[rgba(0,240,255,0.03)] h-[140px] resize-y"
            ></textarea>
          </div>

          {rateLimitInfo && (
            <div className="mb-[24px] flex items-start gap-[14px] p-[18px_20px] rounded-[12px] bg-[rgba(255,45,85,0.07)] border border-[rgba(255,45,85,0.25)]">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-[2px] text-[#ff2d55]" />
              <div>
                <p className="font-rajdhani text-[0.8rem] font-semibold tracking-[1.5px] uppercase text-[#ff2d55] mb-[4px]">
                  Rate Limit Reached
                </p>
                <p className="text-[0.92rem] text-[#a0a0b8] leading-[1.6]">
                  You've sent too many messages. Please wait{" "}
                  <span className="text-white font-medium">
                    {rateLimitInfo.waitMinutes}{" "}
                    {rateLimitInfo.waitMinutes === 1 ? "minute" : "minutes"}
                  </span>{" "}
                  before trying again.
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full disabled:opacity-70"
          >
            {isSubmitting ? "Transmitting..." : "Send Message →"}
          </button>
        </form>
      </div>
    </section>
  );
}
