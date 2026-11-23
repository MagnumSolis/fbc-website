/* ==========================================================
   Admin console (#admin). Only for emails listed in admins/{email}.
   Manage ventures, members, applications, events, opportunities,
   journal posts, resources, messages, admins and site settings.
   Raw data is also always available in the Firebase console.
   ========================================================== */
import { db } from "./db.js";
import * as C from "./content.js";
import { S, $, $$, esc, fmtDate, toast, openModal, closeModal, downloadCSV, slug, byDateDesc } from "./ui.js";
import { render, applySettings, statusLabel } from "./app.js";

const yes = (v) => (v ? "Yes" : "No");
const SCHEMAS = {
  events: {
    title: "Events", singular: "event", sort: byDateDesc("date"),
    fields: [["title", "Title", "text", { required: true }], ["date", "Date", "date", { required: true }], ["time", "Time", "text", { placeholder: "7:00 PM" }], ["venue", "Venue", "text"], ["type", "Type", "select", { options: C.EVENT_TYPES }], ["desc", "Description", "textarea"], ["published", "Published (visible on the site)", "checkbox", { default: true }]],
    cols: [["title", "Title"], ["date", "Date", (v) => fmtDate(v)], ["type", "Type"], ["venue", "Venue"], ["published", "Live", yes]],
  },
  opportunities: {
    title: "Opportunities", singular: "opportunity", sort: (a, b) => String(a.deadline).localeCompare(String(b.deadline)),
    fields: [["title", "Role", "text", { required: true }], ["org", "Organisation", "text", { required: true }], ["type", "Type", "select", { options: C.OPP_TYPES }], ["mode", "Mode", "text", { placeholder: "Remote / On campus / Hybrid" }], ["duration", "Duration", "text"], ["stipend", "Stipend", "text"], ["tags", "Tags (comma-separated)", "tags"], ["deadline", "Deadline", "date"], ["url", "Application link (optional)", "text", { placeholder: "https://…" }], ["status", "Status", "select", { options: ["live", "hidden"], default: "live" }]],
    cols: [["title", "Role"], ["org", "Organisation"], ["type", "Type"], ["deadline", "Deadline", (v) => fmtDate(v)], ["status", "Status", (v) => `<span class="status ${esc(v)}">${esc(v)}</span>`]],
  },
  posts: {
    title: "Journal", singular: "post", sort: byDateDesc("date"),
    fields: [["title", "Title", "text", { required: true }], ["cat", "Category", "select", { options: C.POST_CATS }], ["author", "Author", "text"], ["date", "Date", "date"], ["read", "Read time", "text", { placeholder: "5 min" }], ["excerpt", "Summary (shown on cards)", "textarea"], ["body", "Article (Markdown: ## heading, > quote, - list, **bold**, [link](https://…))", "markdown"], ["featured", "Featured on the journal page", "checkbox"], ["published", "Published", "checkbox", { default: false }]],
    cols: [["title", "Title"], ["cat", "Category"], ["date", "Date", (v) => fmtDate(v)], ["published", "Live", yes], ["featured", "Featured", yes]],
  },
  resources: {
    title: "Resources", singular: "resource", sort: (a, b) => C.SHELVES.indexOf(a.shelf) - C.SHELVES.indexOf(b.shelf) || (a.order || 0) - (b.order || 0),
    fields: [["title", "Title", "text", { required: true }], ["shelf", "Shelf", "select", { options: C.SHELVES }], ["desc", "Description", "textarea"], ["url", "Link (leave empty for “Coming soon”)", "text"], ["order", "Order on shelf", "number", { default: 1 }], ["featured", "Featured", "checkbox"]],
    cols: [["title", "Title"], ["shelf", "Shelf"], ["url", "Link", (v) => (v ? "Yes" : "Coming soon")], ["order", "Order"]],
  },
};
const TABS = [["overview", "Overview"], ["ventures", "Ventures"], ["applications", "Applications"], ["members", "Members"], ["events", "Events"], ["opportunities", "Opportunities"], ["posts", "Journal"], ["resources", "Resources"], ["messages", "Inbox"], ["admins", "Admins"], ["settings", "Settings"]];
const A = (S.cache.adm ||= {});
const load = async (c, force) => (A[c] && !force ? A[c] : (A[c] = await db.adminList(c)));
const fresh = () => { for (const k of Object.keys(A)) delete A[k]; };

