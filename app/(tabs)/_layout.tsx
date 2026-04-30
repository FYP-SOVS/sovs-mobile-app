import { Tabs } from 'expo-router';
import { theme } from '@/theme';
import { Home, User } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.navy,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: theme.colors.white,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          height: 56,
          paddingBottom: 0,
          paddingTop: 0,
        },
        tabBarItemStyle: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
