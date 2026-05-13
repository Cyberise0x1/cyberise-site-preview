import { useState, useEffect } from "react";
import { useAuth, SignIn } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { useApi, type MarketData } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Server, Globe, HardDrive, Cpu } from "lucide-react";
import { toast } from "sonner";

export default function Market() {
  const { api } = useApi();
  const { isSignedIn } = useAuth();
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    loadMarketData();
  }, []);

  async function loadMarketData() {
    try {
      setLoading(true);
      const response = await api<{ success: boolean; data: MarketData }>("/market/plans", { requireAuth: false });
      setMarketData(response.data);
      if (response.data.plans.length > 0) setSelectedPlan(response.data.plans[0].id);
      if (response.data.regions.length > 0) setSelectedRegion(response.data.regions[0].id);
      if (response.data.images.length > 0) setSelectedImage(response.data.images[0].id);
    } catch (error) {
      toast.error("Failed to load market data");
    } finally {
      setLoading(false);
    }
  }

  const selectedPlanData = marketData?.plans.find(p => p.id === selectedPlan);
  const totalPrice = selectedPlanData ? selectedPlanData.price.monthly * (duration / 30) : 0;

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
      const response = await api<{ success: boolean; data: { orderId: string; ip: string; username: string; password: string; expiresAt: string } }>("/market/order", {
        method: "POST",
        body: JSON.stringify({
          plan: selectedPlan,
          region: selectedRegion,
          image: selectedImage || "linode/windows10",
          durationDays: duration,
        }),
      });

      toast.success("RDP instance created successfully!");
      const { ip, username, password, expiresAt } = response.data;
      alert(`Your RDP Credentials:\n\nIP: ${ip}\nUsername: ${username}\nPassword: ${password}\nExpires: ${new Date(expiresAt).toLocaleDateString()}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create order");
    } finally {
      setOrdering(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#1a1a2e] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00f0ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#1a1a2e] py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">
            <span className="bg-gradient-to-r from-[#00f0ff] to-[#7b2ff7] bg-clip-text text-transparent">
              RDP Marketplace
            </span>
          </h1>
          <p className="text-[#a0a0b8] text-center mb-12 max-w-2xl mx-auto">
            Deploy high-performance Windows RDP instances in seconds. Choose your configuration and get instant access.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          <motion.div
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-[#12121a]/80 border-[#00f0ff]/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-[#00f0ff]" />
                  Select Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                {marketData?.plans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPlan === plan.id
                        ? "border-[#00f0ff] bg-[#00f0ff]/10"
                        : "border-[#ffffff1a] hover:border-[#00f0ff]/50"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-white font-semibold">{plan.label}</h3>
                      <span className="text-[#00f0ff] font-bold">${plan.price.monthly}/mo</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm text-[#a0a0b8]">
                      <div className="flex items-center gap-1">
                        <Cpu className="w-4 h-4" />
                        {plan.vcpus} vCPU
                      </div>
                      <div className="flex items-center gap-1">
                        <HardDrive className="w-4 h-4" />
                        {plan.ram / 1024}GB RAM
                      </div>
                      <div className="flex items-center gap-1">
                        <Server className="w-4 h-4" />
                        {plan.disk / 1024}GB SSD
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-[#12121a]/80 border-[#00f0ff]/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#00f0ff]" />
                  Region & Image
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-[#a0a0b8] text-sm mb-2 block">Region</label>
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger className="bg-[#0a0a0f] border-[#ffffff1a] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#12121a] border-[#ffffff1a]">
                      {marketData?.regions.map((region) => (
                        <SelectItem key={region.id} value={region.id} className="text-white">
                          {region.label} ({region.country})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-[#a0a0b8] text-sm mb-2 block">Windows Image</label>
                  <Select value={selectedImage} onValueChange={setSelectedImage}>
                    <SelectTrigger className="bg-[#0a0a0f] border-[#ffffff1a] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#12121a] border-[#ffffff1a]">
                      {marketData?.images.map((image) => (
                        <SelectItem key={image.id} value={image.id} className="text-white">
                          {image.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-[#12121a]/80 border-[#00f0ff]/20 backdrop-blur-sm sticky top-24">
              <CardHeader>
                <CardTitle className="text-white">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-[#a0a0b8] text-sm mb-2 block">
                    Duration: {duration} days
                  </label>
                  <Slider
                    value={[duration]}
                    onValueChange={(v) => setDuration(v[0])}
                    min={7}
                    max={365}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-[#666] mt-1">
                    <span>7 days</span>
                    <span>365 days</span>
                  </div>
                </div>

                <div className="border-t border-[#ffffff1a] pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-[#a0a0b8]">Plan</span>
                    <span className="text-white">{selectedPlanData?.label || "-"}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[#a0a0b8]">Duration</span>
                    <span className="text-white">{duration} days</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-[#ffffff1a]">
                    <span className="text-lg font-semibold text-white">Total</span>
                    <span className="text-2xl font-bold text-[#00f0ff]">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleOrder}
                  disabled={ordering || !selectedPlan || !selectedRegion}
                  className="w-full bg-gradient-to-r from-[#00f0ff] to-[#7b2ff7] hover:opacity-90 text-white font-semibold py-6"
                >
                  {ordering ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Deploy RDP Instance"
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showSignIn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0f]/80 backdrop-blur-sm"
            onClick={() => setShowSignIn(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#12121a] border border-[#00f0ff]/20 rounded-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-6 text-center">Sign in to deploy</h2>
              <SignIn />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
