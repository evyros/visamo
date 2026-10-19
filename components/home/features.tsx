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
          <Showcase title={f.documents.title} body={f.documents.body}>
            <CheckMockup mockup={f.documents.mockup} />
          </Showcase>
          <Showcase title={f.assistant.title} body={f.assistant.body} reverse>
            <ChatMockup chat={f.assistant.chat} />
          </Showcase>
          <Showcase title={f.tracker.title} body={f.tracker.body}>
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
 * A check, as an annotated page: the line it found wrong is marked, with a note
 * hanging from it, and what passed gets a quiet chip on the corner.
 */
function CheckMockup({ mockup }: { mockup: Features["documents"]["mockup"] }) {
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
