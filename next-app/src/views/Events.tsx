"use client";
import { db } from "@/lib/db";
import { past, upcoming } from "@/lib/format";
import { useApp } from "@/components/providers";
import { Cta, EventRow, useData } from "@/components/blocks";
import { Empty, PageHead } from "@/components/ui";

export default function Events() {
  const { user } = useApp();
  const [events] = useData(() => db.list("events"));
  const [rsvps, reload] = useData(async () => (user ? db.myRsvps(user.uid) : []), [user?.uid]);
  const up = upcoming(events || []), old = past(events || []);
  return (
    <>
      <PageHead label="Events" title="Show up. Meet people. Pitch." lead="Pitch nights, workshops, founder firesides and community meets. Announcements also go out on the WhatsApp community." />
      <section className="container section-sm">
        <span className="label">Upcoming</span>
        <div className="list boxed mt-2">{up.map((e) => <EventRow key={e.id} e={e} rsvps={rsvps} onChanged={reload} />)}
          {events && !up.length && <Empty>New events are announced soon.</Empty>}</div>
        <span className="label" style={{ display: "block", marginTop: "4rem" }}>Past</span>
        <div className="list boxed mt-2">{old.map((e) => <EventRow key={e.id} e={e} />)}</div>
      </section>
      <Cta />
    </>
  );
}
