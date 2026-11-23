// Security-rules tests. Run with:  npm run test:rules
// (starts the Firestore emulator, runs these tests, stops it)
import { test, before, after, beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where, addDoc } from "firebase/firestore";

let env;
const BITS = (uid, email) => env.authenticatedContext(uid, { email, email_verified: true });
const now = () => new Date().toISOString();
const profile = (email, extra = {}) => ({ name: "Test User", email, role: "builder", createdAt: now(), ...extra });
const venture = (uid, extra = {}) => ({ founderUid: uid, founderName: "F", name: "Voltway", stage: 2, pitch: "p", needs: ["Finance"], domains: ["ClimateTech"], status: "live", ...extra });

before(async () => {
  env = await initializeTestEnvironment({ projectId: "demo-fbc", firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 } });
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.firestore();
    await setDoc(doc(d, "admins/admin@pilani.bits-pilani.ac.in"), { email: "admin@pilani.bits-pilani.ac.in" });
    await setDoc(doc(d, "ventures/founder"), venture("founder"));
    await setDoc(doc(d, "ventures/hiddenf"), venture("hiddenf", { status: "hidden" }));
    await setDoc(doc(d, "events/e1"), { title: "Pitch Night", published: true, date: "2026-12-04" });
    await setDoc(doc(d, "events/draft"), { title: "Draft", published: false });
    await setDoc(doc(d, "posts/p1"), { title: "Live", published: true });
    await setDoc(doc(d, "posts/p2"), { title: "Draft", published: false });
    await setDoc(doc(d, "applications/founder_builder"), { ventureId: "founder", founderUid: "founder", applicantUid: "builder", applicantEmail: "builder@pilani.bits-pilani.ac.in", status: "new", message: "hi" });
  });
});

/* ---------- sign-in restrictions ---------- */
test("non-BITS Google accounts can't create a profile", async () => {
  const gmail = env.authenticatedContext("g", { email: "someone@gmail.com", email_verified: true }).firestore();
  await assertFails(setDoc(doc(gmail, "users/g"), profile("someone@gmail.com")));
});
test("unverified BITS emails are rejected", async () => {
  const u = env.authenticatedContext("u", { email: "u@pilani.bits-pilani.ac.in", email_verified: false }).firestore();
  await assertFails(setDoc(doc(u, "users/u"), profile("u@pilani.bits-pilani.ac.in")));
});
test("BITS users from any campus can create their own profile", async () => {
  await assertSucceeds(setDoc(doc(BITS("b", "b@goa.bits-pilani.ac.in").firestore(), "users/b"), profile("b@goa.bits-pilani.ac.in")));
  await assertSucceeds(setDoc(doc(BITS("c", "f2024@pilani.bits-pilani.ac.in").firestore(), "users/c"), profile("f2024@pilani.bits-pilani.ac.in")));
});
test("you can't write someone else's profile or spoof your email", async () => {
  const me = BITS("me", "me@pilani.bits-pilani.ac.in").firestore();
  await assertFails(setDoc(doc(me, "users/other"), profile("me@pilani.bits-pilani.ac.in")));
  await assertFails(setDoc(doc(me, "users/me"), profile("boss@pilani.bits-pilani.ac.in")));
  await assertFails(setDoc(doc(me, "users/me"), profile("me@pilani.bits-pilani.ac.in", { admin: true })));
});
test("profiles are visible to signed-in members only", async () => {
  await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), "users/x"), profile("x@pilani.bits-pilani.ac.in")));
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), "users/x")));
  await assertSucceeds(getDoc(doc(BITS("y", "y@pilani.bits-pilani.ac.in").firestore(), "users/x")));
});

