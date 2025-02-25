import {
  createContext,
  FC,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePersonalizationStore } from "@/stores/personalization-store";

interface TabContextType {
  tabs: Tab[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export interface Tab {
  id: string;
  name: string;
  icon: ReactNode;
  component: ReactNode;
}

const TabsContext = createContext<TabContextType>({
  tabs: [],
  activeTab: "",
  setActiveTab: () => {},
});

interface TabsProviderProps {
  tabs: Tab[];
  children: ReactNode;
}

export const TabsProvider: FC<TabsProviderProps> = ({ tabs, children }) => {
  const [activeTab, setActiveTab] = useState<string>(tabs[0].id);

  return (
    <TabsContext.Provider value={{ tabs, activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
};

export const useTabs = () => {
  const { currentTab, setCurrentTab } = usePersonalizationStore();
  const { tabs, activeTab, setActiveTab } = useContext(TabsContext);

  useEffect(() => {
    if (activeTab) setCurrentTab(activeTab);
  }, [activeTab, setCurrentTab]);

  useEffect(() => {
    if (activeTab !== currentTab) setActiveTab(currentTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getComponent() {
    return tabs.find((tab) => tab.id === activeTab)?.component;
  }

  return {
    activeTab,
    setActiveTab,
    tabs,
    getComponent,
  };
};
