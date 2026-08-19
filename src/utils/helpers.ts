import { v4 as uuidv4 } from "uuid";

export const generateId = () => uuidv4();

export const generateReceiptNumber = (outletId: string): string => {
  const prefix = outletId.slice(0, 4).toUpperCase();
  const ts = Date.now().toString(36).toUpperCase();
  return `${prefix}-${ts}`;
};

const currencyLocales: Record<string, string> = {
  NGN: "en-NG",
  USD: "en-US",
  GBP: "en-GB",
  GHS: "en-GH",
  IDR: "id-ID",
};

export const formatCurrency = (amount: number, currency = "IDR"): string => {
  const locale = currencyLocales[currency] ?? "en-US";
  const fractionDigits = currency === "IDR" ? 0 : 2;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
};

export const formatDate = (iso: string): string => {
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
};

export const formatDateShort = (iso: string): string => {
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
};

export const hashPin = async (pin: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + "KasihPOS pro_salt_v1");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const verifyPin = async (
  pin: string,
  hash: string,
): Promise<boolean> => {
  const computed = await hashPin(pin);
  return computed === hash;
};

export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "KasihPOS pro_merchant_salt_v1");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const verifyPassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  const computed = await hashPassword(password);
  return computed === hash;
};

export const getTodayStart = (): string => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

export const getMonthStart = (): string => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

export const clsx = (
  ...classes: (string | undefined | false | null)[]
): string => classes.filter(Boolean).join(" ");