/* ---------- view ---------- */
export async function adminView() {
  if (!S.user) { setTimeout(() => (location.hash = "#login"), 0); return ""; }
  if (!S.admin) return `
    <section class="section first"><div class="narrow"><span class="label">Admin console</span><h2 class="mt-2">You don't have admin access.</h2>
      <p class="mt-3">You're signed in as <b style="color:var(--text)">${esc(S.user.email)}</b>. Ask an existing FBC admin to add this address in Admin → Admins.</p>
      <p class="mt-2 small">Setting up the very first admin? In the Firebase console, open Firestore, create a collection called <code>admins</code>, and add a document whose ID is your email address in lower case. See SETUP.md.</p>
      <a href="#dashboard" class="btn mt-4">Back to dashboard</a></div></section>`;
  const tab = S.adminTab;
  fresh(); // always show current data
  let body = "";
  try { body = await tabs[tab](); }
  catch (e) { console.error(e); body = `<div class="empty">Couldn't load this section. ${e.code === "permission-denied" ? "Your account doesn't have permission." : "Check your connection."}</div>`; }
  return `
  <div class="container shell fade">
    <aside class="side" aria-label="Admin sections">
      ${TABS.map(([k, l]) => `<button data-act="adm-tab" data-tab="${k}" class="${tab === k ? "on" : ""}">${l}</button>`).join("")}
      <hr/><a href="#dashboard">My dashboard</a><button data-act="adm-refresh">Refresh data</button>
    </aside>
    <div>
      <div class="spread dash-hero"><div><span class="label">Admin console · ${db.mode === "demo" ? "Demo data" : "Live data"}</span><h2 class="mt-1">${TABS.find((t) => t[0] === tab)[1]}</h2></div>
        ${SCHEMAS[tab] ? `<button class="btn btn-primary" data-act="adm-new" data-col="${tab}">New ${SCHEMAS[tab].singular}</button>` : ""}</div>
      ${body}
    </div>
  </div>`;
}

const table = (head, rows, empty = "Nothing here yet.") => rows.length
  ? `<div class="table-wrap"><table class="table"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`
  : `<div class="empty">${empty}</div>`;

