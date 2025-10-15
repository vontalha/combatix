import { create } from "zustand";

interface TabBarStore {
	isVisible: boolean;
	setVisible: (visible: boolean) => void;
}

export const useTabBarStore = create<TabBarStore>((set) => ({
	isVisible: true,
	setVisible: (visible) => set({ isVisible: visible }),
}));
