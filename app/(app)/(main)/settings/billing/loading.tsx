import { Bone, SkeletonPage } from "@/components/app/page-skeleton";

// The file's balances side by side, then purchase history.
export default function BillingLoading() {
  return (
    <SkeletonPage width="720" intro>
      <div className="mt-8 space-y-10">
        <div>
          <Bone className="mb-3 h-6 w-32" />
          <div className="grid rounded-card border border-line-200 bg-white sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <Bone className="size-11 rounded-[14px]" />
                  <Bone className="h-4 w-32" />
                </div>
                <Bone className="mt-4 h-11 w-20" />
                <Bone className="mt-6 h-10 w-48 rounded-[10px]" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <Bone className="mb-3 h-6 w-28" />
          <div className="divide-y divide-line-200 rounded-card border border-line-200 bg-white">
            {[0, 1].map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                <Bone className="size-10 rounded-[14px]" />
                <div className="flex-1 space-y-2">
                  <Bone className="h-4 w-36" />
                  <Bone className="h-3.5 w-48" />
                </div>
                <Bone className="h-4 w-14" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </SkeletonPage>
  );
}
