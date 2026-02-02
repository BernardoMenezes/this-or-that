import { create } from 'zustand';

export interface Choice {
  label: string;
  imageUrl: string;
}

interface ChoiceStore {
  choice1: Choice;
  choice2: Choice;
  choice3: Choice;
  choice4: Choice;
  setChoice: (index: 1 | 2 | 3 | 4, choice: Choice) => void;
  setChoices: (choice1: Choice, choice2: Choice) => void;
  resetChoices: () => void;
}

const defaultChoice1: Choice = {
  label: 'Chicken Nuggets',
  imageUrl: 'https://raw.githubusercontent.com/BernardoMenezes/this-or-that-assets/main/default-library/food/chicken_nuggets.svg',
};

const defaultChoice2: Choice = {
  label: 'Cookie',
  imageUrl: 'https://raw.githubusercontent.com/BernardoMenezes/this-or-that-assets/main/default-library/food/cookie.svg',
};

const defaultChoice3: Choice = {
  label: 'Pizza',
  imageUrl: 'https://raw.githubusercontent.com/BernardoMenezes/this-or-that-assets/main/default-library/food/pizza.svg',
};

const defaultChoice4: Choice = {
  label: 'Ice Cream',
  imageUrl: 'https://raw.githubusercontent.com/BernardoMenezes/this-or-that-assets/main/default-library/food/ice_cream.svg',
};

export const useChoiceStore = create<ChoiceStore>((set) => ({
  choice1: defaultChoice1,
  choice2: defaultChoice2,
  choice3: defaultChoice3,
  choice4: defaultChoice4,
  setChoice: (index, choice) => set({ [`choice${index}`]: choice }),
  setChoices: (choice1, choice2) => set({ choice1, choice2 }),
  resetChoices: () => set({
    choice1: defaultChoice1,
    choice2: defaultChoice2,
    choice3: defaultChoice3,
    choice4: defaultChoice4,
  }),
}));
