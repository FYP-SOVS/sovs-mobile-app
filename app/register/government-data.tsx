import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Database, User, Calendar, Phone, Mail, ArrowRight, Languages } from 'lucide-react-native';
import { governmentDBAPI } from '@/services/api';
import { useTranslation } from '@/contexts/LanguageContext';

interface GovernmentData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
  email?: string;
}

export default function GovernmentDataScreen() {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'tr' : 'en');
  };
  const params = useLocalSearchParams();
  const nationalIdNumber = params.nationalIdNumber as string;

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<GovernmentData | null>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGovernmentData();
  }, [nationalIdNumber]);

  const loadGovernmentData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const governmentData = await governmentDBAPI.getByNationalId(nationalIdNumber);

      if (governmentData) {
        // Map the government_db schema to our expected format
        const mappedData: GovernmentData = {
          firstName: governmentData.name,
          lastName: governmentData.surname,
          dateOfBirth: governmentData.dob,
          phoneNumber: governmentData.phone_number,
          email: '', // Government DB doesn't have email
        };
        setData(mappedData);
        setEmail('');
      } else {
        setError(t('registration.noRecordFound'));
      }
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (!data) return;

    if (email && !email.includes('@')) {
      Alert.alert(t('common.error'), t('registration.emailPlaceholder'));
      return;
    }

    router.push({
      pathname: '/register/confirm',
      params: {
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        phoneNumber: data.phoneNumber,
        email: email || '',
      },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>{t('registration.fetchingInfo')}</Text>
          <Text style={styles.loadingSubtext}>{t('registration.retrievingData')}</Text>
        </View>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.errorIconContainer}>
            <View style={styles.errorIconCircle}>
              <Database size={32} color="#667eea" strokeWidth={2} />
            </View>
          </View>
          <Text style={styles.errorTitle}>{t('registration.registrationCannotContinue')}</Text>
          <Text style={styles.errorText}>{error || t('registration.noRecordFound')}</Text>
          <Pressable
            style={styles.button}
            onPress={() => router.push('/register/identity')}
          >
            <Text style={styles.buttonText}>{t('registration.tryAgain')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{t('registration.step2')}</Text>
            </View>
            <Pressable
  testID="language-toggle"
  accessibilityRole="button"
  style={styles.languageButton}
  onPress={toggleLanguage}
>
              <Languages size={20} color="#667eea" strokeWidth={2} />
            </Pressable>
          </View>
          <Text style={styles.title}>{t('registration.verifyInformation')}</Text>
          <Text style={styles.subtitle}>
            {t('registration.verifyInformationDescription')}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.infoCard}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldIcon}>
                <User size={20} color="#667eea" strokeWidth={2} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>{t('registration.firstName')}</Text>
                <Text style={styles.fieldValue}>{data.firstName}</Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.fieldIcon}>
                <User size={20} color="#667eea" strokeWidth={2} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>{t('registration.lastName')}</Text>
                <Text style={styles.fieldValue}>{data.lastName}</Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.fieldIcon}>
                <Calendar size={20} color="#667eea" strokeWidth={2} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>{t('registration.dateOfBirth')}</Text>
                <Text style={styles.fieldValue}>
                  {new Date(data.dateOfBirth).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.fieldIcon}>
                <Phone size={20} color="#667eea" strokeWidth={2} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>{t('registration.phoneNumber')}</Text>
                <Text style={styles.fieldValue}>{data.phoneNumber}</Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.fieldIcon}>
                <Mail size={20} color="#667eea" strokeWidth={2} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>
                  {t('registration.email')} {!data.email && <Text style={styles.optional}>({t('registration.optional')})</Text>}
                </Text>
                {data.email ? (
                  <Text style={styles.fieldValue}>{data.email}</Text>
                ) : (
                  <TextInput
                    style={styles.emailInput}
                    placeholder={t('registration.emailPlaceholder')}
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                )}
              </View>
            </View>
          </View>

          <Pressable style={styles.button} onPress={handleContinue}>
            <Text style={styles.buttonText}>{t('registration.confirmContinue')}</Text>
            <ArrowRight size={20} color="#fff" strokeWidth={2.5} />
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 24,
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  header: {
    padding: 32,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepBadge: {
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#667eea',
  },
  languageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  stepBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#667eea',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  form: {
    padding: 32,
    paddingTop: 0,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  fieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  optional: {
    fontSize: 11,
    fontWeight: '400',
    color: '#999',
    textTransform: 'none',
  },
  emailInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    borderBottomWidth: 2,
    borderBottomColor: '#667eea',
    paddingVertical: 4,
  },
  button: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
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
  errorIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  errorIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#667eea',
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
});