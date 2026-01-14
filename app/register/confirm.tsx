import { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Alert, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, User, Calendar, Phone, Mail, Shield, Sparkles, Languages } from 'lucide-react-native';
import { registerUser } from '@/services/auth';
import { useTranslation } from '@/contexts/LanguageContext';

export default function ConfirmRegistrationScreen() {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'tr' : 'en');
  };
  const params = useLocalSearchParams();

  const [isCreating, setIsCreating] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(params.phoneNumber as string || '');
  const [email, setEmail] = useState(params.email as string || '');

  const userData = {
    firstName: params.firstName as string,
    lastName: params.lastName as string,
    dateOfBirth: params.dateOfBirth as string,
    phoneNumber: phoneNumber,
    email: email || undefined,
  };

  const handleCreateAccount = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert(t('common.error'), t('registration.phoneNumber') + ' is required');
      return;
    }

    setIsCreating(true);

    try {
      // Register user with Supabase Auth and add to users table
      const result = await registerUser({
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined,
        name: userData.firstName,
        surname: userData.lastName,
        dateOfBirth: userData.dateOfBirth,
      });

      if (result.success) {
        router.replace('/register/success');
      } else {
        Alert.alert(t('common.error'), result.error || t('common.error'));
        setIsCreating(false);
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('common.error'));
      setIsCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{t('registration.step3')}</Text>
            </View>
            <Pressable style={styles.languageButton} onPress={toggleLanguage}   accessibilityRole="button">
              <Languages size={20} color="#667eea" strokeWidth={2} />
            </Pressable>
          </View>
          <Text style={styles.title}>{t('registration.confirmRegistration')}</Text>
          <Text style={styles.subtitle}>
            {t('registration.confirmDescription')}
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Shield size={24} color="#667eea" strokeWidth={2} />
              </View>
              <Text style={styles.cardHeaderText}>{t('profile.personalInformation')}</Text>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <User size={18} color="#667eea" strokeWidth={2} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{t('registration.name')}</Text>
                  <Text style={styles.infoValue}>{userData.firstName} {userData.lastName}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Calendar size={18} color="#667eea" strokeWidth={2} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{t('registration.dateOfBirth')}</Text>
                  <Text style={styles.infoValue}>
                    {new Date(userData.dateOfBirth).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Phone size={18} color="#667eea" strokeWidth={2} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{t('registration.phoneNumber')}</Text>
                  <Text style={styles.infoValue}>{userData.phoneNumber}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Phone size={18} color="#667eea" strokeWidth={2} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{t('registration.phoneNumber')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('registration.phoneNumber')}
                    placeholderTextColor="#999"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                  />
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Mail size={18} color="#667eea" strokeWidth={2} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{t('registration.email')} ({t('registration.optional')})</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('registration.emailPlaceholder')}
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
              </View>

              <View style={[styles.infoRow, styles.lastRow]}>
                <View style={styles.infoIcon}>
                  <Shield size={18} color="#667eea" strokeWidth={2} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{t('registration.role')}</Text>
                  <Text style={styles.infoValue}>VOTER</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.verificationCard}>
            <View style={styles.verificationItem}>
              <CheckCircle2 size={20} color="#10b981" strokeWidth={2.5} />
              <Text style={styles.verificationText}>{t('registration.identityVerified')}</Text>
            </View>
            <View style={styles.verificationItem}>
              <CheckCircle2 size={20} color="#10b981" strokeWidth={2.5} />
              <Text style={styles.verificationText}>{t('registration.dataRetrieved')}</Text>
            </View>
            <View style={styles.verificationItem}>
              <CheckCircle2 size={20} color="#10b981" strokeWidth={2.5} />
              <Text style={styles.verificationText}>{t('registration.dataEncrypted')}</Text>
            </View>
          </View>

          <Pressable
            style={[styles.button, isCreating && styles.buttonDisabled]}
            onPress={handleCreateAccount}
            disabled={isCreating}
          >
            {isCreating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Sparkles size={20} color="#fff" strokeWidth={2.5} />
                <Text style={styles.buttonText}>{t('registration.createAccount')}</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
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
  content: {
    padding: 32,
    paddingTop: 0,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
  },
  cardHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeaderText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  infoSection: {
    gap: 0,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  lastRow: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  input: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
    borderBottomWidth: 2,
    borderBottomColor: '#667eea',
    paddingVertical: 4,
    marginTop: 4,
  },
  verificationCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  verificationText: {
    fontSize: 15,
    color: '#065f46',
    marginLeft: 12,
    fontWeight: '500',
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});