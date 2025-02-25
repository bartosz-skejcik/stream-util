import React from "react";
import Poll from "../docks/engagement/poll";

function EngagementTab() {
  return (
    <div className="grid grid-cols-3 gap-6 grid-rows-3 h-full">
      <Poll className="col-span-1 row-span-1" />
    </div>
  );
}

export default EngagementTab;
