import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform, Modal, useWindowDimensions, ActivityIndicator, Keyboard } from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ImageIcon, Camera, X, FolderOpen, Check, Search, Trash2, WifiOff, Pencil, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from '@tanstack/react-query';
import { CATEGORIES, getImagesByCategory, searchLocalImages, TOTAL_BUNDLED_COUNT, type Category, type BundledImage } from '@/lib/bundled-images';
import { searchSymboTalkAPI } from '@/lib/symbotalk-api';
import { useCustomImagesStore, type CustomImage } from '@/lib/custom-images-store';
import { cn } from '@/lib/cn';
import { useImageSelectionStore } from '@/lib/image-selection-store';
import { cacheImage } from '@/lib/image-cache';

// Grid item types for FlashList
type GridItem =
  | { type: 'header'; title: string }
  | { type: 'custom'; image: CustomImage }
  | { type: 'standard'; image: BundledImage }
  | { type: 'extended'; image: BundledImage }
  | { type: 'empty'; message: string };

interface DeleteConfirmModalProps {
  visible: boolean;
  imageUri: string;
  imageLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteConfirmModal({ visible, imageUri, imageLabel, onClose, onConfirm }: DeleteConfirmModalProps) {
  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <Pressable
        className="flex-1 bg-black/50 justify-center px-6"
        onPress={onClose}
      >
        <Pressable
          className="bg-white rounded-3xl overflow-hidden"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="px-5 py-4 border-b border-gray-100">
            <Text className="text-xl font-bold text-slate-800 text-center">
              Delete Image?
            </Text>
          </View>

          <View className="items-center py-6 bg-red-50">
            <View
              className="rounded-2xl overflow-hidden items-center justify-center"
              style={{
                width: 100,
                height: 100,
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#EF4444',
              }}
            >
              <Image
                source={{ uri: imageUri }}
                style={{ width: 80, height: 80 }}
                contentFit="cover"
              />
            </View>
            <Text className="text-base font-medium text-slate-700 mt-3">
              {imageLabel}
            </Text>
          </View>

          <View className="px-5 py-4">
            <Text className="text-center text-slate-500">
              This will permanently remove this image from your library.
            </Text>
          </View>

          <View className="flex-row px-5 pb-5 gap-3">
            <Pressable
              onPress={onClose}
              className="flex-1 py-3 rounded-xl bg-gray-100"
            >
              <Text className="text-center font-semibold text-slate-600">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              className="flex-1 flex-row items-center justify-center py-3 rounded-xl bg-red-500"
            >
              <Trash2 size={18} color="white" />
              <Text className="text-center font-semibold text-white ml-1">Delete</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

interface LabelInputModalProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
  onConfirm: (label: string, category: string) => void;
  color: string;
  existingCategories: string[];
}

function LabelInputModal({ visible, imageUri, onClose, onConfirm, color, existingCategories }: LabelInputModalProps) {
  const [label, setLabel] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const labelInputRef = useRef<TextInput>(null);
  const categoryInputRef = useRef<TextInput>(null);
  const accentColor = color === 'teal' ? '#14B8A6' : '#F97316';
  const bgColor = color === 'teal' ? '#F0FDFA' : '#FFF7ED';

  useEffect(() => {
    if (visible) {
      setLabel('');
      setSelectedCategory(undefined);
      setShowNewCategoryInput(false);
      setNewCategoryName('');
      setTimeout(() => labelInputRef.current?.focus(), 100);
    }
  }, [visible]);

  useEffect(() => {
    if (showNewCategoryInput) {
      setTimeout(() => categoryInputRef.current?.focus(), 100);
    }
  }, [showNewCategoryInput]);

  const handleConfirm = () => {
    const finalCategory = showNewCategoryInput && newCategoryName.trim()
      ? newCategoryName.trim()
      : selectedCategory;

    if (label.trim() && finalCategory) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onConfirm(label.trim(), finalCategory);
    }
  };

  const handleSelectCategory = (cat: string) => {
    Haptics.selectionAsync();
    setSelectedCategory(cat);
    setShowNewCategoryInput(false);
  };

