import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Mail,
  Phone,
  Shield,
  ArrowLeft,
  CheckCircle2,
  Languages,
} from 'lucide-react-native';
import { sendOTP, verifyOTP } from '@/services/auth';
import { usersAPI } from '@/services/api';
import { useTranslation } from '@/contexts/LanguageContext';

export default function LoginScreen() {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'tr' : 'en');
  };
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOTP = async () => {
    if (!phoneOrEmail.trim()) {
      Alert.alert(t('common.error'), t('login.phoneOrEmail'));
      return;
    }

    setIsLoading(true);

    try {
      // Check if user exists in users table
      const user = await usersAPI.getByPhoneOrEmail(phoneOrEmail.trim());

      if (!user) {
        Alert.alert(t('common.error'), t('login.noAccountFound'));
        setIsLoading(false);
        return;
      }

      // Send OTP via Supabase Auth
      const result = await sendOTP(phoneOrEmail.trim());

      if (result.success) {
        setOtpSent(true);
        setStep('otp');
        setCountdown(60);
        
        // In development mode, show OTP code in alert
        if (result.otpCode) {
          Alert.alert(
            t('login.otpSent'),
            `${t('login.otpSentMessage')}\n\n🔐 DEV MODE - Your OTP: ${result.otpCode}`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(t('login.otpSent'), t('login.otpSentMessage'));
        }
      } else {
        Alert.alert(t('common.error'), result.error || t('common.error'));
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.trim().length !== 6) {
      Alert.alert(t('common.error'), t('login.enterOTP'));
      return;
    }

    setIsLoading(true);

    try {
      const result = await verifyOTP(phoneOrEmail.trim(), otp.trim());

      if (result.success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert(
          t('registration.verificationFailed'),
          result.error || t('common.error')
        );
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setCountdown(60);
    await handleSendOTP();
  };

  const isEmail = phoneOrEmail.includes('@');
  const IconComponent = isEmail ? Mail : Phone;

  if (step === 'otp') {
    return (
      <View style={styles.container}>
        <View style={styles.languageHeader}>
          <Pressable style={styles.languageButton} onPress={toggleLanguage}>
            <Languages size={20} color="#667eea" strokeWidth={2} />
          </Pressable>
        </View>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
              <View style={styles.headerIconContainer}>
                <View style={styles.headerIconCircle}>
                  <Shield size={32} color="#667eea" strokeWidth={2} />
                </View>
              </View>

              <Text style={styles.title}>{t('login.enterCode')}</Text>
              <Text style={styles.subtitle}>
                {t('login.codeSent')}
                {'\n'}
                <Text style={styles.phoneEmail}>{phoneOrEmail}</Text>
              </Text>

              <View style={styles.otpContainer}>
                <TextInput
                  style={styles.otpInput}
                  placeholder="000000"
                  placeholderTextColor="#999"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
                <View style={styles.otpDots}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.otpDot,
                        i < otp.length && styles.otpDotFilled,
                      ]}
                    />
                  ))}
                </View>
              </View>

              <Pressable
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleVerifyOTP}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <CheckCircle2 size={20} color="#fff" strokeWidth={2.5} />
                    <Text style={styles.buttonText}>
                      {t('login.verifyContinue')}
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable
                style={styles.resendButton}
                onPress={handleResendOTP}
                disabled={countdown > 0}
              >
                <Text
                  style={[
                    styles.resendText,
                    countdown > 0 && styles.resendDisabled,
                  ]}
                >
                  {countdown > 0
                    ? `${t('login.resendIn')} ${countdown}s`
                    : t('login.resendCode')}
                </Text>
              </Pressable>

              <Pressable
                style={styles.backButton}
                onPress={() => {
                  setStep('input');
                  setOtp('');
                }}
              >
                <ArrowLeft size={16} color="#667eea" strokeWidth={2.5} />
                <Text style={styles.backText}>{t('login.changeContact')}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.languageHeader}>
        <Pressable style={styles.languageButton} onPress={toggleLanguage}>
          <Languages size={20} color="#667eea" strokeWidth={2} />
        </Pressable>
      </View>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.headerIconContainer}>
              <View style={styles.headerIconCircle}>
                <Shield size={32} color="#667eea" strokeWidth={2} />
              </View>
            </View>

            <Text style={styles.title}>{t('login.title')}</Text>
            <Text style={styles.subtitle}>{t('login.subtitle')}</Text>

            <View style={styles.inputWrapper}>
              <View style={styles.inputIconContainer}>
                <IconComponent size={20} color="#667eea" strokeWidth={2} />
              </View>
              <TextInput
                style={styles.input}
                placeholder={t('login.phoneOrEmail')}
                placeholderTextColor="#999"
                value={phoneOrEmail}
                onChangeText={setPhoneOrEmail}
                keyboardType="default"
                autoCapitalize="none"
                autoComplete="tel"
              />
            </View>

            <Pressable
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSendOTP}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{t('login.sendCode')}</Text>
              )}
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.note}>
                {t('login.noAccount')}{' '}
                <Text
                  style={styles.linkText}
                  onPress={() => router.push('/register/identity')}
                >
                  {t('login.registerNow')}
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  languageHeader: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
  },
  languageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  headerIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#667eea',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 24,
  },
  phoneEmail: {
    fontWeight: '700',
    color: '#667eea',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 24,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  inputIconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 18,
    color: '#1a1a1a',
  },
  otpContainer: {
    marginBottom: 32,
  },
  otpInput: {
    borderWidth: 2,
    borderColor: '#667eea',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    fontSize: 32,
    textAlign: 'center',
    letterSpacing: 12,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  otpDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  otpDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
    borderWidth: 2,
    borderColor: '#ccc',
  },
  otpDotFilled: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  button: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
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
  resendButton: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 15,
    color: '#667eea',
    fontWeight: '600',
  },
  resendDisabled: {
    color: '#999',
  },
  backButton: {
    marginTop: 24,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  backText: {
    fontSize: 15,
    color: '#667eea',
    fontWeight: '500',
  },
  footer: {
    marginTop: 32,
  },
  note: {
    textAlign: 'center',
    fontSize: 15,
    color: '#666',
  },
  linkText: {
    color: '#667eea',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
