import React from 'react';
import { Redirect } from 'expo-router';
import { useUserStore } from '@/store';

export default function Index() {
  const { user } = useUserStore();
  
  if (!user) {
    // @ts-ignore
    return <Redirect href="/onboarding" />;
  }
  
  return <Redirect href="/(tabs)" />;
}
