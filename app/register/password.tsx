import { useState, useMemo, useCallback } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Lock, Eye, EyeOff, Languages, ArrowRight } from 'lucide-react-native';
import { registerUser } from '@/services/auth';
import { useTranslation } from '@/contexts/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PasswordSetupScreen() {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();
  const params = useLocalSearchParams();

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'tr' : 'en');
  }, [language, setLanguage]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  const userData = useMemo(() => ({
    sessionId: params.sessionId as string,
    firstName: params.firstName as string,
    lastName: params.lastName as string,
    dateOfBirth: params.dateOfBirth as string,
    documentNumber: params.documentNumber as string || '',
  }), [params.sessionId, params.firstName, params.lastName, params.dateOfBirth, params.documentNumber]);

  const handleCreateAccount = useCallback(async () => {
    // Validation
    if (!phoneNumber.trim()) {
      Alert.alert(t('common.error'), 'Phone number is required');
      return;
    }

    if (!password.trim()) {
      Alert.alert(t('common.error'), 'Password is required');
      return;
    }

    if (password.length < 8) {
      Alert.alert(t('common.error'), 'Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), 'Passwords do not match');
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
        password: password, // Now we have a real password from user
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
  }, [phoneNumber, password, confirmPassword, email, userData, t, router]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled={true}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{t('registration.step2')}</Text>
            </View>
            <Pressable style={styles.languageButton} onPress={toggleLanguage}>
              <Languages size={20} color="#667eea" strokeWidth={2} />
            </Pressable>
          </View>
          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>
            Set up your password and contact information
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Lock size={24} color="#667eea" strokeWidth={2} />
              </View>
              <Text style={styles.cardHeaderText}>Account Information</Text>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Name</Text>
                <Text style={styles.fieldValue}>{userData.firstName} {userData.lastName}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Date of Birth</Text>
                <Text style={styles.fieldValue}>
                  {new Date(userData.dateOfBirth).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Contact Information</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="+1234567890"
                placeholderTextColor="#999"
                value={phoneNumber}
                onChangeText={(text) => setPhoneNumber(text)}
                keyboardType="phone-pad"
                autoComplete="tel"
                autoCorrect={false}
                textContentType="telephoneNumber"
                editable={!isCreating}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="user@example.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={(text) => setEmail(text)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                textContentType="emailAddress"
                editable={!isCreating}
              />
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Password</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Password *</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter password (min 8 characters)"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={(text) => setPassword(text)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  autoCorrect={false}
                  textContentType="newPassword"
                  editable={!isCreating}
                />
                <Pressable
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isCreating}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#666" strokeWidth={2} />
                  ) : (
                    <Eye size={20} color="#666" strokeWidth={2} />
                  )}
                </Pressable>
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Confirm Password *</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm your password"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={(text) => setConfirmPassword(text)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  autoCorrect={false}
                  textContentType="newPassword"
                  editable={!isCreating}
                />
                <Pressable
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isCreating}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#666" strokeWidth={2} />
                  ) : (
                    <Eye size={20} color="#666" strokeWidth={2} />
                  )}
                </Pressable>
              </View>
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
                <Text style={styles.buttonText}>Create Account</Text>
                <ArrowRight size={20} color="#fff" strokeWidth={2.5} />
              </>
            )}
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
  header: {
    padding: SCREEN_WIDTH < 375 ? 20 : 32,
    paddingTop: SCREEN_WIDTH < 375 ? 50 : 60,
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
    fontSize: SCREEN_WIDTH < 375 ? 24 : 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: SCREEN_WIDTH < 375 ? 14 : 16,
    color: '#666',
    lineHeight: 24,
  },
  content: {
    padding: SCREEN_WIDTH < 375 ? 20 : 32,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: SCREEN_WIDTH < 375 ? 16 : 24,
    marginBottom: 24,
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
  fieldRow: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: SCREEN_WIDTH < 375 ? 16 : 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  formTitle: {
    fontSize: SCREEN_WIDTH < 375 ? 18 : 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: SCREEN_WIDTH < 375 ? 13 : 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: SCREEN_WIDTH < 375 ? 14 : 16,
    fontSize: SCREEN_WIDTH < 375 ? 15 : 16,
    color: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#f0f0f0',
    minHeight: 50,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  passwordInput: {
    flex: 1,
    padding: SCREEN_WIDTH < 375 ? 14 : 16,
    fontSize: SCREEN_WIDTH < 375 ? 15 : 16,
    color: '#1a1a1a',
    minHeight: 50,
  },
  eyeButton: {
    padding: 16,
  },
  button: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    padding: SCREEN_WIDTH < 375 ? 16 : 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 56,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH < 375 ? 16 : 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

