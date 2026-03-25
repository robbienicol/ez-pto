import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@src/state/theme/ThemeProvider';
import { DiscoverTabScreen } from '@src/screens/Tabs/HomeTabScreen';
import { SearchTabScreen } from '@src/screens/Tabs/SearchTabScreen';
import { CreateChannelTabScreen } from '@src/screens/Tabs/CreatePodcastTabScreen';
import { LibraryTabScreen } from '@src/screens/Tabs/LibraryTabScreen';
import { ProfileNavigator } from '@src/navigation/ProfileNavigator';
import { MiniPlayer } from '@src/components/molecules/MiniPlayer';

export type AppTabsParamList = {
  Discover: undefined;
  Search: undefined;
  Create: undefined;
  Library: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AppTabsParamList>();

export const AppNavigator: React.FC = () => {
  const { tokens } = useTheme();

  type IoniconName = keyof typeof Ionicons.glyphMap;

  const tabIconName = (routeName: keyof AppTabsParamList, focused: boolean): IoniconName => {
    switch (routeName) {
      case 'Discover':
        return focused ? 'radio' : 'radio-outline';
      case 'Search':
        return focused ? 'search' : 'search-outline';
      case 'Create':
        return focused ? 'mic' : 'mic-outline';
      case 'Library':
        return focused ? 'library' : 'library-outline';
      case 'Profile':
        return focused ? 'person' : 'person-outline';
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: tokens.colors.primary,
          tabBarInactiveTintColor: tokens.colors.muted,
          tabBarStyle: {
            backgroundColor: tokens.colors.surface,
            borderTopColor: tokens.colors.border,
          },
          tabBarLabelStyle: {
            fontFamily: 'Nunito_600SemiBold',
            fontSize: 12,
          },
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={tabIconName(route.name, focused)} color={color} size={size} />
          ),
        })}
      >
        <Tab.Screen name="Discover" component={DiscoverTabScreen} options={{ title: 'Discover' }} />
        <Tab.Screen name="Search" component={SearchTabScreen} options={{ title: 'Search' }} />
        <Tab.Screen name="Create" component={CreateChannelTabScreen} options={{ title: 'Create' }} />
        <Tab.Screen name="Library" component={LibraryTabScreen} options={{ title: 'Library' }} />
        <Tab.Screen name="Profile" component={ProfileNavigator} options={{ title: 'Profile' }} />
      </Tab.Navigator>
      <MiniPlayer />
    </View>
  );
};
