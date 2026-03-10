import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@src/state/theme/ThemeProvider';
import { HomeTabScreen } from '@src/screens/Tabs/HomeTabScreen';
import { CreateTripTabScreen } from '@src/screens/Tabs/CreateTripTabScreen';
import { FindTripTabScreen } from '@src/screens/Tabs/FindTripTabScreen';
import { DiscoverTripsTabScreen } from '@src/screens/Tabs/DiscoverTripsTabScreen';
import { ProfileNavigator } from '@src/navigation/ProfileNavigator';

export type AppTabsParamList = {
  Home: undefined;
  CreateTrip: undefined;
  FindTrip: undefined;
  DiscoverTrips: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AppTabsParamList>();

export const AppNavigator: React.FC = () => {
  const { tokens } = useTheme();

  type IoniconName = keyof typeof Ionicons.glyphMap;

  const tabIconName = (routeName: keyof AppTabsParamList, focused: boolean): IoniconName => {
    switch (routeName) {
      case 'Home':
        return focused ? 'home' : 'home-outline';
      case 'CreateTrip':
        return focused ? 'add-circle' : 'add-circle-outline';
      case 'FindTrip':
        return focused ? 'search' : 'search-outline';
      case 'DiscoverTrips':
        return focused ? 'compass' : 'compass-outline';
      case 'Profile':
        return focused ? 'person' : 'person-outline';
    }
  };

  return (
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
      <Tab.Screen name="Home" component={HomeTabScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="CreateTrip" component={CreateTripTabScreen} options={{ title: 'Create trip' }} />
      <Tab.Screen name="FindTrip" component={FindTripTabScreen} options={{ title: 'Find trip' }} />
      <Tab.Screen name="DiscoverTrips" component={DiscoverTripsTabScreen} options={{ title: 'Discover' }} />
      <Tab.Screen name="Profile" component={ProfileNavigator} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};
