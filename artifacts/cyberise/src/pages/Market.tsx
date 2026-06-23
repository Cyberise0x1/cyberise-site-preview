import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth, SignIn, useUser } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import {
  useApi,
  type MarketData,
  type PlanTier,
  type CryptoCurrency,
  type CryptoEstimate,
  type CryptoOrderResponse,
  type CryptoPaymentStatusResponse,
  getRegionFlag,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Server,
  HardDrive,
  Cpu,
  Globe,
  Copy,
  Check,
  Lock,
  Zap,
  Shield,
  Star,
  AlertTriangle,
  Wallet,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";

type CredentialData = {
  orderId: string;
  ip: string;
  username: string;
  password: string;
  expiresAt: string;
  tier: PlanTier;
};

type PaymentMethod = "balance" | "crypto";

type CryptoPaymentData = {
  orderId: string;
  paymentId: string;
  payAddress: string;
  payCurrency: string;
  cryptoAmount: number;
  fiatAmount: number;
  paymentStatus: string;
};

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center gap-2 bg-[#0a0a0f] rounded-lg px-3 py-2.5 border border-[rgba(255,255,255,0.06)]">
      <div className="flex-1 min-w-0">
        <p className="text-[#666] text-[10px] uppercase tracking-[1px] font-rajdhani mb-0.5">
          {label}
        </p>
        <p className="text-white text-sm font-mono truncate">{value}</p>
      </div>
      <button
        onClick={copy}
        className="flex-shrink-0 text-[#a0a0b8] hover:text-[#00f0ff] transition-colors"
      >
        {copied ? (
          <Check className="w-4 h-4 text-[#00f0ff]" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: MarketData["plans"][0];
  selected: boolean;
  onSelect: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isPro = plan.tier === "pro";

  const handleMouseEnter = useCallback(() => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      y: -5,
      scale: 1.018,
      duration: 0.2,
      ease: "power2.out",
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      y: 0,
      scale: 1,
      duration: 0.28,
      ease: "power2.inOut",
    });
  }, []);

  return (
    <div
      ref={cardRef}
      onClick={onSelect}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative cursor-pointer rounded-xl p-4 border-2 transition-colors ${
        selected
          ? isPro
            ? "border-[#7b2ff7] bg-[rgba(123,47,247,0.08)]"
            : "border-[#00f0ff] bg-[rgba(0,240,255,0.06)]"
          : "border-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.15)] bg-[#0d0d14]"
      }`}
    >
      {selected && (
        <div
          className={`absolute inset-0 rounded-xl pointer-events-none ${
            isPro
              ? "shadow-[0_0_24px_rgba(123,47,247,0.25)]"
              : "shadow-[0_0_24px_rgba(0,240,255,0.18)]"
          }`}
        />
      )}

      <div className="flex items-start justify-between mb-3">
        <span
          className={`text-[10px] font-bold tracking-[1.5px] uppercase px-2 py-1 rounded-md font-rajdhani ${
            isPro
              ? "bg-[rgba(123,47,247,0.15)] text-[#a855f7] border border-[rgba(123,47,247,0.25)]"
              : "bg-[rgba(0,240,255,0.08)] text-[#00f0ff] border border-[rgba(0,240,255,0.2)]"
          }`}
        >
          {isPro ? "⚡ Pro" : "Basic"}
        </span>
        {selected && (
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center ${
              isPro ? "bg-[#7b2ff7]" : "bg-[#00f0ff]"
            }`}
          >
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      <h3 className="text-white font-semibold text-sm mb-1 font-rajdhani">
        {plan.label}
      </h3>
      <div
        className={`text-xl font-bold font-orbitron mb-3 ${isPro ? "text-[#a855f7]" : "text-[#00f0ff]"}`}
      >
        ${plan.price.monthly.toFixed(2)}
        <span className="text-[#666] text-xs font-sans font-normal">/mo</span>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {[
          { Icon: Cpu, val: `${plan.vcpus} vCPU` },
          {
            Icon: HardDrive,
            val: `${(plan.ram / 1024).toFixed(plan.ram < 1024 ? 1 : 0)}GB RAM`,
          },
          { Icon: Server, val: `${Math.round(plan.disk / 1024)}GB SSD` },
        ].map(({ Icon, val }) => (
          <div
            key={val}
            className="flex flex-col items-center gap-1 bg-[rgba(255,255,255,0.03)] rounded-lg py-2 px-1"
          >
            <Icon className="w-3.5 h-3.5 text-[#666]" />
            <span className="text-[10px] text-[#a0a0b8] font-medium leading-none">
              {val}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Market() {
  const { api } = useApi();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [credentials, setCredentials] = useState<CredentialData | null>(null);
  const [tierTab, setTierTab] = useState<"all" | "basic" | "pro">("all");

  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [duration, setDuration] = useState(30);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("balance");
  const [payCurrency, setPayCurrency] = useState<string>("btc");
  const [cryptoCurrencies, setCryptoCurrencies] = useState<CryptoCurrency[]>(
    [],
  );
  const [cryptoEstimate, setCryptoEstimate] = useState<CryptoEstimate | null>(
    null,
  );
  const [cryptoPayment, setCryptoPayment] = useState<CryptoPaymentData | null>(
    null,
  );
  const [cryptoPaymentStatus, setCryptoPaymentStatus] =
    useState<CryptoPaymentStatusResponse | null>(null);
  const [paymentPolling, setPaymentPolling] = useState(false);

  useEffect(() => {
    loadMarketData();
  }, []);

  async function loadCryptoCurrencies() {
    try {
      const response = await api<{ success: boolean; data: CryptoCurrency[] }>(
        "/market/crypto/currencies",
        { requireAuth: false },
      );
      setCryptoCurrencies(response.data.filter((c) => c.enable && !c.is_fiat));
    } catch {
      // silent — crypto dropdown will show empty
    }
  }

  useEffect(() => {
    loadCryptoCurrencies();
  }, []);

  async function loadMarketData() {
    try {
      setLoading(true);
      const response = await api<{ success: boolean; data: MarketData }>(
        "/market/plans",
        { requireAuth: false },
      );
      setMarketData(response.data);
      const firstPlan = response.data.plans[0];
      if (firstPlan) {
        setSelectedPlan(firstPlan.id);
        const matchingRegion = response.data.regions.find(
          (r) => r.tier === firstPlan.tier,
        );
        if (matchingRegion) setSelectedRegion(matchingRegion.id);
      }
      if (response.data.images.length > 0)
        setSelectedImage(response.data.images[0].id);
    } catch {
      toast.error("Failed to load marketplace data");
    } finally {
      setLoading(false);
    }
  }

  const filteredPlans =
    marketData?.plans.filter((p) =>
      tierTab === "all" ? true : p.tier === tierTab,
    ) ?? [];

  const selectedPlanData = marketData?.plans.find((p) => p.id === selectedPlan);
  const selectedTier = selectedPlanData?.tier ?? "basic";

  const availableRegions =
    marketData?.regions.filter((r) => r.tier === selectedTier) ?? [];
  const totalPrice = selectedPlanData
    ? selectedPlanData.price.monthly * (duration / 30)
    : 0;

  function handlePlanSelect(planId: string) {
    setSelectedPlan(planId);
    const plan = marketData?.plans.find((p) => p.id === planId);
    if (plan) {
      const firstRegion = marketData?.regions.find((r) => r.tier === plan.tier);
      if (firstRegion) setSelectedRegion(firstRegion.id);
    }
  }

  async function handleOrder() {
    if (!selectedPlan || !selectedRegion) {
      toast.error("Please select a plan and region");
      return;
    }
    if (!isSignedIn) {
      setShowSignIn(true);
      return;
    }

    try {
      setOrdering(true);
      const response = await api<{ success: boolean; data: CredentialData }>(
        "/market/order",
        {
          method: "POST",
          body: JSON.stringify({
            plan: selectedPlan,
            region: selectedRegion,
            image:
              selectedTier === "basic"
                ? selectedImage || "windows10"
                : "windows",
            durationDays: duration,
            tier: selectedTier,
          }),
        },
      );
      toast.success("Server deployed successfully!");
      setCredentials(response.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Deployment failed");
    } finally {
      setOrdering(false);
    }
  }

  useEffect(() => {
    if (paymentMethod !== "crypto" || !totalPrice) return;
    const timer = setTimeout(async () => {
      try {
        const response = await api<{ success: boolean; data: CryptoEstimate }>(
          "/market/crypto/estimate",
          {
            requireAuth: false,
            method: "POST",
            body: JSON.stringify({
              amount: totalPrice,
              currencyTo: payCurrency,
            }),
          },
        );
        setCryptoEstimate(response.data);
      } catch {
        setCryptoEstimate(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [paymentMethod, totalPrice, payCurrency]);

  async function handleCryptoOrder() {
    if (!selectedPlan || !selectedRegion) {
      toast.error("Please select a plan and region");
      return;
    }
    if (!isSignedIn) {
      setShowSignIn(true);
      return;
    }

    try {
      setOrdering(true);
      const response = await api<{
        success: boolean;
        data: CryptoOrderResponse;
      }>("/market/crypto/order", {
        method: "POST",
        body: JSON.stringify({
          plan: selectedPlan,
          region: selectedRegion,
          image:
            selectedTier === "basic" ? selectedImage || "windows10" : "windows",
          durationDays: duration,
          tier: selectedTier,
          payCurrency,
        }),
      });
      setCryptoPayment(response.data);
      pollCryptoPayment(response.data.paymentId);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Payment creation failed",
      );
    } finally {
      setOrdering(false);
    }
  }

  async function pollCryptoPayment(paymentId: string) {
    setPaymentPolling(true);
    const maxPolls = 120;
    for (let i = 0; i < maxPolls; i++) {
      try {
        const status = await api<{
          success: boolean;
          data: CryptoPaymentStatusResponse;
        }>(`/market/crypto/payment/${paymentId}`);
        setCryptoPaymentStatus(status.data);
        if (
          status.data.orderStatus === "ACTIVE" ||
          status.data.paymentStatus === "failed" ||
          status.data.paymentStatus === "expired" ||
          status.data.paymentStatus === "refunded"
        ) {
          break;
        }
      } catch {
        // continue polling
      }
      await new Promise((r) => setTimeout(r, 5000));
    }
    setPaymentPolling(false);
  }

  const staggerContainer = {
    animate: { transition: { staggerChildren: 0.06 } },
  };
  const staggerItem = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#00f0ff]" />
            <p className="text-[#a0a0b8] text-sm font-rajdhani tracking-widest uppercase">
              Loading marketplace...
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-[#0a0a0f] py-8 px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-[#00f0ff]" />
            <span className="text-[#00f0ff] text-xs font-rajdhani tracking-[2px] uppercase">
              Instant Deployment
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-orbitron font-bold text-white">
            Server{" "}
            <span className="bg-gradient-to-r from-[#00f0ff] to-[#7b2ff7] bg-clip-text text-transparent">
              Marketplace
            </span>
          </h1>
          <p className="text-[#a0a0b8] mt-1 text-sm">
            Deploy high-performance Windows servers globally. Get credentials
            instantly.
          </p>
        </motion.div>

        <div className="grid xl:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-5">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Tabs
                value={tierTab}
                onValueChange={(v) => setTierTab(v as typeof tierTab)}
              >
                <TabsList className="bg-[#0d0d14] border border-[rgba(255,255,255,0.07)] p-1 h-auto rounded-xl">
                  {(["all", "basic", "pro"] as const).map((t) => (
                    <TabsTrigger
                      key={t}
                      value={t}
                      className={`rounded-lg px-5 py-2 text-xs font-rajdhani font-bold tracking-[1.5px] uppercase transition-all data-[state=active]:shadow-none ${
                        t === "pro"
                          ? "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7b2ff7] data-[state=active]:to-[#a855f7] data-[state=active]:text-white"
                          : t === "basic"
                            ? "data-[state=active]:bg-[rgba(0,240,255,0.12)] data-[state=active]:text-[#00f0ff]"
                            : "data-[state=active]:bg-[rgba(255,255,255,0.07)] data-[state=active]:text-white"
                      }`}
                    >
                      {t === "pro"
                        ? "⚡ Pro"
                        : t === "basic"
                          ? "Basic"
                          : "All Plans"}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </motion.div>

            {/* Side-by-side: Linode Plans + Windows Coming Soon */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Linode Plans */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(0,240,255,0.08)] flex items-center justify-center">
                    <Server className="w-4 h-4 text-[#00f0ff]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold font-rajdhani">
                      Linode Servers
                    </h3>
                    <p className="text-[#a0a0b8] text-xs">
                      High-performance Linux servers
                    </p>
                  </div>
                </div>

                {filteredPlans.filter((p) => p.tier === "basic").length ===
                0 ? (
                  <div className="rounded-xl border border-[#ffffff0a] bg-[#0d0d14] p-6 text-center">
                    <p className="text-[#a0a0b8] text-sm">
                      No Linode plans available
                    </p>
                  </div>
                ) : (
                  <motion.div
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    {filteredPlans
                      .filter((p) => p.tier === "basic")
                      .map((plan) => (
                        <motion.div key={plan.id} variants={staggerItem}>
                          <PlanCard
                            plan={plan}
                            selected={selectedPlan === plan.id}
                            onSelect={() => handlePlanSelect(plan.id)}
                          />
                        </motion.div>
                      ))}
                  </motion.div>
                )}
              </div>

              {/* Windows Coming Soon */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(123,47,247,0.08)] flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-[#a855f7]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold font-rajdhani">
                      Windows Servers
                    </h3>
                    <p className="text-[#a0a0b8] text-xs">
                      High-performance Windows RDP servers
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border-2 border-dashed border-[#ffffff1a] bg-[#0d0d14] p-8 text-center min-h-[300px] flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-[rgba(123,47,247,0.08)] border border-[rgba(123,47,247,0.2)] flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🚧</span>
                  </div>
                  <h4 className="text-white font-semibold font-rajdhani mb-2">
                    Coming Soon
                  </h4>
                  <p className="text-[#a0a0b8] text-sm max-w-xs">
                    High-performance Windows RDP servers are being added to our
                    platform. Check back soon for instant deployment.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-[#666]">
                    <Clock className="w-3 h-3" />
                    <span>Expected Q3 2026</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pro Plans Section */}
            {filteredPlans.filter((p) => p.tier === "pro").length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(123,47,247,0.08)] flex items-center justify-center">
                    <Zap className="w-4 h-4 text-[#a855f7]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold font-rajdhani">
                      Pro Servers
                    </h3>
                    <p className="text-[#a0a0b8] text-xs">
                      Premium performance servers
                    </p>
                  </div>
                </div>

                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
                >
                  {filteredPlans
                    .filter((p) => p.tier === "pro")
                    .map((plan) => (
                      <motion.div key={plan.id} variants={staggerItem}>
                        <PlanCard
                          plan={plan}
                          selected={selectedPlan === plan.id}
                          onSelect={() => handlePlanSelect(plan.id)}
                        />
                      </motion.div>
                    ))}
                </motion.div>
              </motion.div>
            )}

            {availableRegions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-[#0d0d14] rounded-xl border border-[rgba(255,255,255,0.07)] p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4 text-[#00f0ff]" />
                  <h3 className="text-white text-sm font-semibold font-rajdhani tracking-wide">
                    Select Region
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {availableRegions.map((region) => (
                    <button
                      key={region.id}
                      onClick={() => setSelectedRegion(region.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                        selectedRegion === region.id
                          ? "border-[#00f0ff]/50 bg-[rgba(0,240,255,0.08)] text-white"
                          : "border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] text-[#a0a0b8] hover:text-white hover:border-[rgba(255,255,255,0.15)]"
                      }`}
                    >
                      <span className="text-base leading-none">
                        {getRegionFlag(region.country)}
                      </span>
                      <span className="truncate font-rajdhani">
                        {region.label}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {selectedTier === "basic" &&
              marketData &&
              marketData.images.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-xl border border-[rgba(255,136,0,0.2)] bg-[rgba(255,136,0,0.04)] px-4 py-3 flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-[#ff8800] flex-shrink-0" />
                  <p className="text-[#ff8800] text-xs font-rajdhani">
                    No Windows images are configured on this account. Contact
                    support to enable Basic tier deployments.
                  </p>
                </motion.div>
              )}
            {selectedTier === "basic" &&
              marketData &&
              marketData.images.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-[#0d0d14] rounded-xl border border-[rgba(255,255,255,0.07)] p-4"
                >
                  <h3 className="text-white text-sm font-semibold font-rajdhani tracking-wide mb-3">
                    Windows Image
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {marketData.images.map((img) => (
                      <button
                        key={img.id}
                        onClick={() => setSelectedImage(img.id)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border text-left ${
                          selectedImage === img.id
                            ? "border-[#00f0ff]/50 bg-[rgba(0,240,255,0.08)] text-white"
                            : "border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] text-[#a0a0b8] hover:text-white"
                        }`}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="xl:sticky xl:top-8 self-start"
          >
            <div className="bg-[#0d0d14] rounded-xl border border-[rgba(255,255,255,0.07)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
                <h2 className="text-white font-semibold font-rajdhani tracking-wide">
                  Order Summary
                </h2>
              </div>

              <div className="p-5 space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[#a0a0b8] text-xs font-rajdhani uppercase tracking-[1px]">
                      Duration
                    </span>
                    <span className="text-white text-sm font-semibold">
                      {duration} days
                    </span>
                  </div>
                  <Slider
                    value={[duration]}
                    onValueChange={(v) => setDuration(v[0])}
                    min={7}
                    max={365}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-[#555] mt-1.5">
                    <span>7 days</span>
                    <span>365 days</span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#a0a0b8]">Plan</span>
                    <span className="text-white truncate max-w-[140px] text-right">
                      {selectedPlanData?.label || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a0a0b8]">Tier</span>
                    <span
                      className={
                        selectedTier === "pro"
                          ? "text-[#a855f7]"
                          : "text-[#00f0ff]"
                      }
                    >
                      {selectedTier === "pro" ? "⚡ Pro" : "Basic"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a0a0b8]">Region</span>
                    <span className="text-white">
                      {availableRegions.find((r) => r.id === selectedRegion)
                        ? `${getRegionFlag(availableRegions.find((r) => r.id === selectedRegion)!.country)} ${availableRegions.find((r) => r.id === selectedRegion)!.label}`
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="border-t border-[rgba(255,255,255,0.06)] pt-4">
                  <div className="flex items-end justify-between mb-4">
                    <span className="text-[#a0a0b8] text-sm">Total</span>
                    <div className="text-right">
                      <span
                        className={`text-2xl font-bold font-orbitron ${selectedTier === "pro" ? "text-[#a855f7]" : "text-[#00f0ff]"}`}
                      >
                        ${totalPrice.toFixed(2)}
                      </span>
                      <p className="text-[#555] text-[10px]">
                        for {duration} days
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1.5 mb-4">
                    <button
                      onClick={() => setPaymentMethod("balance")}
                      className={`flex-1 py-2 rounded-lg text-xs font-rajdhani font-bold tracking-[1px] uppercase transition-all border ${
                        paymentMethod === "balance"
                          ? "border-[#00f0ff]/50 bg-[rgba(0,240,255,0.08)] text-white"
                          : "border-[rgba(255,255,255,0.06)] bg-transparent text-[#555] hover:text-white"
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 inline mr-1" />
                      Balance
                    </button>
                    <button
                      onClick={() => setPaymentMethod("crypto")}
                      className={`flex-1 py-2 rounded-lg text-xs font-rajdhani font-bold tracking-[1px] uppercase transition-all border ${
                        paymentMethod === "crypto"
                          ? "border-[#7b2ff7]/50 bg-[rgba(123,47,247,0.08)] text-white"
                          : "border-[rgba(255,255,255,0.06)] bg-transparent text-[#555] hover:text-white"
                      }`}
                    >
                      <Wallet className="w-3.5 h-3.5 inline mr-1" />
                      Crypto
                    </button>
                  </div>

                  {paymentMethod === "crypto" && (
                    <div className="space-y-3 mb-4">
                      <div>
                        <label className="text-[10px] text-[#555] font-rajdhani uppercase tracking-[1px] mb-1 block">
                          Currency
                        </label>
                        <select
                          value={payCurrency}
                          onChange={(e) => setPayCurrency(e.target.value)}
                          className="w-full bg-[#0a0a0f] border border-[rgba(255,255,255,0.07)] rounded-lg px-3 py-2 text-white text-sm font-mono"
                        >
                          {cryptoCurrencies.length === 0 && (
                            <option value="btc">BTC</option>
                          )}
                          {cryptoCurrencies.map((c) => (
                            <option key={c.id} value={c.code}>
                              {c.code.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>
                      {cryptoEstimate && (
                        <div className="flex items-center justify-between bg-[rgba(123,47,247,0.06)] rounded-lg px-3 py-2 border border-[rgba(123,47,247,0.15)]">
                          <span className="text-[#a0a0b8] text-[11px] font-rajdhani uppercase tracking-[0.5px]">
                            Estimate
                          </span>
                          <span className="text-[#a855f7] text-sm font-mono">
                            ≈{" "}
                            {cryptoEstimate.estimated_amount.toFixed(
                              cryptoCurrencies.find(
                                (c) => c.code === payCurrency,
                              )?.precision ?? 8,
                            )}{" "}
                            {payCurrency.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {paymentMethod === "balance" && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] mb-4">
                      <Lock className="w-3.5 h-3.5 text-[#555]" />
                      <span className="text-[#a0a0b8] text-[11px] font-rajdhani">
                        Balance: $
                        {user?.publicMetadata?.balance
                          ? Number(user.publicMetadata.balance).toFixed(2)
                          : "0.00"}
                      </span>
                    </div>
                  )}
                </div>

                {paymentMethod === "balance" ? (
                  <Button
                    onClick={handleOrder}
                    disabled={ordering || !selectedPlan || !selectedRegion}
                    className={`w-full font-rajdhani font-bold tracking-[1.5px] uppercase py-5 text-sm transition-all ${
                      selectedTier === "pro"
                        ? "bg-gradient-to-r from-[#7b2ff7] to-[#a855f7] hover:opacity-90 text-white"
                        : "bg-gradient-to-r from-[#00f0ff] to-[#7b2ff7] hover:opacity-90 text-[#0a0a0f]"
                    }`}
                  >
                    {ordering ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2 inline" />
                        Deploy Now
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleCryptoOrder}
                    disabled={ordering || !selectedPlan || !selectedRegion}
                    className="w-full font-rajdhani font-bold tracking-[1.5px] uppercase py-5 text-sm bg-gradient-to-r from-[#7b2ff7] to-[#a855f7] hover:opacity-90 text-white transition-all"
                  >
                    {ordering ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                        Creating Payment...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4 mr-2 inline" />
                        Pay with Crypto
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <Dialog open={!!credentials} onOpenChange={() => setCredentials(null)}>
        <DialogContent className="bg-[#0d0d14] border border-[rgba(0,240,255,0.2)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-orbitron flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#00f0ff]/15 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-[#00f0ff]" />
              </div>
              Server Ready
            </DialogTitle>
          </DialogHeader>
          {credentials && (
            <div className="space-y-3 mt-2">
              <p className="text-[#a0a0b8] text-sm">
                Your credentials have also been sent to your email.
              </p>
              <CopyButton value={credentials.ip} label="IP Address" />
              <CopyButton value={credentials.username} label="Username" />
              <CopyButton value={credentials.password} label="Password" />
              <div className="flex items-center gap-2 bg-[rgba(0,240,255,0.04)] rounded-lg px-3 py-2 border border-[rgba(0,240,255,0.1)]">
                <Server className="w-3.5 h-3.5 text-[#00f0ff]" />
                <span className="text-[#a0a0b8] text-xs">
                  Expires {new Date(credentials.expiresAt).toLocaleDateString()}
                </span>
              </div>
              <Button
                onClick={() => setCredentials(null)}
                className="w-full bg-gradient-to-r from-[#00f0ff] to-[#7b2ff7] text-[#0a0a0f] font-rajdhani font-bold uppercase tracking-[1px]"
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!cryptoPayment}
        onOpenChange={() => {
          setCryptoPayment(null);
          setCryptoPaymentStatus(null);
          setPaymentPolling(false);
        }}
      >
        <DialogContent className="bg-[#0d0d14] border border-[rgba(123,47,247,0.25)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-orbitron flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#a855f7]" />
              Crypto Payment
            </DialogTitle>
          </DialogHeader>
          {cryptoPayment && (
            <div className="space-y-4 mt-2">
              <div className="bg-[#0a0a0f] rounded-lg p-4 border border-[rgba(123,47,247,0.2)]">
                <p className="text-[#a0a0b8] text-[10px] font-rajdhani uppercase tracking-[1px] mb-2">
                  Send exactly
                </p>
                <p className="text-white text-2xl font-mono font-bold">
                  {cryptoPayment.cryptoAmount}{" "}
                  {cryptoPayment.payCurrency.toUpperCase()}
                </p>
              </div>

              <div>
                <p className="text-[#a0a0b8] text-[10px] font-rajdhani uppercase tracking-[1px] mb-1.5">
                  Wallet Address
                </p>
                <div className="bg-[#0a0a0f] rounded-lg border border-[rgba(255,255,255,0.06)] flex items-center">
                  <code className="flex-1 text-white text-xs font-mono px-3 py-2.5 break-all">
                    {cryptoPayment.payAddress}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(cryptoPayment.payAddress);
                      toast.success("Address copied");
                    }}
                    className="px-3 py-2.5 text-[#a0a0b8] hover:text-white transition-colors flex-shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-[rgba(123,47,247,0.06)] rounded-lg px-3 py-2 border border-[rgba(123,47,247,0.15)]">
                <Clock className="w-3.5 h-3.5 text-[#a855f7]" />
                <span className="text-[#a0a0b8] text-xs">
                  Payment link expires in 1 hour
                </span>
              </div>

              {cryptoPaymentStatus && (
                <div
                  className={`rounded-lg p-3 ${
                    cryptoPaymentStatus.paymentStatus === "partially_paid"
                      ? "bg-[rgba(255,136,0,0.08)] border border-[rgba(255,136,0,0.25)]"
                      : cryptoPaymentStatus.paymentStatus === "confirmed" ||
                          cryptoPaymentStatus.paymentStatus === "finished"
                        ? "bg-[rgba(0,240,255,0.08)] border border-[rgba(0,240,255,0.2)]"
                        : cryptoPaymentStatus.paymentStatus === "failed" ||
                            cryptoPaymentStatus.paymentStatus === "expired" ||
                            cryptoPaymentStatus.paymentStatus === "refunded"
                          ? "bg-[rgba(255,68,68,0.08)] border border-[rgba(255,68,68,0.2)]"
                          : "bg-[rgba(123,47,247,0.06)] border border-[rgba(123,47,247,0.15)]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {paymentPolling &&
                      cryptoPaymentStatus.paymentStatus !== "confirmed" &&
                      cryptoPaymentStatus.paymentStatus !== "finished" &&
                      cryptoPaymentStatus.paymentStatus !== "failed" &&
                      cryptoPaymentStatus.paymentStatus !== "expired" &&
                      cryptoPaymentStatus.paymentStatus !== "refunded" && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#a855f7]" />
                      )}
                    <span className="text-white text-sm font-rajdhani uppercase tracking-[1px]">
                      Status: {cryptoPaymentStatus.paymentStatus}
                    </span>
                  </div>
                  {cryptoPaymentStatus.paymentStatus === "partially_paid" && (
                    <p className="text-[#ff8800] text-xs mt-1">
                      Partially paid — send remaining to complete
                    </p>
                  )}
                  {cryptoPaymentStatus.paymentStatus === "waiting" &&
                    paymentPolling && (
                      <p className="text-[#a0a0b8] text-xs mt-1">
                        Waiting for transaction to be detected...
                      </p>
                    )}
                </div>
              )}

              {(cryptoPaymentStatus?.paymentStatus === "failed" ||
                cryptoPaymentStatus?.paymentStatus === "expired" ||
                cryptoPaymentStatus?.paymentStatus === "refunded") && (
                <div className="space-y-2">
                  <p className="text-[#ff4444] text-xs text-center">
                    Payment was not completed
                  </p>
                  <Button
                    onClick={() => {
                      setCryptoPayment(null);
                      setCryptoPaymentStatus(null);
                      handleCryptoOrder();
                    }}
                    className="w-full bg-gradient-to-r from-[#7b2ff7] to-[#a855f7] text-white font-rajdhani font-bold uppercase tracking-[1px] text-sm"
                  >
                    Try Again
                  </Button>
                </div>
              )}

              {cryptoPaymentStatus?.orderStatus === "ACTIVE" &&
                !credentials && (
                  <div className="text-center space-y-2">
                    <Check className="w-8 h-8 text-[#00f0ff] mx-auto" />
                    <p className="text-white font-semibold">
                      Payment Confirmed!
                    </p>
                    <p className="text-[#a0a0b8] text-xs">
                      Your server is being provisioned. Check your email for
                      credentials.
                    </p>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showSignIn} onOpenChange={setShowSignIn}>
        <DialogContent className="bg-[#0d0d14] border border-[rgba(0,240,255,0.2)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-orbitron text-center">
              Sign in to deploy
            </DialogTitle>
          </DialogHeader>
          <SignIn />
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
