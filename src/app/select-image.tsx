import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform, Modal, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ImageIcon, Camera, X, FolderOpen, Check, Search, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { CATEGORIES, getImagesByCategory, searchImages, type Category, type BundledImage } from '@/lib/bundled-images';
import { useCustomImagesStore, type CustomImage } from '@/lib/custom-images-store';
import { cn } from '@/lib/cn';
import { useImageSelectionStore } from '@/lib/image-selection-store';

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
  onConfirm: (label: string) => void;
  color: string;
}

function LabelInputModal({ visible, imageUri, onClose, onConfirm, color }: LabelInputModalProps) {
  const [label, setLabel] = useState('');
  const inputRef = useRef<TextInput>(null);
  const accentColor = color === 'teal' ? '#14B8A6' : '#F97316';
  const bgColor = color === 'teal' ? '#F0FDFA' : '#FFF7ED';

  useEffect(() => {
    if (visible) {
      setLabel('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible]);

  const handleConfirm = () => {
    if (label.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onConfirm(label.trim());
    }
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
            className="bg-white rounded-3xl overflow-hidden"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="px-5 py-4 border-b border-gray-100">
              <Text className="text-xl font-bold text-slate-800 text-center">
                Name This Choice
              </Text>
            </View>

            <View className="items-center py-6" style={{ backgroundColor: bgColor }}>
              <View
                className="rounded-2xl overflow-hidden items-center justify-center"
                style={{
                  width: 120,
                  height: 120,
                  backgroundColor: '#FFFFFF',
                  borderWidth: 2,
                  borderColor: accentColor,
                }}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: 100, height: 100 }}
                  contentFit="cover"
                />
              </View>
            </View>

            <View className="px-5 py-4">
              <Text className="text-sm font-medium text-slate-500 mb-2">
                What should this be called?
              </Text>
              <TextInput
                ref={inputRef}
                value={label}
                onChangeText={setLabel}
                placeholder="e.g. Apple, Water, Play..."
                placeholderTextColor="#9CA3AF"
                className="bg-gray-50 rounded-xl px-4 py-3 text-lg text-slate-800"
                style={{ borderWidth: 1, borderColor: '#E5E7EB' }}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleConfirm}
              />
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
                disabled={!label.trim()}
                className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
                style={{
                  backgroundColor: label.trim() ? accentColor : '#D1D5DB',
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

type ExtendedCategory = Category | 'Custom';
const ALL_CATEGORIES: ExtendedCategory[] = [...CATEGORIES, 'Custom'];

export default function SelectImageScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ color: string; choiceNumber: string }>();
  const color = params.color || 'teal';
  const choiceNumber = params.choiceNumber || '1';
  const { width } = useWindowDimensions();

  const [selectedCategory, setSelectedCategory] = useState<ExtendedCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<CustomImage | null>(null);
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);

  const customImages = useCustomImagesStore((s) => s.images);
  const removeCustomImage = useCustomImagesStore((s) => s.removeImage);
  const addCustomImage = useCustomImagesStore((s) => s.addImage);
  const setSelectedImage = useImageSelectionStore((s: { setSelectedImage: (url: string, label: string) => void }) => s.setSelectedImage);

  const accentColor = color === 'teal' ? '#14B8A6' : '#F97316';

  // Calculate number of columns based on screen width
  const numColumns = 4;
  const padding = 16;
  const gap = 12;
  const itemWidth = (width - padding * 2 - gap * (numColumns - 1)) / numColumns;

  const { standardImages, extendedImages } = useMemo(() => {
    let images: BundledImage[];
    if (searchQuery.trim()) {
      images = searchImages(searchQuery);
    } else if (selectedCategory === 'Custom') {
      images = [];
    } else {
      images = getImagesByCategory(selectedCategory as Category);
    }

    return {
      standardImages: images.filter((img) => img.isStandard),
      extendedImages: images.filter((img) => !img.isStandard),
    };
  }, [searchQuery, selectedCategory]);

  // Build flat list data for FlashList
  const gridData = useMemo((): GridItem[] => {
    const items: GridItem[] = [];
    const showCustomImagesInGrid = selectedCategory === 'All' || selectedCategory === 'Custom';

    // Custom images section
    if (showCustomImagesInGrid && !searchQuery && customImages.length > 0) {
      if (selectedCategory === 'All') {
        items.push({ type: 'header', title: 'My Images' });
      }
      customImages.forEach((img) => items.push({ type: 'custom', image: img }));
    }

    // Empty state for Custom tab
    if (selectedCategory === 'Custom' && !searchQuery && customImages.length === 0) {
      items.push({ type: 'empty', message: 'No custom images yet.\nUpload from your photo library!' });
      return items;
    }

    // Library images
    if (selectedCategory !== 'Custom' || searchQuery) {
      if (searchQuery && standardImages.length === 0 && extendedImages.length === 0) {
        items.push({ type: 'empty', message: `No icons found for "${searchQuery}"` });
        return items;
      }

      // Standard library
      if (standardImages.length > 0) {
        items.push({ type: 'header', title: searchQuery ? 'Standard Library' : 'Standard' });
        standardImages.forEach((img) => items.push({ type: 'standard', image: img }));
      }

      // Extended library
      if (extendedImages.length > 0) {
        items.push({ type: 'header', title: searchQuery ? 'Extended Library' : 'More Icons' });
        extendedImages.forEach((img) => items.push({ type: 'extended', image: img }));
      }
    }

    return items;
  }, [selectedCategory, searchQuery, customImages, standardImages, extendedImages]);

  const categoriesToShow = customImages.length > 0 ? ALL_CATEGORIES : CATEGORIES;

  const handleSelectImage = useCallback((url: string, label: string) => {
    Haptics.selectionAsync();
    setSelectedImage(url, label);
    router.back();
  }, [setSelectedImage, router]);

  const handleSelectCustomImage = useCallback((img: CustomImage) => {
    handleSelectImage(img.url, img.label);
  }, [handleSelectImage]);

  const handleDeleteCustomImage = useCallback((img: CustomImage) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDeleteConfirm(img);
  }, []);

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
      quality: 0.8,
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
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPendingImageUri(result.assets[0].uri);
      setShowLabelInput(true);
    }
  };

  const handleLabelConfirm = (label: string) => {
    if (pendingImageUri) {
      addCustomImage(pendingImageUri, label);
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
      return (
        <View className="w-full py-2">
          <Text className={cn(
            'text-sm font-semibold',
            item.title === 'More Icons' || item.title === 'Extended Library' ? 'text-slate-400' : 'text-slate-500'
          )}>
            {item.title}
          </Text>
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
              onPress={() => handleDeleteCustomImage(img)}
              className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1"
            >
              <Trash2 size={12} color="white" />
            </Pressable>
          </Pressable>
          <Text className="text-xs text-slate-600 text-center" numberOfLines={1} style={{ width: itemWidth - 8 }}>
            {img.label}
          </Text>
        </View>
      );
    }

    // Standard or Extended image
    const img = item.image;
    const isStandard = item.type === 'standard';
    return (
      <View className="items-center" style={{ width: itemWidth, paddingBottom: 12 }}>
        <Pressable
          onPress={() => handleSelectImage(img.url, img.label)}
        >
          <View
            className="items-center justify-center rounded-2xl mb-1"
            style={{
              width: 72,
              height: 72,
              backgroundColor: '#FFFFFF',
              borderWidth: isStandard ? 2 : 1,
              borderColor: isStandard ? '#14B8A6' : '#E5E7EB',
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
  }, [itemWidth, handleSelectImage, handleSelectCustomImage, handleDeleteCustomImage]);

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
            <Search size={20} color="#9CA3AF" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search icons..."
              placeholderTextColor="#9CA3AF"
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

        {/* Category Tabs */}
        {!searchQuery && (
          <View className="border-b border-gray-200 bg-white">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-3" style={{ flexGrow: 0 }}>
              <View className="flex-row py-2 gap-1">
                {categoriesToShow.map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedCategory(cat);
                    }}
                    className={cn(
                      'px-4 py-2 rounded-full',
                      selectedCategory === cat
                        ? cat === 'Custom' ? 'bg-purple-600' : 'bg-slate-800'
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
                ))}
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
          contentContainerStyle={{ padding: padding }}
          keyboardShouldPersistTaps="handled"
        />

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
          />
        )}
      </SafeAreaView>
    </View>
  );
}
