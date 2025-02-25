import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface PersonalizationState {
  currentTab: string;
}

interface PersonalizationActions {
  setCurrentTab: (tab: string) => void;
}

type PersonalizationStore = PersonalizationState & PersonalizationActions;

export const usePersonalizationStore = create<PersonalizationStore>()(
  persist(
    (set) => ({
      currentTab: "",
      setCurrentTab: (tab) => {
        set({ currentTab: tab });
      },
    }),
    {
      name: "personalization-storage",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
