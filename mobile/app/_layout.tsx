import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useUserStore } from '@/store';
import { DarkColors, LightColors } from '@/constants/theme';
import { useFonts, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { isDark } = useUserStore();
  const Colors = isDark ? DarkColors : LightColors;
  const [fontsLoaded, fontError] = useFonts({
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor={Colors.bgBase} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.bgBase },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="account" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="transit-preferences" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="app-language" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="payment-management" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="my-rides" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="ride-details" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen
          name="booking/result"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
