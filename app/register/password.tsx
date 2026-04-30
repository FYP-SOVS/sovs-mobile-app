import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { theme } from '@/theme';
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
          { backgroundColor: met ? theme.colors.successSoft : theme.colors.surfaceMuted },
        ]}
      >
        {met ? (
          <CheckCircle2 size={16} color={theme.colors.success} strokeWidth={2.5} />
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
        nationalId: userData.documentNumber,
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
              <Languages size={20} color={theme.colors.navy} strokeWidth={2} />
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
                <Lock size={24} color={theme.colors.navy} strokeWidth={2} />
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
                placeholderTextColor={theme.colors.textTertiary}
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
                placeholderTextColor={theme.colors.textTertiary}
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
                  placeholderTextColor={theme.colors.textTertiary}
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
                    <EyeOff size={20} color={theme.colors.textSecondary} strokeWidth={2} />
                  ) : (
                    <Eye size={20} color={theme.colors.textSecondary} strokeWidth={2} />
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
                                  ? theme.colors.danger
                                  : passwordStrength === 3
                                  ? theme.colors.warning
                                  : theme.colors.success
                                : theme.colors.border,
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
                            ? theme.colors.danger
                            : passwordStrength === 3
                            ? theme.colors.warning
                            : theme.colors.success,
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
                  placeholderTextColor={theme.colors.textTertiary}
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
                    <EyeOff size={20} color={theme.colors.textSecondary} strokeWidth={2} />
                  ) : (
                    <Eye size={20} color={theme.colors.textSecondary} strokeWidth={2} />
                  )}
                </Pressable>
              </View>
              {passwordMatchError && confirmPassword && (
                <View style={styles.errorMessage}>
                  <AlertCircle size={16} color={theme.colors.danger} strokeWidth={2} />
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
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <>
                <Text style={styles.buttonText}>Create Account</Text>
                <ArrowRight size={20} color={theme.colors.white} strokeWidth={2.5} />
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
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  header: {
    padding: SCREEN_WIDTH < 375 ? 20 : 32,
    paddingTop: SCREEN_WIDTH < 375 ? 50 : 60,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepBadge: {
    backgroundColor: theme.colors.goldSoft,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.navy,
  },
  languageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.goldSoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.navy,
  },
  stepBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.navy,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: SCREEN_WIDTH < 375 ? 24 : 28,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: SCREEN_WIDTH < 375 ? 14 : 16,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  content: {
    padding: SCREEN_WIDTH < 375 ? 20 : 32,
  },
  infoCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    padding: SCREEN_WIDTH < 375 ? 16 : 24,
    marginBottom: 24,
    shadowColor: theme.colors.foreground,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.border,
  },
  cardHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.goldSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeaderText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  infoSection: {
    gap: 0,
  },
  fieldRow: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceMuted,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  formCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    padding: SCREEN_WIDTH < 375 ? 16 : 24,
    marginBottom: 24,
    shadowColor: theme.colors.foreground,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  formTitle: {
    fontSize: SCREEN_WIDTH < 375 ? 18 : 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: SCREEN_WIDTH < 375 ? 13 : 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: SCREEN_WIDTH < 375 ? 14 : 16,
    fontSize: SCREEN_WIDTH < 375 ? 15 : 16,
    color: theme.colors.textPrimary,
    borderWidth: 2,
    borderColor: theme.colors.border,
    minHeight: 50,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  passwordInputContainerError: {
    borderColor: theme.colors.danger,
    backgroundColor: theme.colors.dangerSoft,
  },
  passwordInput: {
    flex: 1,
    padding: SCREEN_WIDTH < 375 ? 14 : 16,
    fontSize: SCREEN_WIDTH < 375 ? 15 : 16,
    color: theme.colors.textPrimary,
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
    borderTopColor: theme.colors.border,
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
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
    backgroundColor: theme.colors.borderStrong,
  },
  requirementLabel: {
    fontSize: 13,
    color: theme.colors.textTertiary,
    fontWeight: '500',
  },
  requirementMet: {
    color: theme.colors.success,
    fontWeight: '600',
  },
  // Error message
  errorMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.dangerSoft,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: theme.colors.danger,
    fontWeight: '500',
  },
  button: {
    backgroundColor: theme.colors.navy,
    borderRadius: 16,
    padding: SCREEN_WIDTH < 375 ? 16 : 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
    shadowColor: theme.colors.navy,
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
    color: theme.colors.white,
    fontSize: SCREEN_WIDTH < 375 ? 16 : 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
