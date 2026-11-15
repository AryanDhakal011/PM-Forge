import type { Metadata } from "next";
import HotSeat from "@/components/hot-seat/HotSeat";
import { HotSeatPreview } from "@/components/hot-seat/HotSeatPreview";
import { showcaseMode } from "@/lib/product/showcase";
export const metadata: Metadata = {
  title: "Hot Seat — Product decision practice",
};
export default function HotSeatPage() {
  return showcaseMode() ? <HotSeatPreview /> : <HotSeat />;
}
