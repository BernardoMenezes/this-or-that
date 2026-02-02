import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, ImageIcon, Settings } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useChoiceStore, type Choice } from '@/lib/choice-store';
import { useImageSelectionStore } from '@/lib/image-selection-store';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/cn';

export function SetupScreen() {
  const router = useRouter();
  const numberOfChoices = useSettingsStore((s) => s.numberOfChoices);
  const choice1 = useChoiceStore((s) => s.choice1);
  const choice2 = useChoiceStore((s) => s.choice2);
  const choice3 = useChoiceStore((s) => s.choice3);
  const choice4 = useChoiceStore((s) => s.choice4);
  const setChoice = useChoiceStore((s) => s.setChoice);

  const [localChoices, setLocalChoices] = useState<Choice[]>([choice1, choice2, choice3, choice4]);
  const [activeChoice, setActiveChoice] = useState<number | null>(null);

  const selection = useImageSelectionStore((s) => s.selection);
  const clearSelection = useImageSelectionStore((s) => s.clearSelection);

  // Sync local choices with store when number of choices changes
  useEffect(() => {
    setLocalChoices([choice1, choice2, choice3, choice4]);
  }, [choice1, choice2, choice3, choice4]);

  // Handle selection when returning from image picker
  useEffect(() => {
    if (selection && activeChoice !== null) {
      const newChoices = [...localChoices];
      newChoices[activeChoice - 1] = { imageUrl: selection.url, label: selection.label };
      setLocalChoices(newChoices);
      setChoice(activeChoice as 1 | 2 | 3 | 4, { imageUrl: selection.url, label: selection.label });
      clearSelection();
      setActiveChoice(null);
    }
  }, [selection, activeChoice, clearSelection, localChoices, setChoice]);

  // Get the choices to display based on setting
  const displayedChoices = localChoices.slice(0, numberOfChoices);

  const canContinue = displayedChoices.every(
    (choice) => choice.label.trim() && choice.imageUrl
  );

  const handleContinue = async () => {
    if (!canContinue) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/choose');
  };

  const getChoiceColors = (index: number) => {
    const colors = [
      { bg: '#F0FDFA', border: '#14B8A6', text: '#115E59', colorName: 'teal' },
      { bg: '#FFF7ED', border: '#F97316', text: '#9A3412', colorName: 'coral' },
      { bg: '#EDE9FE', border: '#8B5CF6', text: '#5B21B6', colorName: 'purple' },
      { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E', colorName: 'amber' },
    ];
    return colors[index] || colors[0];
  };

  const handleChoicePress = (index: number) => {
    Haptics.selectionAsync();
    setActiveChoice(index);
    const colorName = getChoiceColors(index - 1).colorName;
    router.push({
      pathname: '/select-image',
      params: { color: colorName, choiceNumber: String(index) }
    });
  };

  return (
    <View className="flex-1">
      <LinearGradient colors={['#E0F2FE', '#F0FDFA', '#FEF3C7']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <ScrollView
              className="flex-1 px-5"
              contentContainerStyle={{ paddingBottom: 100 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <View className="py-6">
                <View className="flex-row items-center justify-center">
                  <Text className="text-3xl font-bold text-slate-800 text-center">
                    Set Up Choices
                  </Text>
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      router.push('/credits');
                    }}
                    className="absolute right-0 p-2"
                  >
                    <Settings size={24} color="#64748B" />
                  </Pressable>
                </View>
                <Text className="text-base text-slate-500 text-center mt-2">
                  Tap to change the choices
                </Text>
              </View>

              {/* Dynamic Choice Cards */}
              {displayedChoices.map((choice, index) => {
                const choiceNum = index + 1;
                const colors = getChoiceColors(index);
                return (
                  <Pressable
                    key={choiceNum}
                    onPress={() => handleChoicePress(choiceNum)}
                    className="rounded-3xl p-4 mb-4"
                    style={{ backgroundColor: colors.bg, borderWidth: 2, borderColor: colors.border }}
                  >
                    <Text className="text-lg font-semibold mb-3" style={{ color: colors.text }}>
                      Choice {choiceNum}
                    </Text>

                    {choice.label ? (
                      <Text className="text-xl font-bold text-center mb-3" style={{ color: colors.text }}>
                        {choice.label}
                      </Text>
                    ) : null}

                    {choice.imageUrl ? (
                      <View
                        className="rounded-2xl overflow-hidden items-center justify-center"
                        style={{ height: 140, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' }}
                      >
                        <Image source={{ uri: choice.imageUrl }} style={{ width: 110, height: 110 }} contentFit="contain" />
                      </View>
                    ) : (
                      <View
                        className="rounded-2xl items-center justify-center"
                        style={{ height: 140, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed' }}
                      >
                        <ImageIcon size={32} color="#9CA3AF" />
                        <Text className="text-gray-500 mt-2 font-medium">Tap to choose image</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Continue Button */}
            <View className="absolute bottom-0 left-0 right-0 px-5 pb-8">
              <Pressable
                onPress={handleContinue}
                disabled={!canContinue}
                className={cn(
                  'flex-row items-center justify-center py-4 rounded-2xl',
                  canContinue ? 'bg-teal-500' : 'bg-gray-300'
                )}
                style={{
                  shadowColor: canContinue ? '#14B8A6' : '#9CA3AF',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text className="text-white text-xl font-bold mr-2">Show Choices</Text>
                <ArrowRight size={24} color="white" />
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
