import { useEffect, createContext, useContext, type ReactNode } from "react";
import { useAuth } from "@clerk/clerk-react";

export type ThemePreset = "cyber" | "midnight" | "matrix";

export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  darkBg: string;
  darkSurface: string;
  darkCard: string;
  textSecondary: string;
}

const THEME_PRESETS: Record<ThemePreset, ThemeConfig> = {
  cyber: {
    primary: "var(--primary)",
    secondary: "#7b2ff7",
    accent: "#ff2d55",
    darkBg: "#0a0a0f",
    darkSurface: "#12121a",
    darkCard: "#1a1a2e",
    textSecondary: "#a0a0b8",
  },
  midnight: {
    primary: "#6366f1",
    secondary: "#8b5cf6",
    accent: "#f43f5e",
    darkBg: "#0f172a",
    darkSurface: "#1e293b",
    darkCard: "#334155",
    textSecondary: "#94a3b8",
  },
  matrix: {
    primary: "#00ff88",
    secondary: "#00cc66",
    accent: "#ff0033",
    darkBg: "#000000",
    darkSurface: "#0a0a0a",
    darkCard: "#141414",
    textSecondary: "#666666",
  },
};

interface ThemeContextValue {
  currentTheme: ThemePreset;
  themeConfig: ThemeConfig;
  setTheme: (theme: ThemePreset) => Promise<void>;
  availableThemes: [ThemePreset, ThemeConfig][];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useThemeConfig() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeConfig must be used within ThemeProvider");
  return ctx;
}

interface ThemeProviderProps {
  children: ReactNode;
}

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const { getToken } = useAuth();

  useEffect(() => {
    // Load theme from backend on mount — no auth needed for public page
    (async () => {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        const token = await getToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}/admin/settings`, { headers });
        const data = await response.json();

        const savedTheme = data?.theme as ThemePreset | undefined;
        if (savedTheme && THEME_PRESETS[savedTheme]) {
          applyTheme(THEME_PRESETS[savedTheme]);
        }
      } catch {
        // Use defaults — no theme saved yet
      }
    })();
  }, []);

  return <>{children}</>;
}

function applyTheme(config: ThemeConfig) {
  const root = document.documentElement;
  const map: Record<string, string> = {
    "--primary": config.primary,
    "--secondary": config.secondary,
    "--accent": config.accent,
    "--dark-bg": config.darkBg,
    "--dark-surface": config.darkSurface,
    "--dark-card": config.darkCard,
    "--text-secondary": config.textSecondary,

    // Auto-derive gradient from the new colors
    "--gradient-1": `linear-gradient(135deg, ${config.primary}, ${config.secondary})`,
    "--gradient-2": `linear-gradient(135deg, ${config.secondary}, ${config.accent})`,
    "--gradient-3": `linear-gradient(135deg, ${config.primary}, #00ff88)`,

    // Auto-derive glow
    "--glow-primary": `0 0 30px ${config.primary}33`,
    "--glow-secondary": `0 0 30px ${config.secondary}33`,
  };

  Object.entries(map).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

export { THEME_PRESETS, applyTheme };
