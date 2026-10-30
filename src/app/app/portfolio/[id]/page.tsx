import { RecordEditor } from "@/components/product/PortfolioViews";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RecordEditor id={id} />;
}
