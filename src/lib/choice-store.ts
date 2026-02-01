import { create } from 'zustand';

export interface Choice {
  label: string;
  imageUrl: string;
}

interface ChoiceStore {
  choice1: Choice;
  choice2: Choice;
  setChoices: (choice1: Choice, choice2: Choice) => void;
  resetChoices: () => void;
}

const defaultChoice1: Choice = {
  label: 'Chicken',
  imageUrl: 'https://cdn-icons-png.flaticon.com/512/1046/1046751.png',
};

const defaultChoice2: Choice = {
  label: 'Fish',
  imageUrl: 'https://cdn-icons-png.flaticon.com/512/3069/3069186.png',
};

export const useChoiceStore = create<ChoiceStore>((set) => ({
  choice1: defaultChoice1,
  choice2: defaultChoice2,
  setChoices: (choice1, choice2) => set({ choice1, choice2 }),
  resetChoices: () => set({ choice1: defaultChoice1, choice2: defaultChoice2 }),
}));
