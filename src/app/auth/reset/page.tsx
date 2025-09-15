import ResetClient from "./ResetClient";

export default function Page({
  searchParams,
}: {
  searchParams?: { [k: string]: string | string[] | undefined };
}) {
  const token = typeof searchParams?.token === "string" ? searchParams.token : "";

  return <ResetClient token={token} />;
}

// Denne siden er av natur dynamisk (leser URL ved request)
export const dynamic = "force-dynamic";
