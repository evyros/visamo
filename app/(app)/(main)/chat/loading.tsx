import { Bone } from "@/components/app/page-skeleton";

// The whole chat section while it renders: the sidebar (a drawer bar below
// `lg`, as in section-shell.tsx), a new chat's greeting and the message box.
//
// The section lives in the (conversation) group so this boundary sits above
// the chat id: a loading boundary is replaced whenever the segment under it
// changes, and here that's always (conversation). So it shows on the way in
// from another section, but not when a new chat moves to /chat/<id> after its
// first answer (chat-view.tsx), which would flash it over the answer.
export default function ChatLoading() {
  return (
    <div aria-busy="true" className="flex min-h-0 flex-1 motion-safe:animate-pulse">
      <div className="hidden w-64 shrink-0 flex-col gap-6 border-e border-line-200 bg-white p-4 lg:flex">
        <Bone className="h-9 w-full rounded-[10px]" />
        <div className="space-y-3 px-1">
          <Bone className="h-4 w-16" />
          {["w-full", "w-4/5", "w-11/12", "w-3/4"].map((width, i) => (
            <Bone key={i} className={`h-5 ${width}`} />
          ))}
        </div>
        <div className="mt-auto space-y-2 border-t border-line-200 px-1 pt-4">
          <Bone className="h-4 w-32" />
          <Bone className="h-5 w-24" />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 shrink-0 items-center gap-3 border-b border-line-200 bg-white px-4 lg:hidden">
          <Bone className="size-6" />
          <Bone className="h-5 w-20" />
        </div>
        <div className="mx-auto flex w-full max-w-[768px] flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6">
          <Bone className="size-12 rounded-full" />
          <Bone className="mt-4 h-8 w-56" />
          <Bone className="mt-3 h-5 w-full max-w-sm" />
          <div className="mt-8 flex w-full max-w-xl flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <Bone key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div className="mx-auto w-full max-w-[768px] px-4 pb-3 sm:px-6">
          <Bone className="h-14 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
