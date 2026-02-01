import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { cn } from '@/lib/cn';

interface ChoiceCardProps {
  label: string;
  imageUrl: string;
  color: 'teal' | 'coral';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ChoiceCard({ label, imageUrl, color }: ChoiceCardProps) {
  const scale = useSharedValue(1);
  const borderWidth = useSharedValue(4);

  const handlePress = async () => {
    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animate
    scale.value = withSequence(
      withSpring(1.05, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );
    borderWidth.value = withSequence(
      withSpring(8, { damping: 10, stiffness: 400 }),
      withSpring(4, { damping: 15, stiffness: 300 })
    );

    // Speak the word
    Speech.speak(label, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.8,
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderWidth: borderWidth.value,
  }));

  const borderColor = color === 'teal' ? '#14B8A6' : '#F97316';
  const bgColor = color === 'teal' ? '#CCFBF1' : '#FED7AA';

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[
        animatedStyle,
        {
          borderColor,
          backgroundColor: bgColor,
          borderRadius: 32,
          overflow: 'hidden',
          flex: 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 6,
        },
      ]}
    >
      <View className="flex-1 items-center justify-center p-4">
        <View
          className="items-center justify-center rounded-3xl mb-4"
          style={{ width: 200, height: 200, backgroundColor: '#FFFFFF' }}
        >
          <Image
            source={{ uri: imageUrl }}
            style={{ width: 160, height: 160 }}
            contentFit="contain"
            transition={300}
          />
        </View>
        <Text
          className={cn(
            'text-4xl font-bold text-center',
            color === 'teal' ? 'text-teal-800' : 'text-orange-800'
          )}
          style={{ letterSpacing: 1 }}
        >
          {label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}
