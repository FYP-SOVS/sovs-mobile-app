import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Shield, Languages } from 'lucide-react-native';
import { useTranslation } from '@/contexts/LanguageContext';

export default function WelcomeScreen() {
  const { t, language, setLanguage } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'tr' : 'en');
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
            <Shield size={48} color="#667eea" strokeWidth={2} />
          </View>
        </View>
        
        <Text style={styles.appName}>{t('welcome.title')}</Text>
        <Text style={styles.tagline}>{t('welcome.tagline')}</Text>
        <Text style={styles.description}>
          {t('welcome.description')}
        </Text>

        <View style={styles.buttonContainer}>
          <Link href="/register/identity" asChild>
            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>{t('welcome.getStarted')}</Text>
            </Pressable>
          </Link>
        </View>
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#667eea',
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 24,
    fontWeight: '300',
    color: '#667eea',
    marginBottom: 24,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#667eea',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    width: '100%',
    borderWidth: 2,
    borderColor: '#667eea',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonIcon: {
    marginRight: 4,
  },
  secondaryButtonText: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: '600',
  },
});
