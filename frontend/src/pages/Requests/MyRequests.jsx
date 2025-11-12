import { useState } from "react";
import RequestForm from "./RequestForm";
import RequestList from "./RequestList";

export default function MyRequests({ userId, token }) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <RequestForm
        userId={userId}
        token={token}
        onCreated={() => setRefreshKey((prev) => prev + 1)}
      />
      <RequestList userId={null} token={token} refreshKey={refreshKey} />
    </div>
  );
}


