import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ChoiceCard } from './ChoiceCard';
import { useChoiceStore } from '@/lib/choice-store';
import { useSettingsStore } from '@/lib/settings-store';

export function ChooseScreen() {
  const router = useRouter();
  const numberOfChoices = useSettingsStore((s) => s.numberOfChoices);
  const choice1 = useChoiceStore((s) => s.choice1);
  const choice2 = useChoiceStore((s) => s.choice2);
  const choice3 = useChoiceStore((s) => s.choice3);
  const choice4 = useChoiceStore((s) => s.choice4);

  const allChoices = [choice1, choice2, choice3, choice4];
  const displayedChoices = allChoices.slice(0, numberOfChoices);

  const colors: ('teal' | 'coral' | 'purple' | 'amber')[] = ['teal', 'coral', 'purple', 'amber'];

  const handleSetup = async () => {
    await Haptics.selectionAsync();
    router.push('/');
  };

  // For 2 choices: single column (stacked vertically)
  // For 3 choices: top row with 2, bottom with 1 centered
  // For 4 choices: 2x2 grid
  const renderChoices = () => {
    if (numberOfChoices === 2) {
      return (
        <View className="flex-1 gap-4">
          {displayedChoices.map((choice, index) => (
            <ChoiceCard
              key={index}
              label={choice.label}
              imageUrl={choice.imageUrl}
              color={colors[index]}
            />
          ))}
        </View>
      );
    }

    if (numberOfChoices === 3) {
      return (
        <View className="flex-1 gap-4">
          <View className="flex-1 flex-row gap-4">
            <ChoiceCard
              label={displayedChoices[0].label}
              imageUrl={displayedChoices[0].imageUrl}
              color={colors[0]}
            />
            <ChoiceCard
              label={displayedChoices[1].label}
              imageUrl={displayedChoices[1].imageUrl}
              color={colors[1]}
            />
          </View>
          <View className="flex-1 px-12">
            <ChoiceCard
              label={displayedChoices[2].label}
              imageUrl={displayedChoices[2].imageUrl}
              color={colors[2]}
            />
          </View>
        </View>
      );
    }

    // 4 choices: 2x2 grid
    return (
      <View className="flex-1 gap-4">
        <View className="flex-1 flex-row gap-4">
          <ChoiceCard
            label={displayedChoices[0].label}
            imageUrl={displayedChoices[0].imageUrl}
            color={colors[0]}
          />
          <ChoiceCard
            label={displayedChoices[1].label}
            imageUrl={displayedChoices[1].imageUrl}
            color={colors[1]}
          />
        </View>
        <View className="flex-1 flex-row gap-4">
          <ChoiceCard
            label={displayedChoices[2].label}
            imageUrl={displayedChoices[2].imageUrl}
            color={colors[2]}
          />
          <ChoiceCard
            label={displayedChoices[3].label}
            imageUrl={displayedChoices[3].imageUrl}
            color={colors[3]}
          />
        </View>
      </View>
    );
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
            {renderChoices()}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
