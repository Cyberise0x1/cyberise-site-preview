import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useApi } from "@/lib/api";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Save,
  Plus,
  Trash2,
  Tag,
  Calendar,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Settings {
  markup_percentage: number;
  enabled_regions: string[];
  enabled_plans: string[];
  fallback_enabled: boolean;
  auto_terminate_expired: boolean;
  min_order_days: number;
  max_order_days: number;
  max_active_orders?: number;
}

interface PromoCode {
  id: string;
  code: string;
  discountPercent: number;
  maxUses: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string | null;
  active: boolean;
  createdAt: string;
}

interface NewPromoCode {
  code: string;
  discountPercent: number;
  maxUses: number | null;
  validUntil: string | null;
}

export default function AdminSettings() {
  const { api } = useApi();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Promo code state
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPromo, setNewPromo] = useState<NewPromoCode>({
    code: "",
    discountPercent: 10,
    maxUses: null,
    validUntil: null,
  });
  const [creatingPromo, setCreatingPromo] = useState(false);

  useEffect(() => {
    loadSettings();
    loadPromoCodes();
  }, []);

  async function loadSettings() {
    try {
      const response = await api<{ success: boolean; data: Settings }>(
        "/admin/settings",
      );
      setSettings(response.data);
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    if (!settings) return;
    try {
      setSaving(true);
      await api("/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(settings),
      });
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function loadPromoCodes() {
    try {
      setPromoLoading(true);
      const response = await api<{ success: boolean; data: PromoCode[] }>(
        "/admin/promo-codes",
      );
      setPromoCodes(response.data);
    } catch {
      // silent fail - promo codes section will show empty
    } finally {
      setPromoLoading(false);
    }
  }

  async function createPromoCode() {
    if (!newPromo.code.trim()) {
      toast.error("Promo code is required");
      return;
    }

    try {
      setCreatingPromo(true);
      await api("/admin/promo-codes", {
        method: "POST",
        body: JSON.stringify(newPromo),
      });
      toast.success("Promo code created");
      setShowCreateDialog(false);
      setNewPromo({
        code: "",
        discountPercent: 10,
        maxUses: null,
        validUntil: null,
      });
      loadPromoCodes();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create promo code",
      );
    } finally {
      setCreatingPromo(false);
    }
  }

  async function togglePromoCode(id: string, active: boolean) {
    try {
      await api(`/admin/promo-codes/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ active }),
      });
      toast.success(active ? "Promo code activated" : "Promo code deactivated");
      loadPromoCodes();
    } catch {
      toast.error("Failed to update promo code");
    }
  }

  async function deletePromoCode(id: string) {
    try {
      await api(`/admin/promo-codes/${id}`, { method: "DELETE" });
      toast.success("Promo code deleted");
      loadPromoCodes();
    } catch {
      toast.error("Failed to delete promo code");
    }
  }

  function update(key: string, value: unknown) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#00f0ff]" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              Market Settings
            </h1>
            <p className="text-[#a0a0b8]">
              Configure pricing, regions, and platform behavior
            </p>
          </div>
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="bg-gradient-to-r from-[#00f0ff] to-[#7b2ff7] hover:opacity-90 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-[#12121a]/80 border-[#00f0ff]/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-lg">Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-[#a0a0b8] text-sm">
                  Markup Percentage (%)
                </Label>
                <Input
                  type="number"
                  value={settings?.markup_percentage ?? 20}
                  onChange={(e) =>
                    update("markup_percentage", Number(e.target.value))
                  }
                  className="bg-[#0a0a0f] border-[#ffffff1a] text-white mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#a0a0b8] text-sm">
                    Min Order Days
                  </Label>
                  <Input
                    type="number"
                    value={settings?.min_order_days ?? 7}
                    onChange={(e) =>
                      update("min_order_days", Number(e.target.value))
                    }
                    className="bg-[#0a0a0f] border-[#ffffff1a] text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[#a0a0b8] text-sm">
                    Max Order Days
                  </Label>
                  <Input
                    type="number"
                    value={settings?.max_order_days ?? 365}
                    onChange={(e) =>
                      update("max_order_days", Number(e.target.value))
                    }
                    className="bg-[#0a0a0f] border-[#ffffff1a] text-white mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#12121a]/80 border-[#7b2ff7]/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-lg">
                Enabled Regions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={settings?.enabled_regions?.join(", ") ?? ""}
                onChange={(e) =>
                  update(
                    "enabled_regions",
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="us-east, us-west, eu-west"
                className="bg-[#0a0a0f] border-[#ffffff1a] text-white"
              />
              <p className="text-[#666] text-xs mt-2">
                Comma-separated region IDs from Linode API
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#12121a]/80 border-[#7b2ff7]/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-lg">
                Enabled Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={settings?.enabled_plans?.join(", ") ?? ""}
                onChange={(e) =>
                  update(
                    "enabled_plans",
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="g6-nanode-1, g6-standard-1"
                className="bg-[#0a0a0f] border-[#ffffff1a] text-white"
              />
              <p className="text-[#666] text-xs mt-2">
                Comma-separated plan IDs from Linode API
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#12121a]/80 border-[#ffffff1a] backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-lg">Behavior</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white text-sm">Fallback Regions</Label>
                  <p className="text-[#666] text-xs">
                    Suggest nearby regions when capacity is full
                  </p>
                </div>
                <Switch
                  checked={settings?.fallback_enabled ?? true}
                  onCheckedChange={(v) => update("fallback_enabled", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white text-sm">
                    Auto-Terminate Expired
                  </Label>
                  <p className="text-[#666] text-xs">
                    Automatically destroy expired instances via cron
                  </p>
                </div>
                <Switch
                  checked={settings?.auto_terminate_expired ?? true}
                  onCheckedChange={(v) => update("auto_terminate_expired", v)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Promo Codes Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Promo Codes
              </h2>
              <p className="text-[#a0a0b8]">
                Manage discount codes for marketplace purchases
              </p>
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-[#00f0ff] to-[#7b2ff7] hover:opacity-90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Promo Code
            </Button>
          </div>

          <Card className="bg-[#12121a]/80 border-[#00f0ff]/20 backdrop-blur-sm">
            <CardContent className="p-0">
              {promoLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#00f0ff]" />
                </div>
              ) : promoCodes.length === 0 ? (
                <div className="text-center py-12">
                  <Tag className="w-12 h-12 text-[#333] mx-auto mb-3" />
                  <p className="text-[#666]">No promo codes yet</p>
                  <p className="text-[#555] text-sm mt-1">
                    Create your first promo code to offer discounts
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#ffffff0a]">
                        <th className="text-left text-[#666] text-xs font-rajdhani uppercase tracking-[1px] px-4 py-3">
                          Code
                        </th>
                        <th className="text-left text-[#666] text-xs font-rajdhani uppercase tracking-[1px] px-4 py-3">
                          Discount
                        </th>
                        <th className="text-left text-[#666] text-xs font-rajdhani uppercase tracking-[1px] px-4 py-3">
                          Usage
                        </th>
                        <th className="text-left text-[#666] text-xs font-rajdhani uppercase tracking-[1px] px-4 py-3">
                          Valid Until
                        </th>
                        <th className="text-left text-[#666] text-xs font-rajdhani uppercase tracking-[1px] px-4 py-3">
                          Status
                        </th>
                        <th className="text-right text-[#666] text-xs font-rajdhani uppercase tracking-[1px] px-4 py-3">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {promoCodes.map((promo) => (
                        <tr
                          key={promo.id}
                          className="border-b border-[#ffffff06] hover:bg-[#ffffff03]"
                        >
                          <td className="px-4 py-3">
                            <span className="text-white font-mono text-sm">
                              {promo.code}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[#00f0ff] font-semibold">
                              {promo.discountPercent}%
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-[#666]" />
                              <span className="text-white text-sm">
                                {promo.usedCount}
                                {promo.maxUses !== null &&
                                  ` / ${promo.maxUses}`}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-[#666]" />
                              <span className="text-[#a0a0b8] text-sm">
                                {promo.validUntil
                                  ? new Date(
                                      promo.validUntil,
                                    ).toLocaleDateString()
                                  : "Never"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Switch
                              checked={promo.active}
                              onCheckedChange={(v) =>
                                togglePromoCode(promo.id, v)
                              }
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletePromoCode(promo.id)}
                              className="text-[#666] hover:text-[#ff4444] hover:bg-[#ff444410]"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Create Promo Code Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-[#0d0d14] border border-[rgba(0,240,255,0.2)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-orbitron flex items-center gap-2">
              <Tag className="w-5 h-5 text-[#00f0ff]" />
              Create Promo Code
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-[#a0a0b8] text-sm">Code</Label>
              <Input
                value={newPromo.code}
                onChange={(e) =>
                  setNewPromo({
                    ...newPromo,
                    code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="SUMMER2026"
                className="bg-[#0a0a0f] border-[#ffffff1a] text-white font-mono mt-1"
              />
            </div>
            <div>
              <Label className="text-[#a0a0b8] text-sm">
                Discount Percentage
              </Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={newPromo.discountPercent}
                onChange={(e) =>
                  setNewPromo({
                    ...newPromo,
                    discountPercent: Number(e.target.value),
                  })
                }
                className="bg-[#0a0a0f] border-[#ffffff1a] text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-[#a0a0b8] text-sm">
                Max Uses{" "}
                <span className="text-[#555]">(leave empty for unlimited)</span>
              </Label>
              <Input
                type="number"
                min={1}
                value={newPromo.maxUses ?? ""}
                onChange={(e) =>
                  setNewPromo({
                    ...newPromo,
                    maxUses: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="Unlimited"
                className="bg-[#0a0a0f] border-[#ffffff1a] text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-[#a0a0b8] text-sm">
                Valid Until{" "}
                <span className="text-[#555]">(leave empty for no expiry)</span>
              </Label>
              <Input
                type="date"
                value={newPromo.validUntil?.split("T")[0] ?? ""}
                onChange={(e) =>
                  setNewPromo({
                    ...newPromo,
                    validUntil: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  })
                }
                className="bg-[#0a0a0f] border-[#ffffff1a] text-white mt-1"
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="border-[#ffffff1a] text-[#a0a0b8] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={createPromoCode}
              disabled={creatingPromo || !newPromo.code.trim()}
              className="bg-gradient-to-r from-[#00f0ff] to-[#7b2ff7] hover:opacity-90 text-white"
            >
              {creatingPromo ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Code"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
