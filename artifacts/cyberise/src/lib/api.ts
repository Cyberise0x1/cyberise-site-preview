import { useAuth } from "@clerk/clerk-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
}

export function useApi() {
  const { getToken } = useAuth();

  async function api<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { requireAuth = true, ...fetchOptions } = options;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((fetchOptions.headers as Record<string, string>) || {}),
    };

    if (requireAuth) {
      const token = await getToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data;
  }

  return { api };
}

export type PlanTier = "basic" | "pro";

export type MarketData = {
  plans: Array<{
    id: string;
    label: string;
    disk: number;
    ram: number;
    vcpus: number;
    tier: PlanTier;
    price: {
      hourly: number;
      monthly: number;
    };
  }>;
  regions: Array<{
    id: string;
    label: string;
    country: string;
    tier: PlanTier;
  }>;
  images: Array<{
    id: string;
    label: string;
  }>;
};

export type Order = {
  id: string;
  plan: string;
  region: string;
  ip: string | null;
  rdpUsername: string | null;
  status: "PENDING" | "ACTIVE" | "TERMINATED" | "FAILED";
  amount: number;
  expiresAt: string;
  createdAt: string;
  rdpPassword?: string | null;
  tier?: PlanTier;
  metadata?: Record<string, unknown> | null;
};

export type CryptoCurrency = {
  id: number;
  code: string;
  name: string;
  enable: boolean;
  is_fiat: boolean;
  precision: number;
  icon_url?: string;
};

export type CryptoEstimate = {
  currency_from: string;
  amount_from: number;
  currency_to: string;
  estimated_amount: number;
};

export type CryptoOrderResponse = {
  orderId: string;
  paymentId: string;
  payAddress: string;
  payCurrency: string;
  cryptoAmount: number;
  fiatAmount: number;
  paymentStatus: string;
};

export type CryptoPaymentStatusResponse = {
  paymentId: string;
  paymentStatus: string;
  actuallyPaid: number;
  payAmount: number;
  payCurrency: string;
  orderStatus: string;
};

export function getDaysLeft(expiresAt: string): number {
  const now = new Date();
  const exp = new Date(expiresAt);
  const diff = exp.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getRegionFlag(country: string): string {
  const flags: Record<string, string> = {
    us: "🇺🇸", gb: "🇬🇧", de: "🇩🇪", fr: "🇫🇷", nl: "🇳🇱",
    sg: "🇸🇬", jp: "🇯🇵", au: "🇦🇺", ca: "🇨🇦", in: "🇮🇳",
    br: "🇧🇷", za: "🇿🇦", ng: "🇳🇬", ae: "🇦🇪", se: "🇸🇪",
    it: "🇮🇹", es: "🇪🇸", id: "🇮🇩", kr: "🇰🇷", ch: "🇨🇭",
  };
  return flags[country?.toLowerCase()] ?? "🌐";
}
