import { create } from "zustand";

interface AIInsightsStore {
    isOpen: boolean;
    initialQuery: string | null;
    openWithQuery: (query: string) => void;
    setIsOpen: (isOpen: boolean) => void;
    clearQuery: () => void;
}

export const useAIInsightsStore = create<AIInsightsStore>((set) => ({
    isOpen: false,
    initialQuery: null,
    openWithQuery: (query: string) => set({ isOpen: true, initialQuery: query }),
    setIsOpen: (isOpen: boolean) => set({ isOpen }),
    clearQuery: () => set({ initialQuery: null }),
}));
