# Going live: Firebase setup (about 20 minutes, free)

The site runs in **demo mode** until `js/config.js` has a Firebase config. In demo mode everything works, but data is saved only in each visitor's browser. These steps switch it to **live mode**: real Google sign-in (BITS accounts only), one shared database, and the admin console.

Everything here fits in Firebase's free **Spark** plan. No card needed.

## 1. Create the Firebase project
1. Go to [console.firebase.google.com](https://console.firebase.google.com), sign in with the account that should own FBC's data (ideally a shared FBC Google account, not a personal one), and click **Create a project**. Name it e.g. `fbc-bits`. Google Analytics: optional.
2. In the project, click the **Web** icon (`</>`) to add a web app. Name it `FBC website`. Skip Firebase Hosting for now.
3. Copy the `firebaseConfig` object it shows into `js/config.js`, replacing `firebase: null`:
   ```js
   firebase: {
     apiKey: "…",
     authDomain: "fbc-bits.firebaseapp.com",
     projectId: "fbc-bits",
     storageBucket: "fbc-bits.firebasestorage.app",
     messagingSenderId: "…",
     appId: "…",
   },
   ```
   This config is safe to commit. It only identifies the project; the security rules protect the data.

## 2. Turn on Google sign-in
1. **Build → Authentication → Get started → Sign-in method → Google → Enable.** Set the support email and save.
2. **Authentication → Settings → Authorized domains → Add domain:** `magnumsolis.github.io` (and your custom domain later, if any). `localhost` is already there.

The site only lets BITS addresses in (`*.bits-pilani.ac.in`: Pilani, Goa, Hyderabad, Dubai). That's checked in the browser **and** enforced on the server by `firestore.rules`.

## 3. Create the database
1. **Build → Firestore Database → Create database.**
2. Location: **asia-south1 (Mumbai)** or **asia-south2 (Delhi)**. This can't be changed later.
3. Start in **production mode**.

## 4. Publish the security rules
Either way works:
- **Console:** open Firestore → **Rules**, replace everything with the contents of `firestore.rules`, click **Publish**.
- **Command line:** `npm install`, `npx firebase login`, `npx firebase use --add` (pick the project), then `npm run deploy:rules`.

Re-publish whenever `firestore.rules` changes.

## 5. Make yourself the first admin
Firestore → **Start collection** → collection ID `admins` → document ID = **your BITS email in lower case** (e.g. `f20240386@pilani.bits-pilani.ac.in`) → add a field `email` (string) with the same address → Save.

After that, add other admins from the site: **Admin → Admins**.

## 6. Ship it
Commit and push `js/config.js`. GitHub Pages redeploys in about a minute. Then:
1. Open the site, **Join FBC**, and sign in with Google using the BITS email you made admin.
2. Go to **Admin → Settings**:
   - Click **Load sample content** if you want the sample events, posts and resources to start from (edit or delete them afterwards).
   - Paste the **VistaDex link** and description.
   - Set the WhatsApp and join-form links, and an announcement if you like.

That's it. The site is live.

---

## Admin console (`#admin`)
| Section | What you can do |
| --- | --- |
| Overview | Member count, new this week, ventures, applications, unhandled messages |
| Ventures | View, hide/unhide (founders can't un-hide), delete |
| Applications | See every application and its status; export CSV |
| Members | Search and filter by role, view profiles, make someone admin; export CSV |
| Events | Create, edit, publish/unpublish, delete; see attendees and export them |
| Opportunities, Journal, Resources | Create, edit, publish, delete. Journal posts are written in simple Markdown |
| Inbox | Contact form, newsletter sign-ups, opportunity interest and submissions; mark done; export CSV |
| Admins | Add or remove admins |
| Settings | Announcement bar, WhatsApp and join-form links, contact email, VistaDex link and copy |

Raw data is always visible and editable in the Firebase console too (Firestore → Data).

## What's stored where
| Collection | Contents | Who can read | Who can write |
| --- | --- | --- | --- |
| `users/{uid}` | Profile: name, role, year, bio, skills, domains, venture fields | Signed-in BITS members | Only that member |
| `users/{uid}/rsvps` | That member's RSVPs | Member, admins | Member |
| `ventures/{uid}` | One listing per founder | Public if live; founder; admins | Founder (can't un-hide); admins |
| `applications/{venture_uid}` | Builder → venture applications | Applicant, founder, admins | Applicant creates; founder sets status |
| `events`, `events/{id}/rsvps` | Events; attendees | Public if published; attendees: admins | Admins; members RSVP themselves |
| `opportunities`, `posts`, `resources` | Site content | Public if live/published | Admins |
| `messages` | Contact form, newsletter, opportunity interest/submissions | Admins | Anyone (size-limited) |
| `ideaChecks` | Saved idea-check results | That member | That member |
| `settings/site` | Links, announcement, VistaDex | Public | Admins |
| `admins/{email}` | Admin list | Admins (and you, for your own entry) | Admins |

## Free limits and when to upgrade
Spark (free) covers a club comfortably: per day 50,000 document reads and 20,000 writes, 1 GiB stored, and no cap on Google sign-ins (unless you opt into the Identity Platform upgrade, which caps free use at 3,000 daily active users). A typical visit reads 10–40 documents, so that's roughly 1,500–5,000 visits a day. When you approach the limit (Firebase console → Usage), switch to **Blaze** (pay as you go). The same free amounts still apply, you pay only above them, and you should set a **budget alert** (e.g. ₹500/month) in Google Cloud Billing. Blaze also unlocks:
- **Cloud Functions:** emails ("someone applied to your venture", event reminders), applicant counters, scheduled jobs.
- **Cloud Storage:** profile photos, logos and file uploads (Storage now needs Blaze even for small usage).
- **App Check:** blocks bots from spamming the contact form.

## Local development
```bash
npm install              # once: Firebase CLI + test tools
npm run serve            # site at http://localhost:8000 (demo mode)
npm run test:rules       # 20 security-rules tests against the Firestore emulator
npm run emulators        # local Auth + Firestore; with a config set, open http://localhost:8000/?emulator=1
```
Java 11+ is needed for the emulators.
