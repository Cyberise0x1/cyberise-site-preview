import crypto from "node:crypto";
import { env } from "../utils/env";
import { getCache, setCache } from "./redis";
import { logger } from "../lib/logger";

const getApiBase = () => env.NOWPAYMENTS_API_URL.replace(/\/$/, "");
const CACHE_KEY_CURRENCIES = "nowpayments:currencies";
const CACHE_TTL = 600;

export interface NowPaymentsCurrency {
  id: number;
  code: string;
  name: string;
  enable: boolean;
  wallet_regex: string;
  priority: number;
  extra_id_exists: boolean;
  extra_id_name: string | null;
  cumulativeDepositAddressEnabled: boolean;
  is_fiat: boolean;
  fee_percent: number;
  precision: number;
  icon_url?: string;
}

export interface NowPaymentsEstimate {
  currency_from: string;
  amount_from: number;
  currency_to: string;
  estimated_amount: number;
}

export interface NowPaymentsCreatePaymentParams {
  price_amount: number;
  price_currency: string;
  pay_currency: string;
  order_id?: string;
  order_description?: string;
  ipn_callback_url?: string;
  success_url?: string;
  cancel_url?: string;
}

export interface NowPaymentsPaymentResult {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  ipn_callback_url: string;
  created_at: string;
  updated_at: string;
  purchase_id: string;
}

export interface NowPaymentsPaymentStatus {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  actually_paid: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  purchase_id: string;
  outcome_amount: number;
  outcome_currency: string;
  created_at: string;
  updated_at: string;
}

class NowPaymentsError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "NowPaymentsError";
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${getApiBase()}${path}`;
  const headers: Record<string, string> = {
    "x-api-key": env.NOWPAYMENTS_API_KEY,
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const body = await res.text();
    logger.error({ status: res.status, url, body }, "NowPayments API error");
    throw new NowPaymentsError(
      `NowPayments API error: ${res.status}`,
      res.status,
      body,
    );
  }

  return res.json() as Promise<T>;
}

export async function getCurrencies(): Promise<NowPaymentsCurrency[]> {
  const cached = await getCache<NowPaymentsCurrency[]>(CACHE_KEY_CURRENCIES);
  if (cached) return cached;

  const data = await request<NowPaymentsCurrency[]>("/v1/currencies");
  const currencies = Array.isArray(data) ? data : [];

  await setCache(CACHE_KEY_CURRENCIES, currencies, CACHE_TTL);
  return currencies;
}

export async function getEstimate(
  amount: number,
  currencyFrom: string,
  currencyTo: string,
): Promise<NowPaymentsEstimate> {
  const params = new URLSearchParams({
    amount: amount.toFixed(2),
    currency_from: currencyFrom,
    currency_to: currencyTo,
  });
  return request<NowPaymentsEstimate>(`/v1/estimate?${params.toString()}`);
}

export async function createPayment(
  params: NowPaymentsCreatePaymentParams,
): Promise<NowPaymentsPaymentResult> {
  return request<NowPaymentsPaymentResult>("/v1/payment", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function getPaymentStatus(
  paymentId: string,
): Promise<NowPaymentsPaymentStatus> {
  return request<NowPaymentsPaymentStatus>(`/v1/payment/${paymentId}`);
}

export function verifyIpnSignature(
  rawBody: string,
  signatureHeader: string,
): boolean {
  if (!signatureHeader) return false;

  try {
    const hmac = crypto.createHmac("sha512", env.NOWPAYMENTS_IPN_SECRET);
    hmac.update(rawBody);
    const computed = hmac.digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(signatureHeader),
    );
  } catch (err) {
    logger.error({ err }, "NowPayments IPN signature verification failed");
    return false;
  }
}