const tabs = {
  async overview() {
    const [users, ventures, apps, msgs, events] = await Promise.all(["users", "ventures", "applications", "messages", "events"].map((c) => load(c)));
    const week = new Date(Date.now() - 7 * 864e5).toISOString();
    const recent = users.filter((u) => String(u.createdAt) > week).length;
    const roles = ["founder", "builder", "explorer"].map((r) => `${users.filter((u) => u.role === r).length} ${r}s`).join(" · ");
    const unread = msgs.filter((m) => !m.handled).length;
    return `
      <div class="stats">
        <div class="stat"><span class="label">Members</span><b>${users.length}</b><p class="xs mt-1">${recent} joined this week</p></div>
        <div class="stat"><span class="label">Ventures</span><b>${ventures.length}</b><p class="xs mt-1">${ventures.filter((v) => v.status === "live").length} live</p></div>
        <div class="stat"><span class="label">Applications</span><b>${apps.length}</b><p class="xs mt-1">${apps.filter((a) => a.status === "accepted").length} accepted</p></div>
        <div class="stat"><span class="label">Inbox</span><b>${unread}</b><p class="xs mt-1">unhandled messages</p></div>
      </div>
      <p class="small mt-2">${roles}. ${events.filter((e) => e.published).length} published events.</p>
      <div class="grid g2 mt-4" style="gap:3rem;align-items:start">
        <div><span class="label">Newest members</span>${table(["Name", "Role", "Joined"], users.sort(byDateDesc("createdAt")).slice(0, 8).map((u) => `<tr><td>${esc(u.name)}</td><td>${esc(u.role || "")}</td><td>${fmtDate(u.createdAt)}</td></tr>`))}</div>
        <div><span class="label">Latest messages</span>${table(["Type", "From", "Date"], msgs.sort(byDateDesc("createdAt")).slice(0, 8).map((m) => `<tr><td>${esc(m.type)}</td><td>${esc(m.name || m.email)}</td><td>${fmtDate(m.createdAt)}</td></tr>`), "No messages yet.")}</div>
      </div>
      <p class="hint mt-4">${db.mode === "demo" ? "Demo mode: this data lives in your browser only." : "Raw data is also in the Firebase console → Firestore."}</p>`;
  },
  async ventures() {
    const rows = (await load("ventures")).sort(byDateDesc("updatedAt"));
    return `<p class="small">Founders create and edit their own listings. Hide anything that breaks community guidelines; the founder sees it as hidden.</p>
      <div class="mt-3">${table(["Venture", "Founder", "Stage", "Status", "Updated", ""], rows.map((v) => `
      <tr><td>${esc(v.name)}<div class="xs faint">${esc((v.domains || []).join(", "))}</div></td><td>${esc(v.founderName || "")}</td><td>${esc(C.STAGES[v.stage] || "")}</td>
        <td><span class="status ${esc(v.status)}">${statusLabel(v.status)}</span></td><td>${fmtDate(v.updatedAt)}</td>
        <td class="actions"><button class="icon-btn" data-act="venture" data-id="${esc(v.id)}">View</button>
          ${v.status === "hidden" ? `<button class="icon-btn" data-act="adm-venture-status" data-id="${esc(v.id)}" data-status="live">Unhide</button>` : `<button class="icon-btn" data-act="adm-venture-status" data-id="${esc(v.id)}" data-status="hidden">Hide</button>`}
          <button class="icon-btn danger" data-act="adm-del" data-col="ventures" data-id="${esc(v.id)}">Delete</button></td></tr>`))}</div>`;
  },
  async applications() {
    const rows = (await load("applications")).sort(byDateDesc("createdAt"));
    return `<div class="spread"><p class="small">${rows.length} applications. Founders manage statuses themselves.</p><button class="btn btn-sm" data-act="adm-export" data-what="applications">Export CSV</button></div>
      <div class="mt-3">${table(["Venture", "Applicant", "Email", "Status", "Date"], rows.map((a) => `
      <tr><td>${esc(a.ventureName)}</td><td>${esc(a.applicantName)}</td><td>${esc(a.applicantEmail)}</td><td><span class="status ${esc(a.status)}">${statusLabel(a.status)}</span></td><td>${fmtDate(a.createdAt)}</td></tr>`))}</div>`;
  },
  async members() {
    const all = (await load("users")).sort(byDateDesc("createdAt"));
    const f = S.admMemberRole || "";
    const q = (S.admMemberQ || "").toLowerCase();
    const rows = all.filter((u) => (!f || u.role === f) && (!q || `${u.name} ${u.email}`.toLowerCase().includes(q)));
    return `<div class="toolbar" style="margin-top:0"><div class="seg">${[["", "All"], ["founder", "Founders"], ["builder", "Builders"], ["explorer", "Explorers"]].map(([k, l]) => `<button data-act="adm-member-role" data-role="${k}" class="${f === k ? "on" : ""}">${l}</button>`).join("")}</div>
      <input class="input grow" id="admMemberQ" placeholder="Search name or email" value="${esc(S.admMemberQ || "")}"/><button class="btn btn-sm" data-act="adm-export" data-what="users">Export CSV</button></div>
      ${table(["Name", "Email", "Role", "Year", "Joined", ""], rows.map((u) => `
      <tr><td>${esc(u.name)}</td><td>${esc(u.email || "")}</td><td>${esc(u.role || "")}</td><td>${esc(u.year || "")}</td><td>${fmtDate(u.createdAt)}</td>
        <td class="actions"><button class="icon-btn" data-act="adm-member" data-id="${esc(u.id)}">View</button></td></tr>`), "No members match.")}`;
  },
  async messages() {
    const all = (await load("messages")).sort(byDateDesc("createdAt"));
    const f = S.admMsgType || "";
    const rows = all.filter((m) => !f || m.type === f);
    const types = [...new Set(all.map((m) => m.type))];
    return `<div class="toolbar" style="margin-top:0"><div class="seg">${["", ...types].map((t) => `<button data-act="adm-msg-type" data-type="${esc(t)}" class="${f === t ? "on" : ""}">${t ? esc(t) : "All"} <span class="faint">${t ? all.filter((m) => m.type === t).length : all.length}</span></button>`).join("")}</div>
      <button class="btn btn-sm" data-act="adm-export" data-what="messages" style="margin-left:auto">Export CSV</button></div>
      <p class="hint">Types: contact form, newsletter sign-ups, interest in opportunities, and startups submitting opportunities.</p>
      <div class="mt-2">${table(["Type", "From", "Message", "Date", ""], rows.map((m) => `
      <tr style="${m.handled ? "opacity:.55" : ""}"><td>${esc(m.type)}</td><td>${esc(m.name || "")}<div class="xs faint">${esc(m.email || "")}</div></td><td>${m.extra ? `<b>${esc(m.extra)}</b><br/>` : ""}${esc(m.body || "")}</td><td>${fmtDate(m.createdAt)}</td>
        <td class="actions"><button class="icon-btn" data-act="adm-handled" data-id="${esc(m.id)}" data-v="${m.handled ? "" : "1"}">${m.handled ? "Reopen" : "Done"}</button><button class="icon-btn danger" data-act="adm-del" data-col="messages" data-id="${esc(m.id)}">Delete</button></td></tr>`), "Inbox is empty.")}</div>`;
  },
  async admins() {
    const rows = await db.listAdmins();
    return `<p class="small">Admins can use this console: edit content, hide ventures and read messages. Add people by their BITS email address.</p>
      <form data-form="adm-admin-add" class="row mt-3"><input class="input" type="email" name="email" placeholder="name@pilani.bits-pilani.ac.in" required style="max-width:360px"/><button class="btn btn-primary">Add admin</button></form>
      <div class="mt-3">${table(["Email", "Added", ""], rows.map((a) => `<tr><td>${esc(a.email || a.id)}</td><td>${fmtDate(a.addedAt)}</td><td class="actions">${(a.email || a.id) === S.user.email.toLowerCase() ? `<span class="xs faint">You</span>` : `<button class="icon-btn danger" data-act="adm-remove-admin" data-email="${esc(a.email || a.id)}">Remove</button>`}</td></tr>`))}</div>`;
  },
  async settings() {
    const s = await db.getSettings();
    return `<form data-form="adm-settings" class="grid" style="gap:1.25rem;max-width:640px">
      <div class="field"><label>Announcement bar</label><input class="input" name="announcement" value="${esc(s.announcement || "")}" placeholder="Pitch Night is on 4 Dec. [RSVP](#events)"/><span class="hint">Shown at the top of every page. Leave empty to hide. Supports [links](#events).</span></div>
      <div class="field"><label>WhatsApp community link</label><input class="input" name="whatsapp" value="${esc(s.whatsapp || "")}"/></div>
      <div class="field"><label>Join form link</label><input class="input" name="joinForm" value="${esc(s.joinForm || "")}"/></div>
      <div class="field"><label>Contact email (optional)</label><input class="input" type="email" name="contactEmail" value="${esc(s.contactEmail || "")}"/></div>
      <div class="field"><label>VistaDex link</label><input class="input" name="vistadexUrl" value="${esc(s.vistadexUrl || "")}" placeholder="https://…"/></div>
      <div class="field"><label>VistaDex description</label><textarea class="input" name="vistadexBlurb">${esc(s.vistadexBlurb || "")}</textarea></div>
      <div><button class="btn btn-primary">Save settings</button></div></form>
      <div class="notice mt-5"><div><h3>Sample content</h3><p class="small">Loads the sample events, opportunities, journal posts and resources. Skips anything that already exists. Edit or delete them afterwards.</p></div><button class="btn" data-act="adm-seed">Load sample content</button></div>
      ${db.mode === "demo" ? `<div class="notice mt-3"><div><h3>Reset demo data</h3><p class="small">Clears everything this browser has saved and starts fresh.</p></div><button class="btn" data-act="adm-reset">Reset</button></div>` : ""}`;
  },
};
for (const col of Object.keys(SCHEMAS)) {
  tabs[col] = async () => {
    const sc = SCHEMAS[col];
    const rows = (await load(col)).sort(sc.sort);
    return table([...sc.cols.map((c) => c[1]), ""], rows.map((r) => `
      <tr>${sc.cols.map(([k, , f]) => `<td>${f ? f(r[k], r) : esc(r[k] ?? "")}</td>`).join("")}
        <td class="actions">${col === "events" ? `<button class="icon-btn" data-act="adm-attendees" data-id="${esc(r.id)}">Attendees</button>` : ""}${col === "posts" ? `<a class="icon-btn" href="#journal-${esc(r.id)}" style="display:inline-flex;align-items:center">Open</a>` : ""}
          <button class="icon-btn" data-act="adm-edit" data-col="${col}" data-id="${esc(r.id)}">Edit</button>
          <button class="icon-btn danger" data-act="adm-del" data-col="${col}" data-id="${esc(r.id)}">Delete</button></td></tr>`), `No ${sc.title.toLowerCase()} yet. Create one, or load sample content from Settings.`);
  };
}

