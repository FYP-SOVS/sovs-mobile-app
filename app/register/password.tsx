import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Lock,
  Eye,
  EyeOff,
  Languages,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import { registerUser } from '@/services/auth';
import { useTranslation } from '@/contexts/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FORM_STORAGE_KEY = '@password_form_data';

// Password Requirement Component
function PasswordRequirement({ label, met }: { label: string; met: boolean }) {
  return (
    <View style={styles.requirement}>
      <View
        style={[
          styles.requirementIcon,
          { backgroundColor: met ? '#e7f5e9' : '#f5f5f5' },
        ]}
      >
        {met ? (
          <CheckCircle2 size={16} color="#6bcf7f" strokeWidth={2.5} />
        ) : (
          <View style={styles.requirementCircle} />
        )}
      </View>
      <Text style={[styles.requirementLabel, met && styles.requirementMet]}>
        {label}
      </Text>
    </View>
  );
}

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
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const isInitialLoad = useRef(true);

  // Password strength calculation
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordMatchError, setPasswordMatchError] = useState(false);

  // Load persisted form data on mount
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const storedData = await AsyncStorage.getItem(FORM_STORAGE_KEY);
        if (storedData) {
          const parsed = JSON.parse(storedData);
          // Only restore if we have a matching sessionId
          if (parsed.sessionId === params.sessionId) {
            setPhoneNumber(parsed.phoneNumber || '');
            setEmail(parsed.email || '');
            setPassword(parsed.password || '');
            setConfirmPassword(parsed.confirmPassword || '');
          } else {
            // Clear old data if sessionId doesn't match
            await AsyncStorage.removeItem(FORM_STORAGE_KEY);
          }
        }
      } catch (error) {
        // Ignore errors, just start with empty form
      } finally {
        isInitialLoad.current = false;
      }
    };
    loadPersistedData();
  }, [params.sessionId]);

  // Calculate password strength
  useEffect(() => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);

    // Check if passwords match
    if (confirmPassword && password !== confirmPassword) {
      setPasswordMatchError(true);
    } else {
      setPasswordMatchError(false);
    }
  }, [password, confirmPassword]);

  // Persist form data whenever it changes (debounced)
  useEffect(() => {
    if (isInitialLoad.current) return; // Don't save on initial load

    const saveData = async () => {
      try {
        await AsyncStorage.setItem(
          FORM_STORAGE_KEY,
          JSON.stringify({
            sessionId: params.sessionId,
            phoneNumber,
            email,
            password,
            confirmPassword,
          })
        );
      } catch (error) {
        // Ignore storage errors
      }
    };

    // Debounce saves to avoid too frequent writes
    const timeoutId = setTimeout(saveData, 500);
    return () => clearTimeout(timeoutId);
  }, [phoneNumber, email, password, confirmPassword, params.sessionId]);

  const userData = useMemo(
    () => ({
      sessionId: params.sessionId as string,
      firstName: params.firstName as string,
      lastName: params.lastName as string,
      dateOfBirth: params.dateOfBirth as string,
      documentNumber: (params.documentNumber as string) || '',
    }),
    [
      params.sessionId,
      params.firstName,
      params.lastName,
      params.dateOfBirth,
      params.documentNumber,
    ]
  );

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
      Alert.alert(
        t('common.error'),
        'Password must be at least 8 characters long'
      );
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
        // Clear persisted form data on success
        await AsyncStorage.removeItem(FORM_STORAGE_KEY);
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

  const Container = Platform.OS === 'web' ? View : KeyboardAvoidingView;
  const containerProps =
    Platform.OS === 'web'
      ? { style: styles.container }
      : {
          style: styles.container,
          behavior: (Platform.OS === 'ios' ? 'padding' : 'height') as
            | 'padding'
            | 'height',
        };

  // Track scroll position on web to prevent unwanted resets
  const handleScroll = useCallback((event: any) => {
    if (Platform.OS === 'web') {
      scrollY.current = event.nativeEvent.contentOffset.y;
    }
  }, []);

  // Prevent scroll reset on web when focusing inputs
  const handleInputFocus = useCallback(() => {
    if (Platform.OS === 'web') {
      // Restore scroll position after a brief delay to prevent browser auto-scroll
      setTimeout(() => {
        if (scrollViewRef.current && scrollY.current > 0) {
          scrollViewRef.current.scrollTo({
            y: scrollY.current,
            animated: false,
          });
        }
      }, 100);
    }
  }, []);

  return (
    <Container {...containerProps}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled={true}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        scrollEnabled={true}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>
                {t('registration.step2')}
              </Text>
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
                <Text style={styles.fieldValue}>
                  {userData.firstName} {userData.lastName}
                </Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Date of Birth</Text>
                <Text style={styles.fieldValue}>
                  {new Date(userData.dateOfBirth).toLocaleDateString(
                    language === 'tr' ? 'tr-TR' : 'en-US',
                    {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }
                  )}
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
                onFocus={handleInputFocus}
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
                onFocus={handleInputFocus}
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
            <Text style={styles.formTitle}>Set Your Password</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Password *</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter password (min 8 characters)"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={(text) => setPassword(text)}
                  onFocus={handleInputFocus}
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

              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBars}>
                    {[0, 1, 2, 3, 4].map((index) => (
                      <View
                        key={index}
                        style={[
                          styles.strengthBar,
                          {
                            backgroundColor:
                              index < passwordStrength
                                ? passwordStrength <= 2
                                  ? '#ff6b6b'
                                  : passwordStrength === 3
                                  ? '#ffd93d'
                                  : '#6bcf7f'
                                : '#e9ecef',
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text
                    style={[
                      styles.strengthText,
                      {
                        color:
                          passwordStrength <= 2
                            ? '#ff6b6b'
                            : passwordStrength === 3
                            ? '#ffd93d'
                            : '#6bcf7f',
                      },
                    ]}
                  >
                    {passwordStrength <= 2
                      ? 'Weak'
                      : passwordStrength === 3
                      ? 'Fair'
                      : 'Strong'}
                  </Text>
                </View>
              )}

              {/* Password Requirements */}
              <View style={styles.requirementsContainer}>
                <Text style={styles.requirementsTitle}>Requirements:</Text>
                <PasswordRequirement
                  label="At least 8 characters"
                  met={password.length >= 8}
                />
                <PasswordRequirement
                  label="Mix of uppercase and lowercase"
                  met={/[a-z]/.test(password) && /[A-Z]/.test(password)}
                />
                <PasswordRequirement
                  label="Contains numbers"
                  met={/[0-9]/.test(password)}
                />
                <PasswordRequirement
                  label="Contains special characters"
                  met={/[^a-zA-Z0-9]/.test(password)}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Confirm Password *</Text>
              <View
                style={[
                  styles.passwordInputContainer,
                  passwordMatchError && styles.passwordInputContainerError,
                ]}
              >
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm your password"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={(text) => setConfirmPassword(text)}
                  onFocus={handleInputFocus}
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
              {passwordMatchError && confirmPassword && (
                <View style={styles.errorMessage}>
                  <AlertCircle size={16} color="#ff6b6b" strokeWidth={2} />
                  <Text style={styles.errorText}>Passwords do not match</Text>
                </View>
              )}
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
    </Container>
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
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 24,
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
  passwordInputContainerError: {
    borderColor: '#ff6b6b',
    backgroundColor: '#fff8f7',
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
  // New styles for password strength
  strengthContainer: {
    marginTop: 12,
    gap: 8,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 6,
    height: 6,
  },
  strengthBar: {
    flex: 1,
    borderRadius: 3,
  },
  strengthText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Requirements section
  requirementsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  requirementIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  requirementCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ccc',
  },
  requirementLabel: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  requirementMet: {
    color: '#6bcf7f',
    fontWeight: '600',
  },
  // Error message
  errorMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff1f0',
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#ff6b6b',
    fontWeight: '500',
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
