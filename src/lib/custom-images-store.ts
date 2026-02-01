import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CustomImage {
  label: string;
  url: string;
  createdAt: number;
}

interface CustomImagesState {
  images: CustomImage[];
  addImage: (url: string, label: string) => void;
  removeImage: (url: string) => void;
  clearAll: () => void;
}

export const useCustomImagesStore = create<CustomImagesState>()(
  persist(
    (set) => ({
      images: [],
      addImage: (url, label) =>
        set((state) => ({
          images: [
            { url, label, createdAt: Date.now() },
            ...state.images.filter((img) => img.url !== url),
          ],
        })),
      removeImage: (url) =>
        set((state) => ({
          images: state.images.filter((img) => img.url !== url),
        })),
      clearAll: () => set({ images: [] }),
    }),
    {
      name: 'custom-images-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
