/* ==========================================================
   FBC site configuration
   ----------------------------------------------------------
   1. Leave `firebase` as null  -> the site runs in DEMO mode:
      everything works, but data is saved only in the visitor's
      own browser. Good for previews and design reviews.
   2. Paste your Firebase web config (Firebase console ->
      Project settings -> Your apps -> Web app -> Config)
      -> the site runs LIVE: real Google sign-in, shared database,
      admin console. See SETUP.md.

   The Firebase web config is safe to commit: it only identifies
   the project. Access is controlled by firestore.rules.
   ========================================================== */
export const config = {
  firebase: null,
  // firebase: {
  //   apiKey: "…",
  //   authDomain: "fbc-bits.firebaseapp.com",
  //   projectId: "fbc-bits",
  //   storageBucket: "fbc-bits.firebasestorage.app",
  //   messagingSenderId: "…",
  //   appId: "…",
  // },

  // Firebase JS SDK, loaded from Google's CDN only in live mode.
  sdkVersion: "13.4.0",

  // Only these email addresses can sign in (all BITS campuses).
  // Keep in sync with isBits() in firestore.rules.
  allowedEmail: /@([a-z0-9-]+\.)?bits-pilani\.ac\.in$/i,

  // Defaults; admins can change these from the admin console (Settings).
  site: {
    whatsapp: "https://chat.whatsapp.com/CgdFfY7ZBwIA0yCYVJ6MDE",
    joinForm: "https://forms.gle/7MAqWXS734hUsFnt9",
    vistadexUrl: "",
    vistadexBlurb: "VistaDex helps founders validate an idea in a structured way and see where it's strong and where it's risky, before committing months to building it.",
    announcement: "",
    contactEmail: "",
  },
};
