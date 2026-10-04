import { SkeletonCard, SkeletonPage } from "@/components/app/page-skeleton";

export default function DetailsLoading() {
  return (
    <SkeletonPage width="720" back intro>
      <SkeletonCard lines={6} className="mt-6" />
    </SkeletonPage>
  );
}
