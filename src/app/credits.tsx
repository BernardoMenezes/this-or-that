import React from 'react';
import { View, Text, Pressable, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ExternalLink, Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function CreditsScreen() {
  const router = useRouter();

  const openLink = (url: string) => {
    Haptics.selectionAsync();
    Linking.openURL(url);
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
            Credits & Attribution
          </Text>
        </View>

        <ScrollView className="flex-1 px-5 py-6">
          {/* Symbol Credits Card */}
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
            <View className="flex-row items-center mb-4">
              <Heart size={24} color="#EC4899" />
              <Text className="text-xl font-bold text-slate-800 ml-2">
                Symbol Credits
              </Text>
            </View>

            <Text className="text-base text-slate-600 leading-6 mb-4">
              This app uses symbols from the Mulberry Symbols collection.
            </Text>

            <View className="bg-slate-50 rounded-xl p-4 mb-4">
              <Text className="text-base font-semibold text-slate-700 mb-2">
                Mulberry Symbols
              </Text>
              <Text className="text-sm text-slate-500 mb-1">
                © 2018-2019 Steve Lee
              </Text>
              <Text className="text-sm text-slate-500 mb-3">
                Licensed under Creative Commons{'\n'}Attribution-ShareAlike 2.0 UK
              </Text>

              <Pressable
                onPress={() => openLink('https://mulberrysymbols.org')}
                className="flex-row items-center"
              >
                <Text className="text-teal-600 font-medium">
                  mulberrysymbols.org
                </Text>
                <ExternalLink size={16} color="#0D9488" style={{ marginLeft: 4 }} />
              </Pressable>
            </View>

            <View className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <Text className="text-sm text-amber-800 leading-5">
                The symbols are free to use with attribution. If you create derivative works, they must be shared under the same license.
              </Text>
            </View>
          </View>

          {/* License Link */}
          <Pressable
            onPress={() => openLink('https://creativecommons.org/licenses/by-sa/2.0/uk/')}
            className="bg-white rounded-2xl p-4 flex-row items-center justify-between shadow-sm"
          >
            <View className="flex-1">
              <Text className="text-base font-medium text-slate-700">
                View Full License
              </Text>
              <Text className="text-sm text-slate-500 mt-1">
                CC BY-SA 2.0 UK
              </Text>
            </View>
            <ExternalLink size={20} color="#64748B" />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
