import CheckoutClient from "./CheckoutClient";

export default function Page({
  searchParams,
}: {
  searchParams?: { [k: string]: string | string[] | undefined };
}) {
  const sp = (k: string) => (typeof searchParams?.[k] === "string" ? String(searchParams![k]) : undefined);

  const plan   = (sp("plan") ?? "medium") as "free" | "medium" | "premium";
  const userId = Number(sp("userId") ?? 0);
  const price  = Number(sp("price") ?? 0);
  const first  = sp("firstName") ?? "";
  const last   = sp("lastName") ?? "";
  const email  = sp("email") ?? "";

  return (
    <CheckoutClient
      plan={plan}
      userId={userId}
      price={price}
      firstName={first}
      lastName={last}
      email={email}
    />
  );
}

export const dynamic = "force-dynamic";