/* ---------- editor ---------- */
function editor(col, doc) {
  const sc = SCHEMAS[col];
  const val = (k, o) => (doc ? doc[k] : o?.default);
  const field = ([k, label, type, o = {}]) => {
    const v = val(k, o);
    const req = o.required ? "required" : "";
    if (type === "textarea") return `<div class="field full"><label>${label}</label><textarea class="input" name="${k}" ${req}>${esc(v || "")}</textarea></div>`;
    if (type === "markdown") return `<div class="field full"><label>${label}</label><textarea class="input" name="${k}" style="min-height:260px;font-family:var(--mono);font-size:.82rem">${esc(v || "")}</textarea></div>`;
    if (type === "select") return `<div class="field"><label>${label}</label><select class="input" name="${k}">${o.options.map((x) => `<option ${v === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></div>`;
    if (type === "checkbox") return `<label class="check full"><input type="checkbox" name="${k}" ${v ? "checked" : ""}/> ${label}</label>`;
    if (type === "tags") return `<div class="field"><label>${label}</label><input class="input" name="${k}" value="${esc((v || []).join(", "))}"/></div>`;
    return `<div class="field ${type === "text" && /title|desc|url/.test(k) ? "full" : ""}"><label>${label}</label><input class="input" type="${type === "number" ? "number" : type === "date" ? "date" : "text"}" name="${k}" value="${esc(v ?? "")}" ${req} placeholder="${esc(o.placeholder || "")}"/></div>`;
  };
  openModal(`<span class="label">${doc ? "Edit" : "New"} ${sc.singular}</span><h2 id="modalTitle" class="mt-1">${doc ? esc(doc.title) : "Untitled"}</h2>
    <form data-form="adm-save" data-col="${col}" data-id="${esc(doc?.id || "")}" class="mt-3"><div class="form-grid">${sc.fields.map(field).join("")}</div>
      <div class="spread mt-4"><button type="button" class="btn" data-close>Cancel</button><button class="btn btn-primary">Save</button></div></form>`, { wide: true });
}

/* ---------- actions ---------- */
const confirmSafe = (msg) => { try { return window.confirm(msg); } catch { return true; } };
export const adminActions = {
  "adm-tab": (el) => { S.adminTab = el.dataset.tab; render(); scrollTo(0, 0); },
  "adm-refresh": () => { fresh(); render(); toast("Data refreshed"); },
  "adm-new": (el) => editor(el.dataset.col, null),
  "adm-edit": async (el) => editor(el.dataset.col, (await load(el.dataset.col)).find((d) => d.id === el.dataset.id)),
  async "adm-del"(el) {
    if (!confirmSafe("Delete this permanently?")) return;
    await db.adminDelete(el.dataset.col, el.dataset.id); delete A[el.dataset.col];
    toast("Deleted"); render();
  },
  async "adm-venture-status"(el) { await db.adminSave("ventures", el.dataset.id, { status: el.dataset.status }); delete A.ventures; toast(el.dataset.status === "hidden" ? "Venture hidden" : "Venture visible again"); render(); },
  async "adm-handled"(el) { await db.adminSave("messages", el.dataset.id, { handled: !!el.dataset.v }); delete A.messages; render(); },
  "adm-member-role": (el) => { S.admMemberRole = el.dataset.role; render(); },
  "adm-msg-type": (el) => { S.admMsgType = el.dataset.type; render(); },
  async "adm-member"(el) {
    const u = (await load("users")).find((x) => x.id === el.dataset.id);
    const isAdm = await db.isAdmin(u.email);
    const rows = [["Email", u.email], ["Role", u.role], ["Year", u.year], ["Bio", u.bio], ["Skills", (u.skills || []).join(", ")], ["Needs", (u.needs || []).join(", ")], ["Domains", (u.domains || []).join(", ")], ["Availability", u.avail], ["LinkedIn", u.linkedin], ["Venture", u.vname], ["Joined", fmtDate(u.createdAt)]].filter(([, v]) => v);
    openModal(`<span class="label">Member</span><h2 id="modalTitle" class="mt-1">${esc(u.name)}</h2>
      <table class="table mt-3"><tbody>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${esc(v)}</td></tr>`).join("")}</tbody></table>
      <div class="row mt-3">${isAdm ? `<span class="tag accent">Admin</span>` : u.email ? `<button class="btn btn-sm" data-act="adm-make-admin" data-email="${esc(u.email)}">Make admin</button>` : ""}
        <button class="btn btn-sm" data-act="copy-text" data-text="${esc(u.email || "")}">Copy email</button></div>`);
  },
  async "adm-make-admin"(el) { if (!confirmSafe(`Give ${el.dataset.email} admin access?`)) return; await db.setAdmin(el.dataset.email, true); closeModal(); toast("Admin added"); },
  async "adm-remove-admin"(el) { if (!confirmSafe(`Remove admin access for ${el.dataset.email}?`)) return; await db.setAdmin(el.dataset.email, false); toast("Admin removed"); render(); },
  async "adm-attendees"(el) {
    const ev = (await load("events")).find((e) => e.id === el.dataset.id);
    const rows = await db.eventRsvps(el.dataset.id);
    S.cache.attendees = { name: slug(ev.title), rows };
    openModal(`<span class="label">Attendees</span><h2 id="modalTitle" class="mt-1">${esc(ev.title)}</h2><p class="small mt-1">${rows.length} RSVPs</p>
      <div class="mt-3">${table(["Name", "Email", "RSVP'd"], rows.map((r) => `<tr><td>${esc(r.name)}</td><td>${esc(r.email)}</td><td>${fmtDate(r.createdAt)}</td></tr>`), "No RSVPs yet.")}</div>
      ${rows.length ? `<button class="btn btn-sm mt-3" data-act="adm-export" data-what="attendees">Export CSV</button>` : ""}`, { wide: true });
  },
  async "adm-export"(el) {
    const w = el.dataset.what;
    if (w === "users") return downloadCSV("fbc-members", await load("users"), ["name", "email", "role", "year", "bio", "skills", "needs", "domains", "avail", "linkedin", "vname", "createdAt"]);
    if (w === "applications") return downloadCSV("fbc-applications", await load("applications"), ["ventureName", "applicantName", "applicantEmail", "applicantYear", "status", "message", "createdAt"]);
    if (w === "messages") return downloadCSV("fbc-messages", await load("messages"), ["type", "name", "email", "extra", "body", "handled", "createdAt"]);
    if (w === "attendees") return downloadCSV(`fbc-attendees-${S.cache.attendees.name}`, S.cache.attendees.rows, ["name", "email", "createdAt"]);
  },
  async "adm-seed"() { const n = await db.seed(); fresh(); toast(n ? `Loaded ${n} sample items` : "Sample content is already loaded"); render(); },
  async "adm-reset"() { if (!confirmSafe("Reset all demo data in this browser?")) return; await db.reset(); fresh(); location.hash = "#home"; location.reload(); },
};
export const adminChange = {};
export const adminForms = {
  async "adm-save"(f) {
    const col = f.dataset.col, sc = SCHEMAS[col];
    const data = {};
    for (const [k, , type] of sc.fields) {
      const el = f.elements[k];
      data[k] = type === "checkbox" ? el.checked : type === "number" ? Number(el.value || 0) : type === "tags" ? el.value.split(",").map((s) => s.trim()).filter(Boolean) : el.value.trim();
    }
    let id = f.dataset.id;
    if (!id) { id = slug(data.title) + (col === "posts" ? "" : "-" + Math.random().toString(36).slice(2, 6)); data.createdAt = new Date().toISOString(); }
    await db.adminSave(col, id, data);
    delete A[col]; closeModal(); toast("Saved"); render();
  },
  async "adm-admin-add"(f) { await db.setAdmin(f.email.value.trim(), true); toast("Admin added"); render(); },
  async "adm-settings"(f) {
    const s = Object.fromEntries(["announcement", "whatsapp", "joinForm", "contactEmail", "vistadexUrl", "vistadexBlurb"].map((k) => [k, f.elements[k].value.trim()]));
    await db.saveSettings(s);
    S.settings = { ...S.settings, ...s }; applySettings(); toast("Settings saved");
  },
};
document.addEventListener("input", (e) => {
  if (e.target.id === "admMemberQ") {
    S.admMemberQ = e.target.value;
    clearTimeout(e.target._t); e.target._t = setTimeout(async () => { await render(); const i = $("#admMemberQ"); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250);
  }
});
void $$;
