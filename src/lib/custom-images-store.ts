import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CustomImage {
  label: string;
  url: string;
  createdAt: number;
  category?: string;
}

interface CustomImagesState {
  images: CustomImage[];
  addImage: (url: string, label: string, category?: string) => void;
  removeImage: (url: string) => void;
  updateImageCategory: (url: string, category: string | undefined) => void;
  clearAll: () => void;
}

export const useCustomImagesStore = create<CustomImagesState>()(
  persist(
    (set) => ({
      images: [],
      addImage: (url, label, category) =>
        set((state) => ({
          images: [
            { url, label, createdAt: Date.now(), category },
            ...state.images.filter((img) => img.url !== url),
          ],
        })),
      removeImage: (url) =>
        set((state) => ({
          images: state.images.filter((img) => img.url !== url),
        })),
      updateImageCategory: (url, category) =>
        set((state) => ({
          images: state.images.map((img) =>
            img.url === url ? { ...img, category } : img
          ),
        })),
      clearAll: () => set({ images: [] }),
    }),
    {
      name: 'custom-images-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
