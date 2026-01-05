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
  Languages,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';
import { registerUser } from '@/services/auth';
import { useTranslation } from '@/contexts/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FORM_STORAGE_KEY = '@confirmation_form_data';

export default function ConfirmationScreen() {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();
  const params = useLocalSearchParams();

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'tr' : 'en');
  }, [language, setLanguage]);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const isInitialLoad = useRef(true);

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
          } else {
            // Clear old data if sessionId doesn't match
            await AsyncStorage.removeItem(FORM_STORAGE_KEY);
            setPhoneNumber((params.phoneNumber as string) || '');
            setEmail((params.email as string) || '');
          }
        } else {
          setPhoneNumber((params.phoneNumber as string) || '');
          setEmail((params.email as string) || '');
        }
      } catch (error) {
        // Ignore errors, just start with empty form
      } finally {
        isInitialLoad.current = false;
      }
    };

    loadPersistedData();
  }, [params.sessionId]);

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
          })
        );
      } catch (error) {
        // Ignore storage errors
      }
    };

    // Debounce saves to avoid too frequent writes
    const timeoutId = setTimeout(saveData, 500);
    return () => clearTimeout(timeoutId);
  }, [phoneNumber, email, params.sessionId]);

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
      const error = 'Phone number is required';
      setErrorMessage(error);
      Alert.alert(t('common.error'), error);
      return;
    }

    setIsCreating(true);
    setErrorMessage(''); // Clear previous errors

    try {
      // Register user with Supabase Auth and add to users table
      const result = await registerUser({
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined,
        name: userData.firstName,
        surname: userData.lastName,
        dateOfBirth: userData.dateOfBirth,
        nationalId: userData.documentNumber,
        sessionId: userData.sessionId,
      });

      if (result.success) {
        // Clear persisted form data on success
        await AsyncStorage.removeItem(FORM_STORAGE_KEY);
        router.replace('/register/success');
      } else {
        const error = result.error || t('common.error');
        setErrorMessage(error);
        Alert.alert(t('common.error'), error);
        setIsCreating(false);
      }
    } catch (error: any) {
      const errorMsg = error.message || t('common.error');
      setErrorMessage(errorMsg);
      Alert.alert(t('common.error'), errorMsg);
      setIsCreating(false);
    }
  }, [phoneNumber, email, userData, t, router]);

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
          <Text style={styles.title}>Confirm Your Information</Text>
          <Text style={styles.subtitle}>
            Please verify your details before completing registration
          </Text>
        </View>

        <View style={styles.content}>
          {/* Verified Information Card */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <CheckCircle size={24} color="#6bcf7f" strokeWidth={2} />
              </View>
              <Text style={styles.cardHeaderText}>Verified Information</Text>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Full Name</Text>
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

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Document ID</Text>
                <Text style={styles.fieldValue}>
                  {userData.documentNumber}
                </Text>
              </View>
            </View>
          </View>

          {/* Contact Information Card */}
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

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxText}>
              You will use one-time passwords (OTP) sent to your phone number to log in. No need to remember a password!
            </Text>
          </View>

          {/* Error Display */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <AlertCircle size={20} color="#dc2626" strokeWidth={2} />
              <Text style={styles.errorBoxText}>{errorMessage}</Text>
            </View>
          ) : null}

          <Pressable
            style={[styles.button, isCreating && styles.buttonDisabled]}
            onPress={handleCreateAccount}
            disabled={isCreating}
          >
            {isCreating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonText}>Complete Registration</Text>
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
    backgroundColor: '#e7f5e9',
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
  infoBox: {
    backgroundColor: '#e7f5e9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#6bcf7f',
  },
  infoBoxText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2d5016',
    lineHeight: 22,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorBoxText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
    lineHeight: 22,
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
