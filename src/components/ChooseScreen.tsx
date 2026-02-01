import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ChoiceCard } from './ChoiceCard';
import { useChoiceStore } from '@/lib/choice-store';

export function ChooseScreen() {
  const router = useRouter();
  const choice1 = useChoiceStore((s) => s.choice1);
  const choice2 = useChoiceStore((s) => s.choice2);

  const handleSetup = async () => {
    await Haptics.selectionAsync();
    router.push('/');
  };

  return (
    <View className="flex-1">
      <LinearGradient colors={['#E0F2FE', '#F0FDFA', '#FFF7ED']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          <View className="flex-1 px-4 py-4">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-bold text-slate-700">
                Pick One
              </Text>
              <Pressable
                onPress={handleSetup}
                className="p-3 bg-white/80 rounded-full"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <ArrowLeft size={24} color="#64748B" />
              </Pressable>
            </View>

            {/* Instruction */}
            <Text className="text-lg text-slate-500 text-center mb-4">
              Tap what you want
            </Text>

            {/* Choice Cards */}
            <View className="flex-1 gap-4">
              <ChoiceCard
                label={choice1.label}
                imageUrl={choice1.imageUrl}
                color="teal"
              />
              <ChoiceCard
                label={choice2.label}
                imageUrl={choice2.imageUrl}
                color="coral"
              />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
