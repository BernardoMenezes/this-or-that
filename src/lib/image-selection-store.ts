import { create } from 'zustand';

interface ImageSelection {
  url: string;
  label: string;
}

interface ImageSelectionStore {
  selection: ImageSelection | null;
  setSelectedImage: (url: string, label: string) => void;
  clearSelection: () => void;
}

export const useImageSelectionStore = create<ImageSelectionStore>((set) => ({
  selection: null,
  setSelectedImage: (url, label) => set({ selection: { url, label } }),
  clearSelection: () => set({ selection: null }),
}));
