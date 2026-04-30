import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, TextInput } from 'react-native';
import { useFonts } from '@expo-google-fonts/dm-sans/useFonts';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans/600SemiBold';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { font, theme } from '@/theme';

const applyDefaultFont = (component: typeof Text | typeof TextInput) => {
  const target = component as typeof component & { defaultProps?: { style?: unknown } };
  target.defaultProps = target.defaultProps || {};
  target.defaultProps.style = [font('regular'), target.defaultProps.style];
};

applyDefaultFont(Text);
applyDefaultFont(TextInput);

export default function RootLayout() {
  useFrameworkReady();
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <LanguageProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="dark" backgroundColor={theme.colors.background} />
    </LanguageProvider>
  );
}
