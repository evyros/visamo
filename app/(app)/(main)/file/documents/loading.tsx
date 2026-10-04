import { Bone, SkeletonPage } from "@/components/app/page-skeleton";

// A group heading and a few document rows, twice.
export default function DocumentsLoading() {
  return (
    <SkeletonPage width="840" intro>
      {[3, 2].map((rows, g) => (
        <div key={g} className="mt-8">
          <Bone className="h-6 w-44" />
          <div className="mt-3 space-y-3">
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className="flex items-start gap-3 rounded-card border border-line-200 bg-white p-4 sm:p-5">
                <Bone className="size-6 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2.5">
                  <Bone className="h-5 w-1/2" />
                  <Bone className="h-4 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </SkeletonPage>
  );
}
