import { Link, Stack } from 'expo-router';
import { theme } from '@/theme';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/contexts/LanguageContext';

export default function NotFoundScreen() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t('notFound.title') }} />
      <View style={styles.container}>
        <Text style={styles.text}>{t('notFound.message')}</Text>
        <Link href="/" style={styles.link}>
          <Text>{t('notFound.goHome')}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  text: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
    color: theme.colors.navy,
  },
});
