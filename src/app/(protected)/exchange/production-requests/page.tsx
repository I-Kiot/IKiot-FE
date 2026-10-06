import { ProductionPage } from "./components/production-page";

// Task B-6 / B-7. `?locationId=` and `?create=short` let a shortage notification land on the
// create dialog, already filtered to what needs ordering.
export default async function ProductionRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ locationId?: string; create?: string }>;
}) {
  const { locationId, create } = await searchParams;
  return (
    <ProductionPage
      initialLocationId={locationId || undefined}
      openCreateShort={create === "short"}
    />
  );
}
