import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, ImageIcon, Info } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useChoiceStore, type Choice } from '@/lib/choice-store';
import { useImageSelectionStore } from '@/lib/image-selection-store';
import { cn } from '@/lib/cn';

interface ChoiceInputProps {
  label: string;
  imageUrl: string;
  onChoiceChange: (url: string, label: string) => void;
  color: 'teal' | 'coral';
  choiceNumber: number;
}

function ChoiceInput({ label, imageUrl, onChoiceChange, color, choiceNumber }: ChoiceInputProps) {
  const router = useRouter();
  const selection = useImageSelectionStore((s) => s.selection);
  const clearSelection = useImageSelectionStore((s) => s.clearSelection);

  const borderColor = color === 'teal' ? '#14B8A6' : '#F97316';
  const bgColor = color === 'teal' ? '#F0FDFA' : '#FFF7ED';
  const textColor = color === 'teal' ? '#115E59' : '#9A3412';

  // Listen for selection changes when returning from select-image page
  useEffect(() => {
    if (selection) {
      onChoiceChange(selection.url, selection.label);
      clearSelection();
    }
  }, [selection, onChoiceChange, clearSelection]);

  const handlePress = () => {
    Haptics.selectionAsync();
    router.push({
      pathname: '/select-image',
      params: { color, choiceNumber: String(choiceNumber) }
    });
  };

  return (
    <Pressable
      onPress={handlePress}
      className="rounded-3xl p-4 mb-4"
      style={{ backgroundColor: bgColor, borderWidth: 2, borderColor }}
    >
      <Text className="text-lg font-semibold mb-3" style={{ color: textColor }}>
        Choice {choiceNumber}
      </Text>

      {/* Display current label */}
      {label ? (
        <Text className="text-xl font-bold text-center mb-3" style={{ color: textColor }}>
          {label}
        </Text>
      ) : null}

      {/* Image Preview / Upload Button */}
      {imageUrl ? (
        <View
          className="rounded-2xl overflow-hidden items-center justify-center"
          style={{ height: 140, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' }}
        >
          <Image source={{ uri: imageUrl }} style={{ width: 110, height: 110 }} contentFit="contain" />
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
}

export function SetupScreen() {
  const router = useRouter();
  const { choice1: savedChoice1, choice2: savedChoice2, setChoices } = useChoiceStore();

  const [choice1, setChoice1] = useState<Choice>(savedChoice1);
  const [choice2, setChoice2] = useState<Choice>(savedChoice2);
  const [activeChoice, setActiveChoice] = useState<1 | 2 | null>(null);

  const selection = useImageSelectionStore((s) => s.selection);
  const clearSelection = useImageSelectionStore((s) => s.clearSelection);

  // Handle selection when returning from image picker
  useEffect(() => {
    if (selection && activeChoice) {
      if (activeChoice === 1) {
        setChoice1({ imageUrl: selection.url, label: selection.label });
      } else {
        setChoice2({ imageUrl: selection.url, label: selection.label });
      }
      clearSelection();
      setActiveChoice(null);
    }
  }, [selection, activeChoice, clearSelection]);

  const canContinue = choice1.label.trim() && choice1.imageUrl && choice2.label.trim() && choice2.imageUrl;

  const handleContinue = async () => {
    if (!canContinue) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setChoices(choice1, choice2);
    router.push('/choose');
  };

  const handleChoice1Press = () => {
    Haptics.selectionAsync();
    setActiveChoice(1);
    router.push({
      pathname: '/select-image',
      params: { color: 'teal', choiceNumber: '1' }
    });
  };

  const handleChoice2Press = () => {
    Haptics.selectionAsync();
    setActiveChoice(2);
    router.push({
      pathname: '/select-image',
      params: { color: 'coral', choiceNumber: '2' }
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
                    <Info size={24} color="#64748B" />
                  </Pressable>
                </View>
                <Text className="text-base text-slate-500 text-center mt-2">
                  Tap to change the choices
                </Text>
              </View>

              {/* Choice 1 */}
              <Pressable
                onPress={handleChoice1Press}
                className="rounded-3xl p-4 mb-4"
                style={{ backgroundColor: '#F0FDFA', borderWidth: 2, borderColor: '#14B8A6' }}
              >
                <Text className="text-lg font-semibold mb-3" style={{ color: '#115E59' }}>
                  Choice 1
                </Text>

                {choice1.label ? (
                  <Text className="text-xl font-bold text-center mb-3" style={{ color: '#115E59' }}>
                    {choice1.label}
                  </Text>
                ) : null}

                {choice1.imageUrl ? (
                  <View
                    className="rounded-2xl overflow-hidden items-center justify-center"
                    style={{ height: 140, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' }}
                  >
                    <Image source={{ uri: choice1.imageUrl }} style={{ width: 110, height: 110 }} contentFit="contain" />
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

              {/* Choice 2 */}
              <Pressable
                onPress={handleChoice2Press}
                className="rounded-3xl p-4 mb-4"
                style={{ backgroundColor: '#FFF7ED', borderWidth: 2, borderColor: '#F97316' }}
              >
                <Text className="text-lg font-semibold mb-3" style={{ color: '#9A3412' }}>
                  Choice 2
                </Text>

                {choice2.label ? (
                  <Text className="text-xl font-bold text-center mb-3" style={{ color: '#9A3412' }}>
                    {choice2.label}
                  </Text>
                ) : null}

                {choice2.imageUrl ? (
                  <View
                    className="rounded-2xl overflow-hidden items-center justify-center"
                    style={{ height: 140, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' }}
                  >
                    <Image source={{ uri: choice2.imageUrl }} style={{ width: 110, height: 110 }} contentFit="contain" />
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
