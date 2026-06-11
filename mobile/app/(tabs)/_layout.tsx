import React from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DarkColors, LightColors } from '@/constants/theme';
import { Platform, Text } from 'react-native';
import { useUserStore } from '@/store';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { isDark } = useUserStore();
  const Colors = isDark ? DarkColors : LightColors;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bgSurface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 64 + (Platform.OS === 'ios' ? insets.bottom : 8),
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          elevation: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
        tabBarActiveTintColor: Colors.textPrimary,
        tabBarInactiveTintColor: Colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />,
          tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 10, fontWeight: '700', marginTop: 4, textAlign: 'center' }}>Home</Text>,
        }}
      />
      <Tabs.Screen
        name="book"
        options={{
          title: 'Book',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "ticket" : "ticket-outline"} size={22} color={color} />,
          tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 10, fontWeight: '700', marginTop: 4, textAlign: 'center' }}>Book</Text>,
        }}
      />
      <Tabs.Screen
        name="timing"
        options={{
          title: 'Live',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "time" : "time-outline"} size={22} color={color} />,
          tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 10, fontWeight: '700', marginTop: 4, textAlign: 'center' }}>Live</Text>,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "map" : "map-outline"} size={22} color={color} />,
          tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 10, fontWeight: '700', marginTop: 4, textAlign: 'center' }}>Map</Text>,
        }}
      />
    </Tabs>
  );
}
