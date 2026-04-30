import { useState, useRef } from 'react';
import { theme } from '@/theme';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, Phone, ArrowLeft, RefreshCw } from 'lucide-react-native';
import { sendOTP, verifyOTP } from '@/services/auth';
import { useTranslation } from '@/contexts/LanguageContext';

type Step = 'enter_contact' | 'enter_otp';

export default function LoginScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [step, setStep] = useState<Step>('enter_contact');
  const [contact, setContact] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpRefs = useRef<(TextInput | null)[]>([]);

  const handleSendOTP = async () => {
    const trimmed = contact.trim();
    if (!trimmed) {
      setError(t('login.enterContactError'));
      return;
    }
    setError('');
    setLoading(true);
    const result = await sendOTP(trimmed);
    setLoading(false);
    if (result.success) {
      setStep('enter_otp');
      startResendCooldown();
    } else {
      setError(language === 'en' ? result.error || t('login.sendFailed') : t('login.sendFailed'));
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (value: string, index: number) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const token = otp.join('');
    if (token.length !== 6) {
      setError(t('login.enterSixDigitCode'));
      return;
    }
    setError('');
    setLoading(true);
    const result = await verifyOTP(contact.trim(), token);
    setLoading(false);
    if (result.success) {
      router.replace('/(tabs)');
    } else {
      setError(language === 'en' ? result.error || t('login.invalidCode') : t('login.invalidCode'));
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setLoading(true);
    const result = await sendOTP(contact.trim());
    setLoading(false);
    if (result.success) {
      setOtp(['', '', '', '', '', '']);
      startResendCooldown();
      Alert.alert(t('login.codeSentTitle'), t('login.codeSentMessage'));
    } else {
      setError(language === 'en' ? result.error || t('login.resendFailed') : t('login.resendFailed'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color={theme.colors.navy} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Shield size={40} color={theme.colors.navy} strokeWidth={2} />
          </View>

          {step === 'enter_contact' ? (
            <>
              <Text style={styles.title}>{t('login.signIn')}</Text>
              <Text style={styles.subtitle}>
                {t('login.subtitle')}
              </Text>

              <View style={styles.inputWrapper}>
                <Phone size={18} color={theme.colors.navy} strokeWidth={2} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('login.phoneOrEmail')}
                  placeholderTextColor={theme.colors.textPlaceholder}
                  value={contact}
                  onChangeText={setContact}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSendOTP}
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleSendOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>{t('login.sendCode')}</Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>{t('login.enterCodeTitle')}</Text>
              <Text style={styles.subtitle}>
                {t('login.codeSentTo')}{'\n'}
                <Text style={styles.contactHighlight}>{contact}</Text>
              </Text>

              <View style={styles.otpRow}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { otpRefs.current[index] = ref; }}
                    style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                    value={digit}
                    onChangeText={(v) => handleOtpChange(v, index)}
                    onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    textAlign="center"
                  />
                ))}
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleVerifyOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>{t('login.verifySignIn')}</Text>
                )}
              </Pressable>

              <Pressable
                style={[styles.resendButton, resendCooldown > 0 && styles.resendDisabled]}
                onPress={handleResend}
                disabled={resendCooldown > 0 || loading}
              >
                <RefreshCw size={16} color={resendCooldown > 0 ? theme.colors.textPlaceholder : theme.colors.navy} strokeWidth={2} />
                <Text style={[styles.resendText, resendCooldown > 0 && styles.resendTextDisabled]}>
                  {resendCooldown > 0
                    ? t('login.resendInSeconds', { seconds: resendCooldown })
                    : t('login.resendCodeShort')}
                </Text>
              </Pressable>

              <Pressable onPress={() => { setStep('enter_contact'); setOtp(['', '', '', '', '', '']); setError(''); }}>
                <Text style={styles.changeContactText}>{t('login.changePhoneEmail')}</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.goldSoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: theme.colors.navy,
    marginBottom: 28,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  contactHighlight: {
    color: theme.colors.navy,
    fontWeight: '600',
  },
  inputWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.borderStrong,
    paddingHorizontal: 16,
    marginBottom: 8,
    height: 56,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  otpBox: {
    width: 46,
    height: 56,
    borderRadius: 12,
    backgroundColor: theme.colors.white,
    borderWidth: 1.5,
    borderColor: theme.colors.borderStrong,
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  otpBoxFilled: {
    borderColor: theme.colors.navy,
    backgroundColor: theme.colors.goldSoft,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: theme.colors.navy,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: theme.colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    padding: 8,
  },
  resendDisabled: {
    opacity: 0.5,
  },
  resendText: {
    color: theme.colors.navy,
    fontSize: 15,
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: theme.colors.textPlaceholder,
  },
  changeContactText: {
    color: theme.colors.textTertiary,
    fontSize: 14,
    marginTop: 16,
    textDecorationLine: 'underline',
  },
});
