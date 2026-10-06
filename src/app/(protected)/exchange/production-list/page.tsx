import { redirect } from "next/navigation";

// The BE's shortage notifications link to `/exchange/production-list?locationId=…&productItemId=…`
// (contract §3). There is no separate list any more: this opens the create dialog on the
// production screen, its product picker filtered to what needs ordering.
export default async function ProductionListRedirect({
  searchParams,
}: {
  searchParams: Promise<{ locationId?: string }>;
}) {
  const { locationId } = await searchParams;
  const params = new URLSearchParams({ create: "short" });
  if (locationId) params.set("locationId", locationId);
  redirect(`/exchange/production-requests?${params.toString()}`);
}
