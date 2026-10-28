"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FileHeart, NotebookPen, Plus, Signature } from "lucide-react";
import { clinicalPatientsById } from "@/data/clinical";
import { useClinical, type VisitNote } from "@/store/clinical";
import { formatDay, formatTime, timeAgo } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { AllergyBadges, FilterChip, PatientIdentity } from "../shared";
import { NoteEditorDialog } from "../note-editor";

type Filter = "draft" | "signed" | "all";

/** All visit notes: drafts to sign first, then signed notes. */
export function NotesScreen() {
  const notes = useClinical((s) => s.notes);
  const signNote = useClinical((s) => s.signNote);
  const [filter, setFilter] = useState<Filter>("draft");
  const [editor, setEditor] = useState<{ noteId?: string } | null>(null);
  const [viewing, setViewing] = useState<VisitNote | null>(null);

  const sorted = useMemo(
    () => [...notes].sort((a, b) => (a.status === b.status ? b.updatedAt.localeCompare(a.updatedAt) : a.status === "draft" ? -1 : 1)),
    [notes],
  );
  const drafts = notes.filter((n) => n.status === "draft").length;
  const shown = filter === "all" ? sorted : sorted.filter((n) => n.status === filter);

  function sign(n: VisitNote) {
    if (!n.subjective.trim() || !n.objective.trim() || !n.assessment.trim() || !n.plan.trim()) {
      toast.error("Finish the note first", { description: "All four SOAP parts are needed to sign." });
      setEditor({ noteId: n.id });
      return;
    }
    signNote(n.id);
    toast.success("Note signed", { description: `${n.type} for ${clinicalPatientsById[n.patientId]?.name}` });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Dr. Layla Haddad · Cardiology"
        title="Visit notes"
        description={drafts ? `${drafts} draft note(s) waiting for your signature.` : "All notes are signed. Well done."}
        actions={
          <Button onClick={() => setEditor({})}>
            <Plus aria-hidden /> New note
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter notes">
        <FilterChip active={filter === "draft"} onClick={() => setFilter("draft")} count={drafts}>
          To sign
        </FilterChip>
        <FilterChip active={filter === "signed"} onClick={() => setFilter("signed")} count={notes.length - drafts}>
          Signed
        </FilterChip>
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")} count={notes.length}>
          All
        </FilterChip>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface shadow-soft">
          <EmptyState image="/images/dashboard/empty-records.png" title={filter === "draft" ? "Nothing to sign" : "No notes"} description="Start a new note from a visit or with the button above." />
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((n) => {
            const p = clinicalPatientsById[n.patientId];
            return (
              <li key={n.id} className="rounded-2xl border border-border bg-surface p-4 shadow-soft sm:p-5">
                <div className="flex flex-wrap items-center gap-3">
                  {p && <PatientIdentity patient={p} size={40} sub={`${n.type} · ${formatDay(n.createdAt)}, ${formatTime(n.createdAt)}`} className="flex-1" />}
                  <StatusBadge status={n.status === "signed" ? "completed" : "draft"} label={n.status === "signed" ? "Signed" : "Draft"} />
                </div>
                <p className="mt-3 line-clamp-2 text-sm">
                  <span className="font-semibold">Assessment: </span>
                  {n.assessment || <span className="text-muted-foreground">not written yet</span>}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="mr-auto text-xs text-muted-foreground">
                    {n.status === "signed" && n.signedAt ? `Signed ${timeAgo(n.signedAt)}` : `Edited ${timeAgo(n.updatedAt)}`} · {n.authorName}
                  </span>
                  {n.status === "draft" ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setEditor({ noteId: n.id })}>
                        <NotebookPen aria-hidden /> Open
                      </Button>
                      <Button size="sm" onClick={() => sign(n)}>
                        <Signature aria-hidden /> Sign
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setViewing(n)}>
                      View note
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <NoteEditorDialog open={!!editor} onOpenChange={(o) => !o && setEditor(null)} noteId={editor?.noteId} />

      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent className="max-w-lg overflow-y-auto">
          {viewing && <NoteView note={viewing} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function NoteView({ note }: { note: VisitNote }) {
  const p = clinicalPatientsById[note.patientId];
  return (
    <div className="p-6">
      <SheetTitle className="pr-10 font-display text-xl font-extrabold">{note.type}</SheetTitle>
      <SheetDescription className="mt-1 text-sm text-muted-foreground">
        Signed by {note.authorName} {note.signedAt && `on ${formatDay(note.signedAt)}, ${formatTime(note.signedAt)}`}
      </SheetDescription>
      {p && (
        <div className="mt-5 rounded-2xl bg-surface-2 p-4">
          <PatientIdentity patient={p} size={40} />
          <AllergyBadges allergies={p.allergies} className="mt-3" />
        </div>
      )}
      <dl className="mt-5 space-y-4 text-sm">
        {(
          [
            ["Subjective", note.subjective],
            ["Objective", note.objective],
            ["Assessment", note.assessment],
            ["Plan", note.plan],
          ] as const
        ).map(([label, text]) => (
          <div key={label}>
            <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</dt>
            <dd className="mt-1 whitespace-pre-line">{text}</dd>
          </div>
        ))}
      </dl>
      {p && (
        <Button asChild variant="soft" className="mt-6">
          <Link href={`/dashboard/patients/${p.id}`}>
            <FileHeart aria-hidden /> Open chart
          </Link>
        </Button>
      )}
    </div>
  );
}
