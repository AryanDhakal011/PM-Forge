import { z } from "zod";

export const USER_KEY = "pmforge.user";

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Use at least two characters for your name.")
    .max(60, "Keep your name to 60 characters or fewer."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address, such as you@company.com."),
  goal: z.enum([
    "product-manager",
    "aspiring-pm",
    "career-switcher",
    "founder",
  ]),
  consent: z.boolean().refine((value) => value, {
    message: "Confirm that you understand this profile stays in this browser.",
  }),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter the email address you used to create the profile."),
});

export type SignupValues = z.infer<typeof signupSchema>;

export type LocalUser = {
  name: string;
  email: string;
  goal: string;
  createdAt: string;
  lastSeenAt: string;
};

const userSchema = z.object({
  name: z.string(),
  email: z.string(),
  goal: z.string(),
  createdAt: z.string(),
  lastSeenAt: z.string(),
});

export function readUser(): LocalUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = userSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function saveUser(user: Omit<LocalUser, "lastSeenAt">): LocalUser {
  const next: LocalUser = { ...user, lastSeenAt: new Date().toISOString() };
  window.localStorage.setItem(USER_KEY, JSON.stringify(next));
  return next;
}

export function clearUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USER_KEY);
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export const GOAL_LABELS: Record<string, string> = {
  "product-manager": "Practising product manager",
  "aspiring-pm": "Aspiring product manager",
  "career-switcher": "Career switcher",
  founder: "Founder or operator",
};
