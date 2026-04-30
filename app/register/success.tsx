import { StyleSheet, Text, View, Pressable } from 'react-native';
import { theme } from '@/theme';
import { useRouter } from 'expo-router';
import { CheckCircle2, ArrowRight, Languages, Mail } from 'lucide-react-native';
import { useTranslation } from '@/contexts/LanguageContext';

export default function RegistrationSuccessScreen() {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'tr' : 'en');
  };

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.languageButton} onPress={toggleLanguage}>
          <Languages size={24} color={theme.colors.navy} strokeWidth={2} />
        </Pressable>
      </View>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <CheckCircle2 size={64} color={theme.colors.success} strokeWidth={2.5} />
          </View>
        </View>

        <Text style={styles.title}>{t('registration.successTitle')}</Text>
        <Text style={styles.subtitle}>
          {t('registration.successDescription')}
        </Text>

        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>✓</Text>
            <Text style={styles.infoText}>{t('registration.identityVerified')}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>✓</Text>
            <Text style={styles.infoText}>{t('registration.accountCreated')}</Text>
          </View>
          <View style={[styles.infoItem, styles.lastInfoItem]}>
            <Text style={styles.infoIcon}>✓</Text>
            <Text style={styles.infoText}>{t('registration.readyToVote')}</Text>
          </View>
        </View>

        <View style={styles.emailConfirmCard}>
          <View style={styles.emailIconContainer}>
            <Mail size={24} color={theme.colors.navy} strokeWidth={2} />
          </View>
          <Text style={styles.emailTitle}>{t('registration.confirmYourEmail')}</Text>
          <Text style={styles.emailText}>
            {t('registration.confirmEmailDescription')}
          </Text>
        </View>

        <Pressable style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>{t('registration.continueToDashboard')}</Text>
          <ArrowRight size={20} color={theme.colors.white} strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
  },
  languageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.navy,
    shadowColor: theme.colors.foreground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.successSoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: theme.colors.success,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    marginBottom: 32,
    shadowColor: theme.colors.foreground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  lastInfoItem: {
    marginBottom: 0,
  },
  infoIcon: {
    fontSize: 20,
    color: theme.colors.success,
    fontWeight: '700',
    marginRight: 12,
    width: 24,
  },
  infoText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  emailConfirmCard: {
    backgroundColor: theme.colors.goldSoft,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: theme.colors.navy,
    alignItems: 'center',
  },
  emailIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emailText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    backgroundColor: theme.colors.navy,
    borderRadius: 16,
    padding: 18,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: theme.colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
