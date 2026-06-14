import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

import { OnboardingScreen } from '@src/screens/Onboarding/OnboardingScreen';
import { HomeScreen } from '@src/screens/Home/HomeScreen';
import { QuizScreen } from '@src/screens/Quiz/QuizScreen';
import { FullReportScreen } from '@src/screens/FullReport/FullReportScreen';
import { SavedPlaylistsScreen } from '@src/screens/SavedPlaylists/SavedPlaylistsScreen';
import { useSavedPlaylists } from '@src/state/savedPlaylists/SavedPlaylistsProvider';

// ─── Param lists ──────────────────────────────────────────────────────────────

export type AppStackParamList = {
  Home: undefined;
  Quiz: undefined;
  FullReport: { answers: Record<string, string> };
};

type TabParamList = {
  HomeTab: undefined;
  SavedTab: undefined;
};

type RootParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
};

// ─── Navigators ───────────────────────────────────────────────────────────────

const Root  = createNativeStackNavigator<RootParamList>();
const Tab   = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

const TAB_BAR_STYLE = { backgroundColor: '#000000', borderTopColor: 'rgba(255,255,255,0.08)' } as const;
const TAB_BAR_HIDDEN = { display: 'none' } as const;

// ─── Home stack ───────────────────────────────────────────────────────────────

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} options={{ animation: 'none' }} />
      <Stack.Screen name="FullReport" component={FullReportScreen} />
    </Stack.Navigator>
  );
}

// ─── Main tabs ────────────────────────────────────────────────────────────────

function MainTabs() {
  const { quizCompleted, savedPlaylists } = useSavedPlaylists();
  const showTabBar = quizCompleted && savedPlaylists.length > 0;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#BF5FFF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
        tabBarLabelStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={({ route }) => {
          const focused = getFocusedRouteNameFromRoute(route) ?? 'Home';
          const hideForScreen = focused === 'Quiz' || focused === 'FullReport';
          return {
            title: 'Discover',
            tabBarStyle: (!showTabBar || hideForScreen) ? TAB_BAR_HIDDEN : TAB_BAR_STYLE,
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>✦</Text>,
          };
        }}
      />
      <Tab.Screen
        name="SavedTab"
        component={SavedPlaylistsScreen}
        options={{
          title: 'Saved',
          tabBarStyle: showTabBar ? TAB_BAR_STYLE : TAB_BAR_HIDDEN,
          tabBarButton: showTabBar ? undefined : () => null,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>♥</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Root navigator ───────────────────────────────────────────────────────────

export const AppNavigator: React.FC = () => {
  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'MainTabs' | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync('onboarding_done').then(val => {
      setInitialRoute(val ? 'MainTabs' : 'Onboarding');
    });
  }, []);

  if (!initialRoute) return null;

  return (
    <Root.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Root.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'fade' }} />
      <Root.Screen name="MainTabs" component={MainTabs} />
    </Root.Navigator>
  );
};
