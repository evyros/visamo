import Link from "next/link";
import type { ReactNode } from "react";
import { trackPath, type Answers, type ProcessGuide } from "@/content/process";
import type { Bubble, DocumentGroupId, ProcessTexts } from "@/content/process/types";
import type { Locale } from "@/i18n/config";
import { localePath, newTab, signupUrl } from "@/lib/site";
import type { Messages } from "@/i18n/dictionaries";
import { GuideBlocks, GuideText } from "../guide";
import { CheckMockup } from "../home/hero";
import { Icon, type IconName } from "../icons";
import { ButtonLink, Container, mobileCenter } from "../ui";

// The parts of a process guide page (app/[lang]/guide/partner-visa-process/[track]).

// ── The situation: the three answers, each one a switch to another version ──

export function SituationBar({ answers, texts, locale }: { answers: Answers; texts: ProcessTexts; locale: Locale }) {
  const { labels } = texts;
  const options = texts.answers;
  const lived = answers.livedTogether ? "yes" : "no";
  const groups: { label: string; items: { key: string; label: string; to: Answers; current: boolean }[] }[] = [
    {
      label: options.relationship[answers.relationship].chip,
      items: (["married", "commonLaw"] as const).map((relationship) => ({
        key: relationship,
        label: options.relationship[relationship].chip,
        to: { ...answers, relationship },
        current: relationship === answers.relationship,
      })),
    },
    {
      label: options.location[answers.location].chip,
      items: (["bothInIsrael", "partnerAbroad", "bothAbroad"] as const).map((location) => ({
        key: location,
        label: options.location[location].chip,
        to: { ...answers, location },
        current: location === answers.location,
      })),
    },
    {
      label: options.lived[lived].chip,
      items: (["yes", "no"] as const).map((value) => ({
        key: value,
        label: options.lived[value].chip,
        to: { ...answers, livedTogether: value === "yes" },
        current: value === lived,
      })),
    },
  ];

  const switches = (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      {groups.map((group, i) => (
        <div key={i} className="flex rounded-xl border border-line-200 bg-white p-1">
          {group.items.map((item) => (
            <Link
              key={item.key}
              href={localePath(locale, trackPath(item.to))}
              scroll={false}
              aria-current={item.current ? "page" : undefined}
              className={`flex-1 rounded-lg px-3 py-1.5 text-center text-sm font-semibold whitespace-nowrap transition-colors ${
                item.current ? "bg-navy-900 text-white" : "text-slate-700 hover:bg-sand-50 hover:text-navy-900"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <nav aria-label={labels.yourSituation} className="mt-6">
      {/* On a phone, the answers fold into one line; from sm up, the switches are always open. */}
      <details className="group rounded-2xl border border-line-200 bg-sand-50 sm:hidden">
        <summary className="flex cursor-pointer items-center gap-3 px-4 py-3">
          <span className="min-w-0 flex-1 text-sm">
            <span className="block font-semibold text-slate-500">{labels.yourSituation}</span>
            <span className="block font-semibold text-navy-900">{groups.map((group) => group.label).join(" · ")}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700">
            {labels.change}
            <Icon name="chevronDown" className="size-4 transition-transform group-open:rotate-180" />
          </span>
        </summary>
        <div className="px-3 pb-3">{switches}</div>
      </details>
      <div className="hidden sm:block">
        <p className="mb-2 text-sm font-semibold text-slate-500">{labels.yourSituation}</p>
        {switches}
      </div>
    </nav>
  );
}

// ── A step ──────────────────────────────────────────────────────────────────

const bubbleStyles: Record<Bubble["tone"], { box: string; icon: IconName; iconBox: string; label: string }> = {
  important: {
    box: "border-amber-500/30 bg-amber-100/70",
    icon: "alert",
    iconBox: "bg-amber-500 text-white",
    label: "text-terracotta-600",
  },
  tip: { box: "border-teal-600/20 bg-teal-100/70", icon: "sparkle", iconBox: "bg-teal-600 text-white", label: "text-teal-700" },
  info: { box: "border-line-200 bg-white", icon: "info", iconBox: "bg-sage-200 text-navy-900", label: "text-slate-500" },
};

function BubbleCard({ bubble, label, locale }: { bubble: Bubble; label: string; locale: Locale }) {
  const style = bubbleStyles[bubble.tone];
  return (
    <aside className={`flex gap-3.5 rounded-2xl border p-4 sm:gap-4 sm:p-5 ${style.box}`}>
      <span className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full ${style.iconBox}`}>
        <Icon name={style.icon} className="size-[18px]" />
      </span>
      <div className="min-w-0">
        <p className={`text-xs font-bold tracking-wide uppercase ${style.label}`}>{label}</p>
        <p className="mt-0.5 font-semibold text-navy-900">{bubble.title}</p>
        <p className="mt-1 text-[15.5px] leading-7">
          <GuideText text={bubble.text} locale={locale} />
        </p>
      </div>
    </aside>
  );
}

/** Soft shapes scattered on a milestone's far side. */
function Confetti() {
  const pieces: [number, number, number, string, "dot" | "bar"][] = [
    [18, 22, 6, "fill-amber-100/70", "dot"],
    [44, 12, 10, "fill-white/35", "bar"],
    [70, 30, 5, "fill-sage-200/80", "dot"],
    [30, 52, 9, "fill-amber-500/60", "bar"],
    [84, 60, 7, "fill-white/45", "dot"],
    [58, 74, 10, "fill-sage-200/60", "bar"],
    [92, 18, 9, "fill-amber-100/50", "bar"],
    [10, 84, 5, "fill-white/40", "dot"],
  ];
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" className="pointer-events-none absolute end-0 top-0 h-16 w-20 opacity-80 sm:h-full sm:w-60 sm:opacity-100">
      {pieces.map(([x, y, size, fill, shape], i) =>
        shape === "dot" ? (
          <circle key={i} cx={x} cy={y} r={size / 2} className={fill} />
        ) : (
          <rect
            key={i}
            x={x - size / 2}
            y={y - 1.5}
            width={size}
            height={3}
            rx={1.5}
            className={fill}
            transform={`rotate(${(i * 47) % 180 - 90} ${x} ${y})`}
          />
        ),
      )}
    </svg>
  );
}

export function ProcessStep({
  step,
  number,
  last,
  texts,
  locale,
  children,
}: {
  step: ProcessGuide["steps"][number];
  number: number;
  last: boolean;
  texts: ProcessTexts;
  locale: Locale;
  /** What the page adds after the step's body: the document list, in the filing step. */
  children?: ReactNode;
}) {
  const { labels } = texts;
  const n = number.toLocaleString(locale);
  const milestone = step.milestone;
  return (
    <li id={`step-${step.id}`} className="relative scroll-mt-28 ps-14 sm:ps-[4.5rem]">
      {!last && (
        <span aria-hidden="true" className="absolute start-[19px] top-12 -bottom-16 w-0.5 rounded-full bg-line-200 sm:start-[23px] sm:top-14" />
      )}
      <span
        aria-hidden="true"
        className={`absolute start-0 top-0 inline-flex size-10 items-center justify-center rounded-full font-display text-lg font-semibold text-white ring-[6px] ring-sand-50 sm:size-12 sm:text-xl ${
          milestone ? "bg-teal-600 shadow-[0_0_0_12px_rgb(47_127_118/0.14)]" : "bg-navy-900"
        }`}
      >
        {n}
      </span>

      <p className="pt-1.5 text-sm font-semibold text-teal-700 sm:pt-2.5">{labels.step.replace("{n}", n)}</p>
      <h2 className="mt-1 font-display text-[26px] leading-tight font-semibold text-balance text-navy-900 sm:text-[32px]">
        {step.title}
      </h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {step.meta.map((meta) => (
          <li
            key={meta.text}
            className="inline-flex items-center gap-1.5 rounded-full border border-line-200 bg-white px-3 py-1 text-sm text-slate-700"
          >
            <Icon name={meta.icon} className="size-4 shrink-0 text-teal-600" />
            {meta.text}
          </li>
        ))}
      </ul>

      {milestone && (
        <div className="relative mt-6 overflow-hidden rounded-2xl bg-linear-to-br from-teal-600 to-teal-700 p-5 text-white shadow-soft sm:p-6 rtl:bg-linear-to-bl">
          <Confetti />
          <p className="relative flex items-center gap-2 text-xs font-bold tracking-wide text-teal-100 uppercase">
            <Icon name="sparkle" className="size-4" />
            {labels.milestone}
          </p>
          <p className="relative mt-1.5 font-display text-2xl leading-tight font-semibold sm:text-[28px]">{milestone.title}</p>
          <p className="relative mt-4 text-sm font-semibold text-white/80">{milestone.lead}</p>
          <ul className="relative mt-2 grid gap-2 text-[16px] leading-7 [&_strong]:text-white">
            {milestone.items.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Icon name="check" className="size-3.5" strokeWidth={2.8} />
                </span>
                <span>
                  <GuideText text={item} locale={locale} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 text-[17px] leading-8">
        <GuideBlocks blocks={step.body} locale={locale} />
      </div>

      {step.checklist && (
        <div className="mt-6 rounded-2xl border border-line-200 bg-white p-5 sm:p-6">
          <p className="flex items-center gap-3 font-semibold text-navy-900">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-sage-200">
              <Icon name="file" className="size-5" />
            </span>
            {step.checklist.title}
          </p>
          <ul className="mt-4 grid gap-x-6 gap-y-2.5 text-[15.5px] leading-6 sm:grid-cols-2">
            {step.checklist.items.map((item) => (
              <li key={item} className="flex gap-2.5">
                <Icon name="check" className="mt-1 size-4 shrink-0 text-teal-600" strokeWidth={2.6} />
                <span>
                  <GuideText text={item} locale={locale} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {children}

      {step.bubbles.length > 0 && (
        <div className="mt-6 grid gap-3">
          {step.bubbles.map((bubble) => (
            <BubbleCard key={bubble.title} bubble={bubble} label={labels.tones[bubble.tone]} locale={locale} />
          ))}
        </div>
      )}

      {step.faq.length > 0 && (
        <div className="mt-7">
          <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
            <Icon name="help" className="size-4 text-slate-500" />
            {labels.quickQuestions}
          </p>
          <div className="mt-2.5 divide-y divide-line-200 rounded-2xl border border-line-200 bg-white">
            {step.faq.map((item) => (
              <details key={item.q} className="group px-4 sm:px-5">
                <summary className="flex cursor-pointer items-center justify-between gap-4 py-3.5 text-[16px] font-semibold text-navy-900">
                  {item.q}
                  <Icon name="chevronDown" className="size-5 shrink-0 text-slate-500 transition-transform group-open:rotate-180" />
                </summary>
                <p className="pb-4 text-[15.5px] leading-7">
                  <GuideText text={item.a} locale={locale} />
                </p>
              </details>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

// ── The documents, in the filing step ───────────────────────────────────────────────────────────

const groupIcons: Record<DocumentGroupId, IconName> = {
  forms: "compose",
  identity: "user",
  relationship: "people",
  civilStatus: "shield",
  lifeTogether: "key",
};

export function DocumentList({
  id,
  documents,
  texts,
  locale,
}: {
  id: string;
  documents: ProcessGuide["documents"];
  texts: ProcessTexts;
  locale: Locale;
}) {
  const t = texts.documents;
  return (
    <div id={id} className="mt-8 scroll-mt-28">
      <h3 className="font-display text-2xl leading-tight font-semibold text-balance text-navy-900 sm:text-[26px]">{t.title}</h3>
      <p className="mt-2 text-[16px] leading-7">{t.intro}</p>

      <div className="mt-5 columns-1 gap-4 sm:columns-2">
        {documents.map((group) => (
          <div key={group.id} className="mb-4 break-inside-avoid rounded-2xl border border-line-200 bg-white p-5 sm:p-6">
            <h3 className="flex items-center gap-3 font-semibold text-navy-900">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-sage-200">
                <Icon name={groupIcons[group.id]} className="size-5" />
              </span>
              {group.title}
            </h3>
            <ul className="mt-4 space-y-3.5">
              {group.items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <Icon name="check" className="mt-1 size-4 shrink-0 text-teal-600" strokeWidth={2.6} />
                  <span className="min-w-0">
                    <span className="block text-[16px] leading-6 font-semibold text-navy-900">{item.name}</span>
                    <span className="mt-0.5 block text-[14.5px] leading-6 text-slate-500">{item.note}</span>
                    {item.link && (
                      <a
                        href={item.link.url}
                        {...newTab}
                        className="mt-1 inline-flex items-center gap-1 text-[14.5px] leading-6 font-semibold text-teal-700 underline underline-offset-4 hover:text-teal-600"
                      >
                        {item.link.label}
                        <Icon name="external" className="size-3.5" strokeWidth={2} />
                        <span className="sr-only">{texts.labels.newTab}</span>
                      </a>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="mb-4 break-inside-avoid rounded-2xl border-[1.5px] border-dashed border-teal-600/40 bg-teal-100/40 p-5 sm:p-6">
          <h3 className="flex items-center gap-3 font-semibold text-navy-900">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white">
              <Icon name="plus" className="size-5" />
            </span>
            {t.depends.title}
          </h3>
          <p className="mt-3 text-[15px] leading-6">{t.depends.intro}</p>
          <ul className="mt-3 space-y-2 text-[15px] leading-6">
            {t.depends.items.map((item) => (
              <li key={item} className="flex gap-2.5">
                <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-teal-600" />
                {item}
              </li>
            ))}
            <li className="ps-4 font-semibold text-teal-700">{t.depends.more}</li>
          </ul>
          <ButtonLink href={signupUrl(locale)} size="sm" className="mt-5 w-full sm:w-auto">
            {t.depends.cta}
            <Icon name="arrow" className="size-4" />
          </ButtonLink>
        </div>
      </div>

      <div className="mt-2 rounded-2xl bg-navy-900/[0.04] p-5 sm:p-6">
        <p className="font-semibold text-navy-900">{t.rules.title}</p>
        <ul className="mt-3 grid gap-3 text-[15px] leading-6 sm:grid-cols-3">
          {t.rules.items.map((item, i) => (
            <li key={i} className="flex gap-2.5">
              <Icon name="checkCircle" className="mt-0.5 size-5 shrink-0 text-teal-600" />
              <span>
                <GuideText text={item} locale={locale} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

type Mockup = Messages["home"]["hero"]["mockup"];

// ── The call to action ──────────────────────────────────────────────────────

export function ProcessCta({ texts, locale, mockup }: { texts: ProcessTexts; locale: Locale; mockup: Mockup }) {
  const { cta } = texts;
  return (
    <section className="relative overflow-hidden bg-navy-900 py-16 text-white sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-48 end-[-10%] size-[720px] rounded-full bg-teal-600/25 blur-3xl"
      />
      {/* On a phone: the fear, the proof, then what answers it and the button. From lg up, the proof sits beside the text. */}
      <Container className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-x-16 lg:gap-y-0">
        <div className={`lg:col-start-1 lg:row-start-1 ${mobileCenter}`}>
          <p className="text-sm font-semibold tracking-wide text-sage-200">{cta.eyebrow}</p>
          <h2 className="mt-3 font-display text-3xl leading-tight font-semibold text-balance sm:text-[44px]">
            {cta.title}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-white/80 lg:mx-0">{cta.body}</p>
        </div>

        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center [&_figcaption]:text-white/70">
          <CheckMockup mockup={mockup} animated={false} />
        </div>

        <div className="lg:col-start-1 lg:row-start-2 lg:pt-10">
          <ul className="space-y-6">
            {cta.features.map((feature) => (
              <li key={feature.title} className="flex gap-4">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sage-200">
                  <Icon name={feature.icon} className="size-6" />
                </span>
                <span>
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="mt-1 text-[15.5px] leading-7 text-white/75">{feature.body}</p>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <ButtonLink href={signupUrl(locale)} variant="inverse" className="h-14 w-full px-8 text-lg sm:w-auto">
              {cta.button}
              <Icon name="arrow" className="size-5" />
            </ButtonLink>
            <p className="mt-4 text-sm text-white/70">{cta.microcopy}</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
