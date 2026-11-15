import type { Metadata } from "next";
import HotSeat from "@/components/hot-seat/HotSeat";
export const metadata: Metadata = {
  title: "Hot Seat — Product decision practice",
};
export default function HotSeatPage() {
  return <HotSeat />;
}
