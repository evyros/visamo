import type { ReactNode } from "react";
import type { Messages } from "@/i18n/dictionaries";
import { Icon, isIconName } from "../icons";
import { LogoMark } from "../logo";
import { Container, IconTile, SectionTitle, mobileCenter } from "../ui";
import { FixMark, Line, MockupCard, Paper, Stamp, StatusChip } from "./mockup";

type Features = Messages["home"]["features"];

export function Features({ t }: { t: Messages }) {
  const f = t.home.features;
  return (
    <section id="features" className="overflow-hidden py-16 sm:py-24">
      <Container>
        <div className={`mx-auto max-w-3xl lg:mx-0 ${mobileCenter}`}>
          <SectionTitle>{f.title}</SectionTitle>
          <p className="mt-4 text-lg text-slate-700">{f.intro}</p>
        </div>

        {/* What couples come back for, shown rather than described; the rest is a list. */}
        <div className="mt-14 space-y-16 lg:mt-20 lg:space-y-24">
          <Showcase title={f.list.title} body={f.list.body}>
            <ListMockup mockup={f.list.mockup} />
          </Showcase>
          <Showcase title={f.check.title} body={f.check.body} reverse>
            <CheckMockup mockup={f.check.mockup} />
          </Showcase>
          <Showcase title={f.assistant.title} body={f.assistant.body}>
            <ChatMockup chat={f.assistant.chat} />
          </Showcase>
          <Showcase title={f.tracker.title} body={f.tracker.body} reverse>
            <StageMockup mockup={f.tracker.mockup} />
          </Showcase>
        </div>

        <ul className="mt-16 grid gap-x-10 gap-y-8 border-t border-line-200 pt-12 sm:grid-cols-2 lg:mt-24">
          {f.items.map((item) => (
            <li key={item.title} className="flex gap-4">
              {isIconName(item.icon) && <IconTile name={item.icon} />}
              <div>
                <h3 className="text-lg font-semibold text-navy-900">{item.title}</h3>
                <p className="mt-1 text-[15px] leading-7">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/** Text beside a product mockup. `reverse` puts the mockup first from `lg` up, so the rows alternate. */
function Showcase({
  title,
  body,
  reverse = false,
  children,
}: {
  title: string;
  body: string;
  reverse?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className={`mx-auto max-w-md lg:mx-0 ${mobileCenter}`}>
        <h3 className="font-display text-2xl font-semibold leading-snug text-balance text-navy-900 sm:text-3xl">
          {title}
        </h3>
        <p className="mt-4 text-lg leading-8">{body}</p>
      </div>
      <div className={`relative ${reverse ? "lg:order-first" : ""}`}>
        {/* A soft glow behind the mockup, like the hero's. */}
        <div aria-hidden="true" className="absolute inset-8 rounded-full bg-teal-600/10 blur-3xl" />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}

/**
 * A couple's document list with one document open: where to get it in their
 * country, what it must include, its apostille and translation, drawn as a
 * route of steps, and the way around it when it can't be had.
 */
function ListMockup({ mockup }: { mockup: Features["list"]["mockup"] }) {
  return (
    // An illustration, not text to copy.
    <figure aria-label={mockup.label} className="relative mx-auto w-full max-w-[460px] select-none">
      <div className="rounded-2xl bg-white p-5 shadow-float ring-1 ring-line-200 sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-semibold text-navy-900">{mockup.title}</p>
          <p className="text-xs text-slate-500">{mockup.count}</p>
        </div>

        <div className="mt-4 rounded-xl bg-sand-50 p-4 ring-1 ring-line-200">
          <div className="flex items-center gap-3">
            <Flag />
            <p className="min-w-0 flex-1 text-[15px] font-semibold text-navy-900">{mockup.document}</p>
            <Icon name="chevronDown" className="size-4 shrink-0 rotate-180 text-slate-500" aria-hidden="true" />
          </div>

          <ol className="mt-4">
            {mockup.steps.map((step, i) => (
              <li key={step.label} className="relative flex gap-3 pb-3.5">
                {i < mockup.steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute start-[15px] top-8 bottom-0 border-s-2 border-dotted border-teal-600/35"
                  />
                )}
                <span
                  aria-hidden="true"
                  className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-teal-700 ring-1 ring-teal-600/25"
                >
                  <StepGlyph name={step.icon} />
                </span>
                <span className="min-w-0 pt-0.5">
                  <span className="block text-xs font-medium text-slate-500">{step.label}</span>
                  <span className="block text-sm leading-snug text-navy-900">{step.value}</span>
                </span>
              </li>
            ))}
          </ol>

          {/* The way around it: off the route, so it reads as the other path, not a next step. */}
          <div className="mt-0.5 flex gap-3 rounded-lg border border-dashed border-slate-300 bg-white p-3">
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-500"
            >
              <StepGlyph name="alternative" />
            </span>
            <span className="min-w-0 pt-0.5">
              <span className="block text-sm font-semibold text-navy-900">{mockup.alternative.label}</span>
              <span className="mt-0.5 inline-flex items-center gap-1 text-sm font-semibold text-teal-700">
                {mockup.alternative.value}
                <Icon name="arrow" className="size-3.5" aria-hidden="true" />
              </span>
            </span>
          </div>
        </div>

        {/* The rest of the list, closed. */}
        <ul className="mt-1">
          {mockup.more.map((name) => (
            <li key={name} className="flex items-center gap-3 border-b border-line-200 py-3 last:border-0 last:pb-0">
              <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center text-slate-300">
                <StepGlyph name="document" />
              </span>
              <span className="min-w-0 flex-1 text-sm text-slate-700">{name}</span>
              <Icon name="chevron" className="size-4 shrink-0 text-slate-300" aria-hidden="true" />
            </li>
          ))}
        </ul>
      </div>
    </figure>
  );
}

/** The list mockup's glyphs, drawn on the same 24px grid and stroke as the site's icons. */
const stepGlyphs: Record<string, ReactNode> = {
  // A map pin: where to get it.
  where: (
    <>
      <path d="M12 21s-6.5-5.4-6.5-11a6.5 6.5 0 0 1 13 0c0 5.6-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  // A page with ticked lines: what it must include.
  include: (
    <>
      <path d="M17.5 21h-11a1.5 1.5 0 0 1-1.5-1.5v-15A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5v15a1.5 1.5 0 0 1-1.5 1.5Z" />
      <path d="m8 8.5 1.2 1.2L11.5 7.5M13.5 8.5H16M8 14l1.2 1.2 2.3-2.2M13.5 14H16" />
    </>
  ),
  // A seal with ribbons: the apostille.
  apostille: (
    <>
      <circle cx="12" cy="9" r="5.5" />
      <circle cx="12" cy="9" r="2" />
      <path d="m8.6 13.3-1.6 7.2 5-2.6 5 2.6-1.6-7.2" />
    </>
  ),
  // A letter becoming another: the translation.
  translation: (
    <>
      <path d="M3.5 5.5h8M7.5 3.5v2M5 5.5c.9 3 2.9 5.4 5.8 6.6M10 5.5c-.9 3.6-3.1 6.2-6.5 7.5" />
      <path d="m12.5 20.5 4.25-9.5 4.25 9.5M14 17h5.5" />
    </>
  ),
  // A path that forks: the alternative.
  alternative: (
    <>
      <path d="M6 3.5V10a5 5 0 0 0 5 5h7.5" />
      <path d="M6 10v10.5" />
      <path d="m15.5 12 3 3-3 3" />
    </>
  ),
  // A sheet of paper, for the closed documents.
  document: (
    <>
      <path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5L14 3Z" />
      <path d="M14 3v4.5h4.5M9 12.5h6M9 16h4" />
    </>
  ),
};

function StepGlyph({ name }: { name: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`size-[18px] ${name === "alternative" ? "rtl:-scale-x-100" : ""}`}
    >
      {stepGlyphs[name]}
    </svg>
  );
}

/** The example document's country, Germany, as a small flag. */
function Flag() {
  return (
    <span aria-hidden="true" className="block h-3.5 w-[23px] shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/5">
      <svg viewBox="0 0 5 3" preserveAspectRatio="none" className="block size-full">
        <path fill="#000" d="M0 0h5v1H0z" />
        <path fill="#d00" d="M0 1h5v1H0z" />
        <path fill="#ffce00" d="M0 2h5v1H0z" />
      </svg>
    </span>
  );
}

/**
 * A check, as an annotated page: the line it found wrong is marked, with a note
 * hanging from it, and what passed gets a quiet chip on the corner.
 */
function CheckMockup({ mockup }: { mockup: Features["check"]["mockup"] }) {
  return (
    <figure aria-label={mockup.label} className="relative mx-auto w-full max-w-[460px] pb-6">
      <Paper title={mockup.title} className="w-[84%]">
        <div className="relative mt-6">
          <div className="-mx-2 rounded-lg bg-crimson-100 px-2 py-2 ring-1 ring-crimson-600/30">
            <p className="text-xs font-semibold text-crimson-600">{mockup.field}</p>
            <Line tone="alert" className="mt-1.5 w-1/2" />
          </div>

          {/* The note, hanging from the marked line and out past the page's edge. */}
          <div className="absolute start-[30%] top-[calc(100%+14px)] z-10 w-[236px] rounded-xl bg-white p-4 shadow-float ring-1 ring-line-200 sm:start-[40%] sm:w-[284px]">
            {/* Physical borders: the caret's two top edges, whatever the direction. */}
            <span
              aria-hidden="true"
              className="absolute -top-[7px] start-6 size-3 rotate-45 border-t border-l border-line-200 bg-white"
            />
            <div className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-crimson-600 text-white"
              >
                <FixMark className="size-4" />
              </span>
              <div>
                <p className="text-[15px] leading-snug font-semibold text-balance text-navy-900">{mockup.finding.title}</p>
                <p className="mt-1 text-sm leading-6 text-pretty text-slate-700">{mockup.finding.detail}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          <Line className="w-full" />
          <Line className="w-3/4" />
        </div>
        <div className="mt-8">
          <Stamp />
        </div>
        {/* What passed, on the page's corner as in the hero, clear of the note at any width.
            Start-aligned, so the checks line up in one column. */}
        <div className="absolute -end-10 -top-3 flex flex-col items-start gap-2">
          {mockup.passed.map((item) => (
            <StatusChip key={item} size="sm">
              {item}
            </StatusChip>
          ))}
        </div>
      </Paper>
    </figure>
  );
}

function ChatMockup({ chat }: { chat: Features["assistant"]["chat"] }) {
  return (
    <figure
      aria-label={chat.label}
      className="mx-auto w-full max-w-[460px] rounded-2xl bg-white p-5 shadow-float ring-1 ring-line-200 sm:p-6"
    >
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-se-md bg-navy-900 px-4 py-3 text-[15px] leading-6 text-white">
          {chat.question}
        </p>
      </div>
      <div className="mt-4 flex items-end gap-2.5">
        <LogoMark className="size-8 shrink-0" />
        <div className="max-w-[85%]">
          <p className="mb-1 text-xs font-medium text-slate-500">{chat.name}</p>
          <p className="rounded-2xl rounded-es-md bg-teal-100 px-4 py-3 text-[15px] leading-6 text-navy-900">
            {chat.answer}
          </p>
        </div>
      </div>
      <div
        className="mt-5 flex items-center gap-2 rounded-full border border-line-200 px-4 py-2.5 text-sm text-slate-500"
        aria-hidden="true"
      >
        <span className="flex-1">…</span>
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-teal-600 text-white">
          <Icon name="send" className="size-3.5" />
        </span>
      </div>
    </figure>
  );
}

/** The file overview's stage card (components/app/stage-card.tsx), for an example married couple. */
function StageMockup({ mockup }: { mockup: Features["tracker"]["mockup"] }) {
  return (
    <MockupCard label={mockup.label} title={mockup.title} subtitle={mockup.subtitle}>
      <ol className="mt-5 border-t border-line-200 pt-5">
        {mockup.steps.map((step, i) => {
          const done = step.status === "done";
          const here = step.status === "here";
          const last = i === mockup.steps.length - 1;
          return (
            <li key={step.name} className="relative flex gap-3 pb-4 last:pb-0">
              {!last && (
                <span
                  aria-hidden="true"
                  className={`absolute start-[11px] top-6 bottom-0 w-0.5 ${done ? "bg-teal-600" : "bg-line-200"}`}
                />
              )}
              <span aria-hidden="true" className="relative flex size-6 shrink-0 items-center justify-center">
                {here && <span className="animate-halo absolute inset-0 rounded-full bg-teal-600 opacity-0" />}
                <span
                  className={`relative flex size-6 items-center justify-center rounded-full ${
                    done
                      ? "bg-teal-600 text-white"
                      : here
                        ? "bg-white ring-[5px] ring-teal-600 ring-inset"
                        : "bg-white ring-2 ring-line-200 ring-inset"
                  }`}
                >
                  {done && <Icon name="check" className="size-4" />}
                </span>
              </span>
              <span className="min-w-0 pt-px">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span
                    className={`text-[15px] ${
                      here ? "font-semibold text-navy-900" : done ? "text-navy-900" : "text-slate-500"
                    }`}
                  >
                    {step.name}
                  </span>
                  {here && (
                    <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                      {mockup.now}
                    </span>
                  )}
                </span>
                {"detail" in step && step.detail && (
                  <span className="mt-0.5 block text-sm text-slate-500">{step.detail}</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </MockupCard>
  );
}
