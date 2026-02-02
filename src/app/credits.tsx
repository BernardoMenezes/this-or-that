import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Linking, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ExternalLink, Heart, Settings, Share2, Download, Check, X, ImageIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import { useSettingsStore } from '@/lib/settings-store';
import { useCustomImagesStore } from '@/lib/custom-images-store';
import { exportCustomImages, importFromFile } from '@/lib/share-images';
import { cn } from '@/lib/cn';

export default function CreditsScreen() {
  const router = useRouter();
  const numberOfChoices = useSettingsStore((s) => s.numberOfChoices);
  const setNumberOfChoices = useSettingsStore((s) => s.setNumberOfChoices);
  const customImages = useCustomImagesStore((s) => s.images);
  const addImage = useCustomImagesStore((s) => s.addImage);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; count: number } | null>(null);

  const openLink = (url: string) => {
    Haptics.selectionAsync();
    Linking.openURL(url);
  };

  const handleChoiceSelect = (num: 2 | 3 | 4) => {
    Haptics.selectionAsync();
    setNumberOfChoices(num);
  };

  const handleExport = async () => {
    if (customImages.length === 0) {
      Alert.alert(
        'No Custom Images',
        'You need to add some custom images first before you can share them.',
        [{ text: 'OK' }]
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsExporting(true);

    try {
      const success = await exportCustomImages(customImages);
      if (!success) {
        Alert.alert('Export Failed', 'Unable to share images. Please try again.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      setIsImporting(true);
      const fileUri = result.assets[0].uri;
      const images = await importFromFile(fileUri);

      if (!images || images.length === 0) {
        Alert.alert(
          'Invalid File',
          'This file does not contain valid image data. Make sure you selected a file exported from Choice Helper.',
          [{ text: 'OK' }]
        );
        setIsImporting(false);
        return;
      }

      // Add all imported images
      let addedCount = 0;
      for (const img of images) {
        // Check if image with same label already exists (since URLs will be different for imported files)
        const exists = customImages.some(
          (existing) => existing.label.toLowerCase() === img.label.toLowerCase()
        );
        if (!exists) {
          addImage(img.url, img.label);
          addedCount++;
        }
      }

      setImportResult({ success: true, count: addedCount });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Import Failed', 'Unable to import images. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-gray-200 bg-white">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} color="#334155" />
          </Pressable>
          <Text className="flex-1 text-xl font-bold text-slate-800 ml-2">
            Settings
          </Text>
        </View>

        <ScrollView className="flex-1 px-5 py-6">
          {/* Settings Card */}
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
            <View className="flex-row items-center mb-4">
              <Settings size={24} color="#6366F1" />
              <Text className="text-xl font-bold text-slate-800 ml-2">
                Options
              </Text>
            </View>

            <Text className="text-base text-slate-600 mb-3">
              Number of choices
            </Text>

            <View className="flex-row gap-3">
              {([2, 3, 4] as const).map((num) => (
                <Pressable
                  key={num}
                  onPress={() => handleChoiceSelect(num)}
                  className={cn(
                    'flex-1 py-4 rounded-xl items-center justify-center border-2',
                    numberOfChoices === num
                      ? 'bg-indigo-100 border-indigo-500'
                      : 'bg-slate-50 border-slate-200'
                  )}
                >
                  <Text
                    className={cn(
                      'text-2xl font-bold',
                      numberOfChoices === num ? 'text-indigo-600' : 'text-slate-500'
                    )}
                  >
                    {num}
                  </Text>
                  {num === 2 && (
                    <Text className="text-xs text-slate-400 mt-1">default</Text>
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          {/* Share Custom Images Card */}
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
            <View className="flex-row items-center mb-4">
              <ImageIcon size={24} color="#8B5CF6" />
              <Text className="text-xl font-bold text-slate-800 ml-2">
                Custom Images
              </Text>
            </View>

            <Text className="text-base text-slate-600 mb-4">
              Share your custom images with family members so they don't have to upload them again.
            </Text>

            <View className="gap-3">
              <Pressable
                onPress={handleExport}
                disabled={isExporting}
                className="flex-row items-center justify-center py-4 rounded-xl bg-violet-500"
                style={{
                  opacity: isExporting ? 0.7 : 1,
                }}
              >
                {isExporting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Share2 size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">
                      Share Custom Images ({customImages.length})
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={handleImport}
                disabled={isImporting}
                className="flex-row items-center justify-center py-4 rounded-xl bg-slate-100 border border-slate-200"
                style={{
                  opacity: isImporting ? 0.7 : 1,
                }}
              >
                {isImporting ? (
                  <ActivityIndicator color="#64748B" size="small" />
                ) : (
                  <>
                    <Download size={20} color="#64748B" />
                    <Text className="text-slate-600 font-semibold ml-2">
                      Import Shared Images
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

            {customImages.length === 0 && (
              <View className="bg-slate-50 rounded-xl p-4 mt-4">
                <Text className="text-sm text-slate-500 text-center">
                  Add custom images from the home screen to share them with others.
                </Text>
              </View>
            )}
          </View>

          {/* App Credits Card */}
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
            <View className="flex-row items-center mb-4">
              <Heart size={24} color="#14B8A6" />
              <Text className="text-xl font-bold text-slate-800 ml-2">
                About This App
              </Text>
            </View>

            <Text className="text-base text-slate-600 leading-6 mb-4">
              Choice Helper was created to help users of AAC devices make choices more easily.
            </Text>

            <View className="bg-slate-50 rounded-xl p-4 mb-4">
              <Text className="text-base font-semibold text-slate-700 mb-2">
                Created by Bernardo Menezes
              </Text>
              <Text className="text-sm text-slate-500 mb-3">
                Released under MIT License
              </Text>
              <Text className="text-xs text-slate-400">
                Copyright (c) 2026 Bernardo Menezes
              </Text>
            </View>
          </View>

          {/* Symbol Credits Card */}
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
            <View className="flex-row items-center mb-4">
              <Heart size={24} color="#EC4899" />
              <Text className="text-xl font-bold text-slate-800 ml-2">
                Pictogram Credits
              </Text>
            </View>

            <Text className="text-base text-slate-600 leading-6 mb-4">
              This app uses pictographic symbols from the ARASAAC collection.
            </Text>

            <View className="bg-slate-50 rounded-xl p-4 mb-4">
              <Text className="text-base font-semibold text-slate-700 mb-2">
                ARASAAC
              </Text>
              <Text className="text-sm text-slate-500 mb-1">
                Aragonese Centre for Augmentative{'\n'}and Alternative Communication
              </Text>
              <Text className="text-sm text-slate-500 mb-1">
                Author: Sergio Palao
              </Text>
              <Text className="text-sm text-slate-500 mb-1">
                Origin: Government of Aragon (Spain)
              </Text>
              <Text className="text-sm text-slate-500 mb-3">
                Licensed under Creative Commons{'\n'}BY-NC-SA 4.0 International
              </Text>

              <Pressable
                onPress={() => openLink('https://arasaac.org')}
                className="flex-row items-center"
              >
                <Text className="text-teal-600 font-medium">
                  arasaac.org
                </Text>
                <ExternalLink size={16} color="#0D9488" style={{ marginLeft: 4 }} />
              </Pressable>
            </View>

            <View className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <Text className="text-sm text-amber-800 leading-5">
                Pictographic symbols are free to use with attribution for non-commercial purposes. If you create derivative works, they must be shared under the same license.
              </Text>
            </View>
          </View>

          {/* License Link */}
          <Pressable
            onPress={() => openLink('https://creativecommons.org/licenses/by-nc-sa/4.0/')}
            className="bg-white rounded-2xl p-4 flex-row items-center justify-between shadow-sm"
          >
            <View className="flex-1">
              <Text className="text-base font-medium text-slate-700">
                View Full License
              </Text>
              <Text className="text-sm text-slate-500 mt-1">
                CC BY-NC-SA 4.0 International
              </Text>
            </View>
            <ExternalLink size={20} color="#64748B" />
          </Pressable>
        </ScrollView>

        {/* Import Success Modal */}
        <Modal visible={importResult !== null} animationType="fade" transparent>
          <Pressable
            className="flex-1 bg-black/50 justify-center px-6"
            onPress={() => setImportResult(null)}
          >
            <View className="bg-white rounded-3xl overflow-hidden">
              <View className="items-center py-8 px-6">
                <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-4">
                  <Check size={32} color="#22C55E" />
                </View>
                <Text className="text-xl font-bold text-slate-800 mb-2">
                  Import Complete
                </Text>
                <Text className="text-base text-slate-500 text-center">
                  {importResult?.count === 0
                    ? 'All images were already in your library.'
                    : `Added ${importResult?.count} new image${importResult?.count === 1 ? '' : 's'} to your library.`}
                </Text>
              </View>
              <Pressable
                onPress={() => setImportResult(null)}
                className="py-4 bg-slate-100 border-t border-slate-200"
              >
                <Text className="text-center font-semibold text-slate-600">Done</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
