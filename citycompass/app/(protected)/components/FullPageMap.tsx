import dynamic from "next/dynamic";

const FullPageMapClient = dynamic(
  () => import("./FullPageMap.client"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full w-full bg-gray-100">
        <div className="text-gray-500">Loading map...</div>
      </div>
    ),
  }
);

export default function FullPageMap() {
  return <FullPageMapClient />;
}
