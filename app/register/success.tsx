import { StyleSheet, Text, View, Pressable } from 'react-native';
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
          <Languages size={24} color="#667eea" strokeWidth={2} />
        </Pressable>
      </View>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <CheckCircle2 size={64} color="#10b981" strokeWidth={2.5} />
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
            <Mail size={24} color="#667eea" strokeWidth={2} />
          </View>
          <Text style={styles.emailTitle}>Confirm Your Email</Text>
          <Text style={styles.emailText}>
            We've sent a confirmation link to your email address. Please check your inbox and click the link to verify your email.
          </Text>
        </View>

        <Pressable style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>{t('registration.continueToDashboard')}</Text>
          <ArrowRight size={20} color="#fff" strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#667eea',
    shadowColor: '#000',
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
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#10b981',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
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
    color: '#10b981',
    fontWeight: '700',
    marginRight: 12,
    width: 24,
  },
  infoText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
    flex: 1,
  },
  emailConfirmCard: {
    backgroundColor: '#f0f4ff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#667eea',
    alignItems: 'center',
  },
  emailIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emailText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    padding: 18,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
