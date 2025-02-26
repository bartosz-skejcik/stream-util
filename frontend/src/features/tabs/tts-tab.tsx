import {
  MessageList,
  ControlSidebar,
  Statistics,
} from "@/features/stream/docks/tts";

function TtsTab() {
  return (
    <div className="grid grid-cols-7 gap-6 grid-rows-1 h-full">
      <section className="flex-1 flex flex-col col-span-5 gap-4 row-span-1">
        <MessageList />
        <Statistics />
      </section>
      <ControlSidebar className="col-span-2" />
    </div>
  );
}

export default TtsTab;
