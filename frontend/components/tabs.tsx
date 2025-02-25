import { useTabs } from "@/context/tabs-context";

function Tabs() {
  const { getComponent } = useTabs();

  return <div className="col-span-19 row-span-1 h-full">{getComponent()}</div>;
}

export default Tabs;
