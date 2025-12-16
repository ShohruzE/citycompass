// "use client";

import { Suspense } from "react";
import DashboardContent from "../components/DashboardContent";

export default function DashboardPage() {

  return (

    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    }>

      <DashboardContent />

    </Suspense>
  );
}
