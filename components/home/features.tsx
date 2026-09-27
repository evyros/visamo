import type { Messages } from "@/i18n/dictionaries";
import { Icon, isIconName } from "../icons";
import { LogoMark } from "../logo";
import { Container, IconTile, SectionTitle, Tag, mobileCenter } from "../ui";

export function Features({ t }: { t: Messages }) {
  const f = t.home.features;
  const a = f.assistant;
  return (
    <section id="features" className="bg-white py-16 sm:py-24">
      <Container>
        <div className={`mx-auto max-w-3xl lg:mx-0 ${mobileCenter}`}>
          <SectionTitle>{f.title}</SectionTitle>
          <p className="mt-4 text-lg text-slate-700">{f.intro}</p>
        </div>

        {/* The assistant is the feature couples lean on most, so it gets full width. */}
        <article className="mt-12 grid gap-8 rounded-2xl border border-line-200 bg-sand-50 p-6 sm:p-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <IconTile name="chat" />
              <Tag>{a.tag}</Tag>
            </div>
            <h3 className="mt-6 font-display text-2xl font-semibold text-navy-900 sm:text-3xl">{a.title}</h3>
            <p className="mt-4">{a.body}</p>
            <p className="mt-6 text-xs text-slate-500">{a.footnote}</p>
          </div>
          <ChatMockup chat={a.chat} />
        </article>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {f.cards.map((card) => (
            <article key={card.title} className="flex flex-col rounded-2xl border border-line-200 bg-white p-8">
              <div className="flex items-center gap-3">
                {isIconName(card.icon) && <IconTile name={card.icon} />}
                {"tag" in card && card.tag && <Tag>{card.tag}</Tag>}
              </div>
              <h3 className="mt-6 text-xl font-semibold leading-snug text-navy-900">{card.title}</h3>
              <p className="mt-3 text-[16px] leading-7">{card.body}</p>
              <ul className="mt-5 space-y-2.5">
                {card.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2.5 text-[15px]">
                    <Icon name="check" className="mt-1 size-4 text-teal-600" />
                    {bullet}
                  </li>
                ))}
              </ul>
              {"footnote" in card && card.footnote && (
                <p className="mt-auto pt-6 text-xs text-slate-500">{card.footnote}</p>
              )}
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {f.secondary.map((item) => (
            <div key={item.title} className="flex gap-4 rounded-2xl bg-sand-50 p-6">
              {isIconName(item.icon) && <Icon name={item.icon} className="mt-1 size-6 text-teal-700" />}
              <div>
                <h3 className="font-semibold text-navy-900">{item.title}</h3>
                <p className="mt-1 text-[15px] leading-7">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

type Chat = Messages["home"]["features"]["assistant"]["chat"];

function ChatMockup({ chat }: { chat: Chat }) {
  return (
    <figure aria-label={chat.label} className="rounded-xl border border-line-200 bg-white p-5 shadow-soft">
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
