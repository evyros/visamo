import type { ReactNode } from "react";
import type { Messages } from "@/i18n/dictionaries";
import { Icon, type IconName } from "../icons";
import { Container, SectionTitle, mobileCenter } from "../ui";

export function Problem({ t }: { t: Messages }) {
  const p = t.home.problem;
  return (
    <section id="why" className="py-16 sm:py-24">
      <Container>
        <SectionTitle className="max-w-3xl">{p.title}</SectionTitle>
        <p className={`mx-auto mt-4 max-w-3xl text-lg lg:mx-0 ${mobileCenter}`}>{p.lead}</p>

        <div className="mt-12 grid items-start gap-6 md:grid-cols-2">
          <Column label={p.without.label} tone="without">
            <Node icon="send" title={p.without.submit} />
            <Wait label={p.without.wait} surface="bg-sand-50" />
            {/* The extra iteration, framed so it reads as one repeated loop. */}
            <div className="relative -mx-3.5 rounded-2xl border-2 border-dashed border-terracotta-600/50 bg-terracotta-100/60 p-3">
              <Node icon="alert" title={p.without.sentBack} tone="alert" />
              <Line />
              <Node icon="file" title={p.without.resubmit} />
              <Wait label={p.without.waitAgain} tone="alert" surface="bg-terracotta-100" />
            </div>
            <Line />
            <Node icon="mail" title={p.without.answer} />
          </Column>

          <Column label={p.with.label} tone="with">
            <Node icon="shield" title={p.with.check} tone="teal" />
            <Line tone="teal" />
            <Node icon="send" title={p.with.submit} tone="teal" />
            <Wait label={p.with.wait} surface="bg-white" />
            <Node icon="mail" title={p.with.answer} tone="teal" />
          </Column>
        </div>
        <p className={`mt-6 text-xs text-slate-500 ${mobileCenter}`}>{p.caption}</p>
      </Container>
    </section>
  );
}

function Column({ label, tone, children }: { label: string; tone: "without" | "with"; children: ReactNode }) {
  const without = tone === "without";
  return (
    <div
      className={`rounded-2xl border p-5 sm:p-8 ${
        without ? "border-line-200 bg-sand-50" : "border-teal-600/30 bg-white shadow-soft"
      }`}
    >
      <p className={`mb-6 text-sm font-semibold uppercase tracking-wide ${without ? "text-slate-500" : "text-teal-700"}`}>
        {label}
      </p>
      {children}
    </div>
  );
}

const nodeTones = {
  plain: { card: "border-line-200 bg-white", icon: "bg-sand-50 text-slate-700" },
  alert: { card: "border-terracotta-600/40 bg-white", icon: "bg-terracotta-600 text-white" },
  teal: { card: "border-teal-600/25 bg-teal-100/40", icon: "bg-teal-600 text-white" },
};

function Node({ icon, title, tone = "plain" }: { icon: IconName; title: string; tone?: keyof typeof nodeTones }) {
  const style = nodeTones[tone];
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${style.card}`}>
      <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full ${style.icon}`}>
        <Icon name={icon} className="size-[18px]" />
      </span>
      <p className="font-medium leading-snug text-navy-900">{title}</p>
    </div>
  );
}

// Connectors line up with the center of the node icons (12px padding + 18px).
function Line({ tone = "plain" }: { tone?: "plain" | "teal" }) {
  return (
    <div
      aria-hidden="true"
      className={`ms-[29px] h-5 border-s-2 ${tone === "teal" ? "border-teal-600/50" : "border-slate-300"}`}
    />
  );
}

/** A long dashed connector for time spent waiting on the Ministry. */
function Wait({ label, tone = "plain", surface }: { label: string; tone?: "plain" | "alert"; surface: string }) {
  const alert = tone === "alert";
  return (
    <div
      className={`ms-[29px] flex h-20 items-center border-s-2 border-dashed ${alert ? "border-terracotta-600" : "border-slate-400"}`}
    >
      {/* The clock sits on the line; its background hides the dashes behind it. */}
      <span
        className={`-ms-[13px] inline-flex items-center gap-2 text-sm font-medium ${alert ? "text-terracotta-600" : "text-slate-500"}`}
      >
        <span className={`inline-flex rounded-full ${surface}`}>
          <Icon name="clock" className="size-6" />
        </span>
        {label}
      </span>
    </div>
  );
}
