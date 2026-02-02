import { create } from 'zustand';

interface SettingsStore {
  numberOfChoices: 2 | 3 | 4;
  setNumberOfChoices: (num: 2 | 3 | 4) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  numberOfChoices: 2,
  setNumberOfChoices: (num) => set({ numberOfChoices: num }),
}));
