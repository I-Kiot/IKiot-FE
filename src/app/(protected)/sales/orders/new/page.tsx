import { redirect } from "next/navigation";

/** The manual-order form now lives in the second tab of /check-out; old links and bookmarks land there. */
export default async function CreateOrderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = new URLSearchParams({ mode: "order" });
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string" && key !== "mode") params.set(key, value);
  }
  redirect(`/check-out?${params.toString()}`);
}
