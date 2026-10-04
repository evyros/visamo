import { Bone, SkeletonCard, SkeletonPage } from "@/components/app/page-skeleton";

// The overview's stage card, progress and activity cards, and details card.
export default function OverviewLoading() {
  return (
    <SkeletonPage width="960">
      <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <SkeletonCard lines={6} />
        <div className="grid grid-cols-1 gap-6">
          <div className="rounded-card border border-line-200 bg-white p-5 sm:p-6">
            <Bone className="h-6 w-40" />
            <Bone className="mt-5 h-3 w-full rounded-full" />
            <Bone className="mt-3 h-4 w-1/2" />
          </div>
          <SkeletonCard lines={2} />
        </div>
        <SkeletonCard lines={5} className="lg:col-span-2" />
      </div>
    </SkeletonPage>
  );
}