  const handleAddNewCategory = () => {
    Haptics.selectionAsync();
    setShowNewCategoryInput(true);
    setSelectedCategory(undefined);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center px-6"
          onPress={onClose}
        >
          <Pressable
            className="bg-white rounded-3xl overflow-hidden max-h-[85%]"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="px-5 py-4 border-b border-gray-100">
              <Text className="text-xl font-bold text-slate-800 text-center">
                Name This Choice
              </Text>
            </View>

            <ScrollView style={{ flexGrow: 0 }}>
              <View className="items-center py-4" style={{ backgroundColor: bgColor }}>
                <View
                  className="rounded-2xl overflow-hidden items-center justify-center"
                  style={{
                    width: 100,
                    height: 100,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 2,
                    borderColor: accentColor,
                  }}
                >
                  <Image
                    source={{ uri: imageUri }}
                    style={{ width: 88, height: 88 }}
                    contentFit="cover"
                  />
                </View>
              </View>

              <View className="px-5 py-4">
                <Text className="text-sm font-medium text-slate-500 mb-2">
                  What should this be called?
                </Text>
                <TextInput
                  ref={labelInputRef}
                  value={label}
                  onChangeText={setLabel}
                  placeholder="e.g. Apple, Water, Play..."
                  placeholderTextColor="#9CA3AF"
                  className="bg-gray-50 rounded-xl px-4 py-3 text-lg text-slate-800"
                  style={{ borderWidth: 1, borderColor: '#E5E7EB' }}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>

              <View className="px-5 pb-4">
                <Text className="text-sm font-medium text-slate-500 mb-3">
                  Category
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {existingCategories.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => handleSelectCategory(cat)}
                      className={cn(
                        'px-3 py-2 rounded-full border',
                        selectedCategory === cat && !showNewCategoryInput
                          ? 'bg-purple-600 border-purple-600'
                          : 'bg-white border-gray-200'
                      )}
                    >
                      <Text
                        className={cn(
                          'font-medium text-sm',
                          selectedCategory === cat && !showNewCategoryInput
                            ? 'text-white'
                            : 'text-slate-600'
                        )}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                  <Pressable
                    onPress={handleAddNewCategory}
                    className={cn(
                      'px-3 py-2 rounded-full border flex-row items-center',
                      showNewCategoryInput
                        ? 'bg-purple-600 border-purple-600'
                        : 'bg-white border-dashed border-gray-300'
                    )}
                  >
                    <Plus size={14} color={showNewCategoryInput ? '#FFFFFF' : '#9CA3AF'} />
                    <Text
                      className={cn(
                        'font-medium text-sm ml-1',
                        showNewCategoryInput ? 'text-white' : 'text-gray-400'
                      )}
                    >
                      New
                    </Text>
                  </Pressable>
                </View>

                {showNewCategoryInput && (
                  <View className="mt-3">
                    <TextInput
                      ref={categoryInputRef}
                      value={newCategoryName}
                      onChangeText={setNewCategoryName}
                      placeholder="Enter category name..."
                      placeholderTextColor="#9CA3AF"
                      className="bg-gray-50 rounded-xl px-4 py-3 text-base text-slate-800"
                      style={{ borderWidth: 1, borderColor: '#A855F7' }}
                      autoCapitalize="words"
                      returnKeyType="done"
                      onSubmitEditing={handleConfirm}
                    />
                  </View>
                )}
              </View>
            </ScrollView>

            <View className="flex-row px-5 pb-5 pt-3 gap-3 border-t border-gray-100">
              <Pressable
                onPress={onClose}
                className="flex-1 py-3 rounded-xl bg-gray-100"
              >
                <Text className="text-center font-semibold text-slate-600">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirm}
                disabled={!label.trim() || (!selectedCategory && !(showNewCategoryInput && newCategoryName.trim()))}
                className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
                style={{
                  backgroundColor: (label.trim() && (selectedCategory || (showNewCategoryInput && newCategoryName.trim()))) ? accentColor : '#D1D5DB',
                }}
              >
                <Check size={18} color="white" />
                <Text className="text-center font-semibold text-white ml-1">Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface CategoryEditorModalProps {
  visible: boolean;
  image: CustomImage | null;
  existingCategories: string[];
  onClose: () => void;
  onSave: (category: string | undefined) => void;
}

function CategoryEditorModal({ visible, image, existingCategories, onClose, onSave }: CategoryEditorModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible && image) {
      setSelectedCategory(image.category);
      setShowNewCategoryInput(false);
      setNewCategoryName('');
    }
  }, [visible, image]);

  useEffect(() => {
    if (showNewCategoryInput) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showNewCategoryInput]);

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (showNewCategoryInput && newCategoryName.trim()) {
      onSave(newCategoryName.trim());
    } else {
      onSave(selectedCategory);
    }
  };

  const handleSelectCategory = (cat: string) => {
    Haptics.selectionAsync();
    setSelectedCategory(cat);
    setShowNewCategoryInput(false);
  };

  const handleAddNew = () => {
    Haptics.selectionAsync();
    setShowNewCategoryInput(true);
    setSelectedCategory(undefined);
  };

  if (!image) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center px-6"
          onPress={onClose}
        >
          <Pressable
            className="bg-white rounded-3xl overflow-hidden max-h-[80%]"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="px-5 py-4 border-b border-gray-100">
              <Text className="text-xl font-bold text-slate-800 text-center">
                Edit Category
              </Text>
            </View>

            <View className="items-center py-4 bg-purple-50">
              <View
                className="rounded-2xl overflow-hidden items-center justify-center"
                style={{
                  width: 80,
                  height: 80,
                  backgroundColor: '#FFFFFF',
                  borderWidth: 2,
                  borderColor: '#A855F7',
                }}
              >
                <Image
                  source={{ uri: image.url }}
                  style={{ width: 72, height: 72 }}
                  contentFit="cover"
                />
              </View>
              <Text className="text-base font-medium text-slate-700 mt-2">
                {image.label}
              </Text>
              {image.category && (
                <Text className="text-sm text-purple-600 mt-1">
                  Current: {image.category}
                </Text>
              )}
            </View>

            <ScrollView className="max-h-64" style={{ flexGrow: 0 }}>
              <View className="px-5 py-4">
                <Text className="text-sm font-medium text-slate-500 mb-3">
                  Select a category
                </Text>

                <View className="flex-row flex-wrap gap-2">
                  {existingCategories.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => handleSelectCategory(cat)}
                      className={cn(
                        'px-4 py-2 rounded-full border',
                        selectedCategory === cat && !showNewCategoryInput
                          ? 'bg-purple-600 border-purple-600'
                          : 'bg-white border-gray-200'
                      )}
                    >
                      <Text
                        className={cn(
                          'font-medium',
                          selectedCategory === cat && !showNewCategoryInput
                            ? 'text-white'
                            : 'text-slate-600'
                        )}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  ))}

                  <Pressable
                    onPress={handleAddNew}
                    className={cn(
                      'px-4 py-2 rounded-full border flex-row items-center',
                      showNewCategoryInput
                        ? 'bg-purple-600 border-purple-600'
                        : 'bg-white border-dashed border-gray-300'
                    )}
                  >
                    <Plus size={16} color={showNewCategoryInput ? '#FFFFFF' : '#9CA3AF'} />
                    <Text
                      className={cn(
                        'font-medium ml-1',
                        showNewCategoryInput ? 'text-white' : 'text-gray-400'
                      )}
                    >
                      New
                    </Text>
                  </Pressable>
                </View>

                {showNewCategoryInput && (
                  <View className="mt-4">
                    <TextInput
                      ref={inputRef}
                      value={newCategoryName}
                      onChangeText={setNewCategoryName}
                      placeholder="Enter new category name..."
                      placeholderTextColor="#9CA3AF"
                      className="bg-gray-50 rounded-xl px-4 py-3 text-base text-slate-800"
                      style={{ borderWidth: 1, borderColor: '#A855F7' }}
                      autoCapitalize="words"
                      returnKeyType="done"
                      onSubmitEditing={handleSave}
                    />
                  </View>
                )}
              </View>
            </ScrollView>

            <View className="flex-row px-5 pb-5 pt-2 gap-3 border-t border-gray-100">
              <Pressable
                onPress={onClose}
                className="flex-1 py-3 rounded-xl bg-gray-100"
              >
                <Text className="text-center font-semibold text-slate-600">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                disabled={showNewCategoryInput && !newCategoryName.trim()}
                className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
                style={{
                  backgroundColor: (showNewCategoryInput && !newCategoryName.trim()) ? '#D1D5DB' : '#A855F7',
                }}
              >
                <Check size={18} color="white" />
                <Text className="text-center font-semibold text-white ml-1">Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function SelectImageScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ color: string; choiceNumber: string }>();
  const color = params.color || 'teal';
  const choiceNumber = params.choiceNumber || '1';
  const { width } = useWindowDimensions();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<CustomImage | null>(null);
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);

  const customImages = useCustomImagesStore((s) => s.images);
  const removeCustomImage = useCustomImagesStore((s) => s.removeImage);
  const addCustomImage = useCustomImagesStore((s) => s.addImage);
  const updateImageCategory = useCustomImagesStore((s) => s.updateImageCategory);
  const setSelectedImage = useImageSelectionStore((s: { setSelectedImage: (url: string, label: string) => void }) => s.setSelectedImage);

  // Default suggested categories for custom images
  const DEFAULT_CATEGORIES = ['Food', 'Drinks', 'Activities', 'Places', 'People', 'Things'];

  // Get unique categories from custom images, merged with defaults
  const customCategories = useMemo(() => {
    const cats = new Set<string>(DEFAULT_CATEGORIES);
    customImages.forEach((img) => {
      if (img.category) cats.add(img.category);
    });
    return Array.from(cats).sort();
  }, [customImages]);

  const [categoryEditImage, setCategoryEditImage] = useState<CustomImage | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Track keyboard height for proper scrolling
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const accentColor = color === 'teal' ? '#14B8A6' : '#F97316';

  // Calculate number of columns based on screen width
  const numColumns = 4;
  const padding = 16;
  const gap = 12;
  const itemWidth = (width - padding * 2 - gap * (numColumns - 1)) / numColumns;

  // Local search for bundled library (850 icons - works offline)
  const bundledImages = useMemo(() => {
    if (searchQuery.trim()) {
      return searchLocalImages(searchQuery);
    } else if (selectedCategory === null || selectedCategory === 'Custom') {
      return [];
    } else {
      return getImagesByCategory(selectedCategory as Category);
    }
  }, [searchQuery, selectedCategory]);

  // Split bundled results into standard and extended for display
  const { standardImages, extendedBundled } = useMemo(() => {
    const standard = bundledImages.filter((img) => img.isStandard);
    const extended = bundledImages.filter((img) => !img.isStandard);
    return { standardImages: standard, extendedBundled: extended };
  }, [bundledImages]);

  // API search for additional icons (only when searching and bundled doesn't have enough)
  // Only fetch from API if we have fewer than 20 bundled results
  const shouldSearchAPI = searchQuery.trim().length >= 2 && bundledImages.length < 20;
  const { data: apiResults = [], isLoading: isSearchingAPI } = useQuery({
    queryKey: ['symbotalk-search', searchQuery],
    queryFn: async () => {
      const results = await searchSymboTalkAPI(searchQuery, 30);
      // Filter out any results we already have in bundled
      const bundledLabels = new Set(bundledImages.map((img) => img.label.toLowerCase()));
      return results.filter((r) => !bundledLabels.has(r.label.toLowerCase()));
    },
    enabled: shouldSearchAPI,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Build flat list data for FlashList
  const gridData = useMemo((): GridItem[] => {
    const items: GridItem[] = [];

    // If no category selected and no search, return empty (show category picker instead)
    if (selectedCategory === null && !searchQuery) {
      return items;
    }

    // Check if this is a custom category (from user's custom images, not bundled library)
    const isCustomCategory = customCategories.includes(selectedCategory as string) &&
      !CATEGORIES.includes(selectedCategory as Category);

    // Filter custom images by category
    const filteredCustomImages = customImages.filter((img) => {
      return img.category === selectedCategory;
    });

    // Custom images section - show if any match the selected category
    if (!searchQuery && filteredCustomImages.length > 0) {
      filteredCustomImages.forEach((img) => items.push({ type: 'custom', image: img }));
    }

    // For custom-only categories, don't show library images
    if (isCustomCategory && !searchQuery) {
      if (filteredCustomImages.length === 0) {
        items.push({ type: 'empty', message: `No images in "${selectedCategory}"` });
      }
      return items;
    }

    // Library images (show for search or when browsing bundled categories)
    if (searchQuery || (selectedCategory !== null)) {
      const hasResults = standardImages.length > 0 || extendedBundled.length > 0 || apiResults.length > 0;

      if (searchQuery && !hasResults && !isSearchingAPI) {
        items.push({ type: 'empty', message: `No icons found for "${searchQuery}"` });
        return items;
      }

      // Standard library (original 102 curated items)
      if (standardImages.length > 0) {
        const headerTitle = searchQuery
          ? `Standard Library (${standardImages.length})`
          : 'Standard';
        items.push({ type: 'header', title: headerTitle });
        standardImages.forEach((img) => items.push({ type: 'standard', image: img }));
      }

      // Extended bundled library (748 additional offline icons)
      if (searchQuery && extendedBundled.length > 0) {
        items.push({ type: 'header', title: `Offline Library (${extendedBundled.length})` });
        extendedBundled.forEach((img) => items.push({ type: 'extended', image: img }));
      }

      // API results (additional online-only icons from SymboTalk)
      if (searchQuery && apiResults.length > 0) {
        items.push({ type: 'header', title: `Online (${apiResults.length})` });
        apiResults.forEach((img) => items.push({ type: 'extended', image: img }));
      }
    }

    return items;
  }, [selectedCategory, searchQuery, customImages, customCategories, standardImages, extendedBundled, apiResults, isSearchingAPI]);

  // Build category list (without "All") for category picker and tabs
  const categoriesToShow = useMemo(() => {
    // Start with bundled categories, excluding "All"
    const tabs: string[] = CATEGORIES.filter(cat => cat !== 'All');

    // Add custom image categories that aren't already in bundled categories
    customCategories.forEach((cat) => {
      if (!CATEGORIES.includes(cat as Category)) {
        tabs.push(cat);
      }
    });

    return tabs;
  }, [customCategories]);

  const handleSelectImage = useCallback((url: string, label: string, shouldCache: boolean = false) => {
    Haptics.selectionAsync();
    setSelectedImage(url, label);

    // Cache API results in the background for future offline access
    if (shouldCache) {
      cacheImage(url).catch(() => {
        // Silently fail caching - the image will still work online
      });
    }

    router.back();
  }, [setSelectedImage, router]);

  const handleSelectCustomImage = useCallback((img: CustomImage) => {
    handleSelectImage(img.url, img.label);
  }, [handleSelectImage]);

  const handleDeleteCustomImage = useCallback((img: CustomImage) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDeleteConfirm(img);
  }, []);

  const handleEditCategory = useCallback((img: CustomImage) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCategoryEditImage(img);
  }, []);

  const handleSaveCategory = useCallback((category: string | undefined) => {
    if (categoryEditImage) {
      updateImageCategory(categoryEditImage.url, category);
      setCategoryEditImage(null);
    }
  }, [categoryEditImage, updateImageCategory]);

  const confirmDelete = () => {
    if (deleteConfirm) {
      removeCustomImage(deleteConfirm.url);
      setDeleteConfirm(null);
    }
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setPendingImageUri(result.assets[0].uri);
      setShowLabelInput(true);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setPendingImageUri(result.assets[0].uri);
      setShowLabelInput(true);
    }
  };

  const handleLabelConfirm = (label: string, category: string) => {
    if (pendingImageUri) {
      addCustomImage(pendingImageUri, label, category);
      setSelectedImage(pendingImageUri, label);
      setShowLabelInput(false);
      setPendingImageUri(null);
      router.back();
    }
  };

  const handleLabelCancel = () => {
    setShowLabelInput(false);
    setPendingImageUri(null);
  };

  // Render item for FlashList
  const renderItem = useCallback(({ item }: { item: GridItem }) => {
    if (item.type === 'header') {
      const isOnlineSection = item.title.startsWith('Online');
      return (
        <View className="w-full py-2 flex-row items-center">
          <Text className={cn(
            'text-sm font-semibold',
            isOnlineSection ? 'text-blue-500' : 'text-slate-500'
          )}>
            {item.title}
          </Text>
          {isOnlineSection && (
            <WifiOff size={12} color="#3B82F6" style={{ marginLeft: 4, opacity: 0.7 }} />
          )}
        </View>
      );
    }

    if (item.type === 'empty') {
      return (
        <View className="w-full items-center py-8">
          {item.message.includes('No icons') ? (
            <Search size={48} color="#D1D5DB" />
          ) : (
            <ImageIcon size={48} color="#D1D5DB" />
          )}
          <Text className="text-gray-400 mt-3 text-center">
            {item.message}
          </Text>
        </View>
      );
    }

    if (item.type === 'custom') {
      const img = item.image;
      return (
        <View className="items-center" style={{ width: itemWidth, paddingBottom: 12 }}>
          <Pressable
            onPress={() => handleSelectCustomImage(img)}
            onLongPress={() => handleDeleteCustomImage(img)}
            className="relative"
          >
            <View
              className="items-center justify-center rounded-2xl mb-1 overflow-hidden"
              style={{
                width: 72,
                height: 72,
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#A855F7',
              }}
            >
              <Image source={{ uri: img.url }} style={{ width: 68, height: 68 }} contentFit="cover" cachePolicy="memory-disk" />
            </View>
            <Pressable
              onPress={() => handleEditCategory(img)}
              className="absolute -top-1 -left-1 bg-purple-500 rounded-full p-1"
            >
              <Pencil size={12} color="white" />
            </Pressable>
            <Pressable
              onPress={() => handleDeleteCustomImage(img)}
              className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1"
            >
              <Trash2 size={12} color="white" />
            </Pressable>
          </Pressable>
          <Text className="text-xs text-slate-600 text-center" numberOfLines={1} style={{ width: itemWidth - 8 }}>
            {img.label}
          </Text>
          {img.category && (
            <Text className="text-[10px] text-purple-500 text-center" numberOfLines={1} style={{ width: itemWidth - 8 }}>
              {img.category}
            </Text>
          )}
        </View>
      );
    }

    // Standard or Extended image
    const img = item.image;
    const isStandard = item.type === 'standard';
    // Check if this is from the bundled library (has isStandard property) vs API result
    const isBundled = 'isStandard' in img;
    const shouldCacheOnSelect = !isBundled; // Cache API results when selected

    return (
      <View className="items-center" style={{ width: itemWidth, paddingBottom: 12 }}>
        <Pressable
          onPress={() => handleSelectImage(img.url, img.label, shouldCacheOnSelect)}
        >
          <View
            className="items-center justify-center rounded-2xl mb-1"
            style={{
              width: 72,
              height: 72,
              backgroundColor: '#FFFFFF',
              borderWidth: isStandard ? 2 : isBundled ? 1.5 : 1,
              borderColor: isStandard ? '#14B8A6' : isBundled ? '#6366F1' : '#E5E7EB',
            }}
          >
            <Image source={{ uri: img.url }} style={{ width: 52, height: 52 }} contentFit="contain" cachePolicy="memory-disk" />
          </View>
          <Text className="text-xs text-slate-600 text-center" numberOfLines={1} style={{ width: itemWidth - 8 }}>
            {img.label}
          </Text>
        </Pressable>
      </View>
    );
  }, [itemWidth, handleSelectImage, handleSelectCustomImage, handleDeleteCustomImage, handleEditCategory]);

  const getItemType = useCallback((item: GridItem) => item.type, []);

  // Make headers and empty states span full width
  const overrideItemLayout = useCallback((layout: { span?: number }, item: GridItem) => {
    if (item.type === 'header' || item.type === 'empty') {
      layout.span = numColumns;
    }
  }, [numColumns]);

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-gray-200 bg-white">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} color="#334155" />
          </Pressable>
          <Text className="flex-1 text-xl font-bold text-slate-800 ml-2">
            Choose Image for Choice {choiceNumber}
          </Text>
        </View>

        {/* Search Bar */}
        <View className="px-5 py-3 bg-white">
          <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2">
            {isSearchingAPI ? (
              <ActivityIndicator size="small" color="#9CA3AF" />
            ) : (
              <Search size={20} color="#9CA3AF" />
            )}
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={`Search ${TOTAL_BUNDLED_COUNT}+ icons...`}
              placeholderTextColor="#9CA3AF"
              cursorColor="#334155"
              selectionColor="#14B8A6"
              className="flex-1 ml-2 text-base text-slate-800"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={18} color="#9CA3AF" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Upload Options */}
        <View className="flex-row px-5 py-3 gap-3">
          <Pressable
            onPress={pickFromLibrary}
            className="flex-1 flex-row items-center justify-center py-3 bg-white rounded-xl border border-gray-200"
            style={{ gap: 8 }}
          >
            <FolderOpen size={20} color={accentColor} />
            <Text className="font-semibold" style={{ color: accentColor }}>Photo Library</Text>
          </Pressable>
          <Pressable
            onPress={takePhoto}
            className="flex-1 flex-row items-center justify-center py-3 bg-white rounded-xl border border-gray-200"
            style={{ gap: 8 }}
          >
            <Camera size={20} color={accentColor} />
            <Text className="font-semibold" style={{ color: accentColor }}>Take Photo</Text>
          </Pressable>
        </View>

        {/* Category Picker or Image Grid */}
        {selectedCategory === null && !searchQuery ? (
          /* Category Picker View */
          <ScrollView className="flex-1 px-4 py-4">
            <Text className="text-lg font-semibold text-slate-700 mb-4">
              Select a Category
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {categoriesToShow.map((cat) => {
                const isCustomCat = cat === 'Custom' || (!CATEGORIES.includes(cat as Category) && customCategories.includes(cat));
                return (
                  <Pressable
                    key={cat}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedCategory(cat);
                    }}
                    className={cn(
                      'px-5 py-3 rounded-2xl border-2',
                      isCustomCat
                        ? 'bg-purple-50 border-purple-200'
                        : 'bg-white border-gray-200'
                    )}
                  >
                    <Text
                      className={cn(
                        'font-semibold text-base',
                        isCustomCat ? 'text-purple-600' : 'text-slate-700'
                      )}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          <>
            {/* Category Tabs - show when category selected */}
            {!searchQuery && selectedCategory !== null && (
              <View className="border-b border-gray-200 bg-white">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-3" style={{ flexGrow: 0 }}>
                  <View className="flex-row py-2 gap-1">
                    {/* Back to categories button */}
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedCategory(null);
                      }}
                      className="px-3 py-2 rounded-full bg-gray-100 mr-1"
                    >
                      <ArrowLeft size={18} color="#64748B" />
                    </Pressable>
                    {categoriesToShow.map((cat) => {
                      const isCustomCat = cat === 'Custom' || (!CATEGORIES.includes(cat as Category) && customCategories.includes(cat));
                      return (
                        <Pressable
                          key={cat}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setSelectedCategory(cat);
                          }}
                          className={cn(
                            'px-4 py-2 rounded-full',
                            selectedCategory === cat
                              ? isCustomCat ? 'bg-purple-600' : 'bg-slate-800'
                              : 'bg-gray-100'
                          )}
                        >
                          <Text
                            className={cn(
                              'font-medium',
                              selectedCategory === cat ? 'text-white' : 'text-slate-600'
                            )}
                          >
                            {cat}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Image Grid - Virtualized */}
            <FlashList
              data={gridData}
              renderItem={renderItem}
              keyExtractor={(item, index) => {
                if (item.type === 'header') return `header-${item.title}-${index}`;
                if (item.type === 'empty') return `empty-${index}`;
                if (item.type === 'custom') return `custom-${item.image.url}`;
                return `${item.type}-${item.image.id}-${index}`;
              }}
              getItemType={getItemType}
              overrideItemLayout={overrideItemLayout}
              estimatedItemSize={96}
              numColumns={numColumns}
              contentContainerStyle={{ padding: padding, paddingBottom: padding + keyboardHeight }}
              keyboardShouldPersistTaps="handled"
            />
          </>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <DeleteConfirmModal
            visible={!!deleteConfirm}
            imageUri={deleteConfirm.url}
            imageLabel={deleteConfirm.label}
            onClose={() => setDeleteConfirm(null)}
            onConfirm={confirmDelete}
          />
        )}

        {/* Label Input Modal */}
        {showLabelInput && pendingImageUri && (
          <LabelInputModal
            visible={showLabelInput}
            imageUri={pendingImageUri}
            onClose={handleLabelCancel}
            onConfirm={handleLabelConfirm}
            color={color}
            existingCategories={customCategories}
          />
        )}

        {/* Category Editor Modal */}
        <CategoryEditorModal
          visible={!!categoryEditImage}
          image={categoryEditImage}
          existingCategories={customCategories}
          onClose={() => setCategoryEditImage(null)}
          onSave={handleSaveCategory}
        />
      </SafeAreaView>
    </View>
  );
}
