import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useApi } from "@/lib/api";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

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

export default function AdminSettings() {
  const { api } = useApi();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
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
      </motion.div>
    </AdminLayout>
  );
}
