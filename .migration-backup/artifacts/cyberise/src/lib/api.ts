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

export type MarketData = {
  plans: Array<{
    id: string;
    label: string;
    disk: number;
    ram: number;
    vcpus: number;
    price: {
      hourly: number;
      monthly: number;
    };
  }>;
  regions: Array<{
    id: string;
    label: string;
    country: string;
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
};
