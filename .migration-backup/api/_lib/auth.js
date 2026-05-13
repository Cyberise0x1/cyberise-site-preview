import * as jose from "jose";

const CLERK_JWKS_URL = "https://api.clerk.com/v1/jwks";
let jwks: jose.JSONWebKeySet | null = null;
let jwksExpiresAt = 0;

async function getJWKS() {
  if (jwks && Date.now() < jwksExpiresAt) return jwks;
  const res = await fetch(CLERK_JWKS_URL);
  jwks = await res.json();
  jwksExpiresAt = Date.now() + 300_000;
  return jwks;
}

function extractToken(headers) {
  const auth = headers.authorization || headers.Authorization || "";
  const match = auth.match(/^Bearer (.+)$/i);
  return match ? match[1] : null;
}

export async function verifyClerkToken(headers) {
  const token = extractToken(headers);
  if (!token) return null;

  try {
    const { payload } = await jose.jwtVerify(token, getJWKS, {
      issuer: (iss) => iss?.startsWith("https://clerk.") || iss?.includes(".clerk.accounts.dev"),
      requiredClaims: ["sub"],
    });
    return { userId: payload.sub };
  } catch {
    return null;
  }
}

export function json(res, data, status = 200) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.status(status).json(data);
}

export function success(res, data, status = 200) {
  json(res, { success: true, data }, status);
}

export function error(res, message, status = 500) {
  json(res, { success: false, error: message }, status);
}

export function handleOptions(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}