/* ---------- ventures ---------- */
test("anyone can read live ventures, not hidden ones", async () => {
  const anon = env.unauthenticatedContext().firestore();
  await assertSucceeds(getDocs(query(collection(anon, "ventures"), where("status", "==", "live"))));
  await assertFails(getDoc(doc(anon, "ventures/hiddenf")));
});
test("a founder can create only their own venture", async () => {
  const f = BITS("f2", "f2@pilani.bits-pilani.ac.in").firestore();
  await assertSucceeds(setDoc(doc(f, "ventures/f2"), venture("f2")));
  await assertFails(setDoc(doc(f, "ventures/someoneelse"), venture("someoneelse")));
});
test("a founder can't un-hide a venture an admin hid", async () => {
  const f = BITS("hiddenf", "h@pilani.bits-pilani.ac.in").firestore();
  await assertFails(updateDoc(doc(f, "ventures/hiddenf"), { status: "live" }));
  await assertSucceeds(updateDoc(doc(f, "ventures/hiddenf"), { pitch: "new pitch" }));
});
test("admins can hide any venture; others can't", async () => {
  await assertSucceeds(updateDoc(doc(BITS("a", "admin@pilani.bits-pilani.ac.in").firestore(), "ventures/founder"), { status: "hidden" }));
  await assertFails(updateDoc(doc(BITS("z", "z@pilani.bits-pilani.ac.in").firestore(), "ventures/founder"), { status: "hidden" }));
});

/* ---------- applications ---------- */
const app = (uid, email, extra = {}) => ({ ventureId: "founder", founderUid: "founder", applicantUid: uid, applicantEmail: email, status: "new", message: "I'd love to help", ...extra });
test("a builder can apply once to a live venture", async () => {
  const b = BITS("b2", "b2@pilani.bits-pilani.ac.in").firestore();
  await assertSucceeds(setDoc(doc(b, "applications/founder_b2"), app("b2", "b2@pilani.bits-pilani.ac.in")));
});
test("applications must be honest: own id, own email, status new, live venture", async () => {
  const b = BITS("b3", "b3@pilani.bits-pilani.ac.in").firestore();
  await assertFails(setDoc(doc(b, "applications/founder_someone"), app("b3", "b3@pilani.bits-pilani.ac.in")));
  await assertFails(setDoc(doc(b, "applications/founder_b3"), app("b3", "fake@pilani.bits-pilani.ac.in")));
  await assertFails(setDoc(doc(b, "applications/founder_b3"), app("b3", "b3@pilani.bits-pilani.ac.in", { status: "accepted" })));
  await assertFails(setDoc(doc(b, "applications/hiddenf_b3"), app("b3", "b3@pilani.bits-pilani.ac.in", { ventureId: "hiddenf", founderUid: "hiddenf" })));
});
test("founders can't apply to their own venture", async () => {
  const f = BITS("founder", "f@pilani.bits-pilani.ac.in").firestore();
  await assertFails(setDoc(doc(f, "applications/founder_founder"), app("founder", "f@pilani.bits-pilani.ac.in")));
});
test("only the founder can change an application's status, and only the status", async () => {
  const f = BITS("founder", "f@pilani.bits-pilani.ac.in").firestore();
  const b = BITS("builder", "builder@pilani.bits-pilani.ac.in").firestore();
  await assertSucceeds(updateDoc(doc(f, "applications/founder_builder"), { status: "accepted", updatedAt: now() }));
  await assertFails(updateDoc(doc(f, "applications/founder_builder"), { message: "edited" }));
  await assertFails(updateDoc(doc(b, "applications/founder_builder"), { status: "accepted" }));
});
test("applications are private to the applicant, the founder and admins", async () => {
  await assertSucceeds(getDoc(doc(BITS("builder", "builder@pilani.bits-pilani.ac.in").firestore(), "applications/founder_builder")));
  await assertSucceeds(getDoc(doc(BITS("founder", "f@pilani.bits-pilani.ac.in").firestore(), "applications/founder_builder")));
  await assertSucceeds(getDoc(doc(BITS("a", "admin@pilani.bits-pilani.ac.in").firestore(), "applications/founder_builder")));
  await assertFails(getDoc(doc(BITS("nosy", "nosy@pilani.bits-pilani.ac.in").firestore(), "applications/founder_builder")));
  const b = BITS("builder", "builder@pilani.bits-pilani.ac.in").firestore();
  await assertSucceeds(getDocs(query(collection(b, "applications"), where("applicantUid", "==", "builder"))));
});

