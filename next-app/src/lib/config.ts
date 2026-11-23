/* Site configuration.
   Firebase keys come from environment variables (see .env.example). With no keys set,
   the site runs in DEMO mode: fully clickable, data saved only in the visitor's browser.
   The Firebase web config is safe to expose; firestore.rules protects the data. */

const env = (k: string) => process.env[k] || "";

export const firebaseConfig = env("NEXT_PUBLIC_FIREBASE_API_KEY")
  ? {
      apiKey: env("NEXT_PUBLIC_FIREBASE_API_KEY"),
      authDomain: env("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
      projectId: env("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
      storageBucket: env("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
      messagingSenderId: env("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
      appId: env("NEXT_PUBLIC_FIREBASE_APP_ID"),
    }
  : null;

/** Which backend adapter to use. "firebase" when keys are set; "demo" otherwise.
 *  A future "supabase" adapter plugs in here without touching any page. */
export const BACKEND: "firebase" | "demo" = firebaseConfig ? "firebase" : "demo";

/** Only these email addresses can sign in (all BITS campuses). Keep in sync with isBits() in firestore.rules. */
export const ALLOWED_EMAIL = /@([a-z0-9-]+\.)?bits-pilani\.ac\.in$/i;

export interface SiteSettings {
  whatsapp: string;
  joinForm: string;
  vistadexUrl: string;
  vistadexBlurb: string;
  announcement: string;
  contactEmail: string;
}

/** Defaults; admins change these in Admin → Settings. */
export const DEFAULT_SETTINGS: SiteSettings = {
  whatsapp: "https://chat.whatsapp.com/CgdFfY7ZBwIA0yCYVJ6MDE",
  joinForm: "https://forms.gle/7MAqWXS734hUsFnt9",
  vistadexUrl: "",
  vistadexBlurb:
    "VistaDex helps founders validate an idea in a structured way and see where it's strong and where it's risky, before committing months to building it.",
  announcement: "",
  contactEmail: "",
};