/* ---------- events, content, inbox, admin ---------- */
test("published events are public, drafts are not; only admins edit", async () => {
  const anon = env.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(anon, "events/e1")));
  await assertFails(getDoc(doc(anon, "events/draft")));
  await assertFails(setDoc(doc(BITS("m", "m@pilani.bits-pilani.ac.in").firestore(), "events/new"), { title: "x", published: true }));
  await assertSucceeds(setDoc(doc(BITS("a", "admin@pilani.bits-pilani.ac.in").firestore(), "events/new"), { title: "x", published: true }));
});
test("members can RSVP for themselves only", async () => {
  const m = BITS("m", "m@pilani.bits-pilani.ac.in").firestore();
  await assertSucceeds(setDoc(doc(m, "events/e1/rsvps/m"), { uid: "m", name: "M", email: "m@pilani.bits-pilani.ac.in" }));
  await assertSucceeds(setDoc(doc(m, "users/m/rsvps/e1"), { eventId: "e1" }));
  await assertFails(setDoc(doc(m, "events/e1/rsvps/other"), { uid: "other" }));
  await assertFails(setDoc(doc(m, "events/draft/rsvps/m"), { uid: "m" }));
  await assertFails(getDocs(collection(m, "events/e1/rsvps")));
  await assertSucceeds(getDocs(collection(BITS("a", "admin@pilani.bits-pilani.ac.in").firestore(), "events/e1/rsvps")));
});
test("draft posts are hidden from the public", async () => {
  const anon = env.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(anon, "posts/p1")));
  await assertFails(getDoc(doc(anon, "posts/p2")));
});
test("anyone can send a message; only admins can read the inbox", async () => {
  const anon = env.unauthenticatedContext().firestore();
  await assertSucceeds(addDoc(collection(anon, "messages"), { type: "contact", name: "A", email: "a@b.com", body: "Hello", extra: "", createdAt: now() }));
  await assertFails(addDoc(collection(anon, "messages"), { type: "contact", email: "a@b.com", body: "x".repeat(5000), createdAt: now() }));
  await assertFails(addDoc(collection(anon, "messages"), { type: "contact", email: "a@b.com", isAdmin: true }));
  await assertFails(getDocs(collection(anon, "messages")));
  await assertFails(getDocs(collection(BITS("m", "m@pilani.bits-pilani.ac.in").firestore(), "messages")));
  await assertSucceeds(getDocs(collection(BITS("a", "admin@pilani.bits-pilani.ac.in").firestore(), "messages")));
});
test("only admins can add admins or change site settings", async () => {
  const m = BITS("m", "m@pilani.bits-pilani.ac.in").firestore();
  await assertFails(setDoc(doc(m, "admins/m@pilani.bits-pilani.ac.in"), { email: "m@pilani.bits-pilani.ac.in" }));
  await assertFails(setDoc(doc(m, "settings/site"), { announcement: "hacked" }));
  await assertSucceeds(getDoc(doc(m, "admins/m@pilani.bits-pilani.ac.in")));        // can check own admin status
  await assertFails(getDoc(doc(m, "admins/admin@pilani.bits-pilani.ac.in")));        // but not others'
  const a = BITS("a", "admin@pilani.bits-pilani.ac.in").firestore();
  await assertSucceeds(setDoc(doc(a, "admins/m@pilani.bits-pilani.ac.in"), { email: "m@pilani.bits-pilani.ac.in" }));
  await assertSucceeds(setDoc(doc(a, "settings/site"), { announcement: "Pitch Night on Friday" }));
  await assertSucceeds(getDoc(doc(env.unauthenticatedContext().firestore(), "settings/site")));
});
test("idea checks are private", async () => {
  const m = BITS("m", "m@pilani.bits-pilani.ac.in").firestore();
  const ref = await addDoc(collection(m, "ideaChecks"), { uid: "m", idea: "x", answers: {} });
  await assertSucceeds(getDoc(ref));
  await assertFails(getDoc(doc(BITS("n", "n@pilani.bits-pilani.ac.in").firestore(), "ideaChecks", ref.id)));
  await assertFails(addDoc(collection(m, "ideaChecks"), { uid: "n", idea: "x" }));
});
