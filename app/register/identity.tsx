import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Alert, ActivityIndicator, Dimensions, ScrollView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Shield, Loader, Languages, ExternalLink } from 'lucide-react-native';
import { createDiditSession, getDiditSessionResults } from '@/services/diditSession';
import { useTranslation } from '@/contexts/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DIDIT_SESSION_KEY = '@didit_verification_session';

// Cross-platform storage helper
const storage = {
  async getItem(key: string) {
    try {
      // Try localStorage first (web)
      if (typeof localStorage !== 'undefined') {
        const value = localStorage.getItem(key);
        if (value) {
          console.log(`[Storage] Retrieved from localStorage: ${key}`);
          return value;
        }
      }
      // Fall back to AsyncStorage (mobile)
      const value = await AsyncStorage.getItem(key);
      if (value) {
        console.log(`[Storage] Retrieved from AsyncStorage: ${key}`);
      }
      return value;
    } catch (error) {
      console.error('[Storage] getItem error:', error);
      return null;
    }
  },
  async setItem(key: string, value: string) {
    try {
      // Try localStorage first (web)
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
        console.log(`[Storage] Saved to localStorage: ${key} = ${value.substring(0, 50)}...`);
        return;
      }
      // Fall back to AsyncStorage (mobile)
      await AsyncStorage.setItem(key, value);
      console.log(`[Storage] Saved to AsyncStorage: ${key} = ${value.substring(0, 50)}...`);
    } catch (error) {
      console.error('[Storage] setItem error:', error);
    }
  },
  async removeItem(key: string) {
    try {
      // Try localStorage first (web)
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
        console.log(`[Storage] Removed from localStorage: ${key}`);
        return;
      }
      // Fall back to AsyncStorage (mobile)
      await AsyncStorage.removeItem(key);
      console.log(`[Storage] Removed from AsyncStorage: ${key}`);
    } catch (error) {
      console.error('[Storage] removeItem error:', error);
    }
  },
};

WebBrowser.maybeCompleteAuthSession();

export default function IdentityVerificationScreen() {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();
  const params = useLocalSearchParams();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'tr' : 'en');
  };

  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Restore verification session if it exists (for page reloads after DIDIT callback)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        console.log('[DIDIT] Checking for saved session...');
        const savedSession = await storage.getItem(DIDIT_SESSION_KEY);
        if (savedSession) {
          const { sessionId: savedSessionId } = JSON.parse(savedSession);
          if (savedSessionId) {
            console.log('[DIDIT] Restored DIDIT session from storage:', savedSessionId);
            setSessionId(savedSessionId);
            setIsVerifying(true);
            
            // Start polling immediately with a ref to avoid closure issues
            console.log('[DIDIT] Starting polling for session:', savedSessionId);
          }
        } else {
          console.log('[DIDIT] No saved session found');
        }
      } catch (error) {
        console.error('[DIDIT] Error restoring session:', error);
      }
    };

    restoreSession();
  }, []);

  // Check for return from Didit callback with session_id in URL
  useEffect(() => {
    const processSessionCallback = async (callbackSessionId: string) => {
      if (!callbackSessionId) return;
      
      setSessionId(callbackSessionId);
      setIsVerifying(true);
      
      // Immediately check session results
      try {
        const result = await getDiditSessionResults(callbackSessionId);
        const verificationStatus = result.status || result.decision_status;
        
        if (verificationStatus === 'Approved') {
          const userData = result.user_data || {};
          
          if (userData.first_name && userData.last_name && userData.date_of_birth) {
            // Navigate to confirmation page
            router.push({
              pathname: '/register/confirmation',
              params: {
                sessionId: callbackSessionId,
                firstName: userData.first_name,
                lastName: userData.last_name,
                dateOfBirth: userData.date_of_birth,
                documentNumber: userData.document_number || '',
                diditData: JSON.stringify(result),
              },
            });
            return;
          }
        }
        
        // If not approved or missing data, let the polling effect handle it
        // The polling effect will start when sessionId and isVerifying are set
      } catch (error) {
        console.error('[DIDIT] Error checking session on return:', error);
        // Polling effect will handle it
      }
    };

    // Check for params from URL (web callback - when DIDIT redirects back)
    const sessionIdFromParams = params.session_id as string | undefined;
    if (sessionIdFromParams && !sessionId) {
      console.log('[DIDIT] Found session_id in URL params:', sessionIdFromParams);
      processSessionCallback(sessionIdFromParams);
    }
  }, [params.session_id, sessionId]);

  // Start polling when sessionId is set (from restoration or new verification)
  useEffect(() => {
    if (sessionId && isVerifying && !pollingInterval) {
      console.log('[DIDIT] Starting polling for session:', sessionId);
      
      // Create a polling function that doesn't depend on state
      const poll = async () => {
        try {
          const result = await getDiditSessionResults(sessionId);
          const status = result.status || result.decision_status;
          
          if (status === 'Approved' || status === 'Declined') {
            if (pollingInterval) {
              clearInterval(pollingInterval);
              setPollingInterval(null);
            }
            
            // Clear saved session
            try {
              await storage.removeItem(DIDIT_SESSION_KEY);
            } catch (error) {
              console.error('[DIDIT] Error clearing session:', error);
            }
            
            setIsVerifying(false);
            
            if (status === 'Approved') {
              const userData = result.user_data || {};
              
              if (!userData.first_name || !userData.last_name || !userData.date_of_birth) {
                Alert.alert(
                  t('registration.verificationFailed'),
                  'Could not extract required information from the verification. Please try again.',
                  [
                    {
                      text: t('registration.tryAgain'),
                      onPress: () => {
                        setSessionId(null);
                      },
                    },
                  ]
                );
                return;
              }

              router.push({
                pathname: '/register/confirmation',
                params: {
                  sessionId: sessionId,
                  firstName: userData.first_name,
                  lastName: userData.last_name,
                  dateOfBirth: userData.date_of_birth,
                  documentNumber: userData.document_number || '',
                  diditData: JSON.stringify(result),
                },
              });
            } else {
              Alert.alert(
                t('registration.verificationFailed'),
                'Your identity verification was declined. Please ensure your ID is valid and try again.',
                [
                  {
                    text: t('registration.tryAgain'),
                    onPress: () => {
                      setSessionId(null);
                    },
                  },
                ]
              );
            }
          }
        } catch (error: any) {
          console.error('[DIDIT] Error polling session:', error);
        }
      };
      
      const interval = setInterval(poll, 3000);
      setPollingInterval(interval);
      
      // Poll immediately
      poll();
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [sessionId, isVerifying]);
  useEffect(() => {
    const handleUrl = async (event: { url: string }) => {
      const url = new URL(event.url);
      const returnedSessionId = url.searchParams.get('session_id');
      if (returnedSessionId && !sessionId) {
        // Don't process if we already have a sessionId (prevent double processing)
        // The params-based effect above will handle it
        return;
      }
    };

    // Handle initial URL (web)
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    // Listen for URL changes (deep links for mobile)
    const subscription = Linking.addEventListener('url', handleUrl);

    return () => {
      subscription.remove();
    };
  }, [sessionId]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const handleStartVerification = async () => {
    try {
      setIsCreatingSession(true);
      const returnUrl = Linking.createURL('/register/identity');
      console.log('[DIDIT] Creating session with returnUrl:', returnUrl);
      
      // Create Didit session
      const session = await createDiditSession(
        undefined, // vendor_data - can be user ID if available
        null, // metadata
        language === 'tr' ? 'tr' : 'en', // language
        returnUrl
      );

      if (!session.success || !session.url) {
        throw new Error('Failed to create verification session');
      }

      const sessionId = session.session_id;
      console.log('[DIDIT] Session created with ID:', sessionId);
      
      // Save session to storage so it persists across page reloads
      try {
        const sessionData = JSON.stringify({ sessionId, createdAt: Date.now() });
        console.log('[DIDIT] About to save to storage:', sessionData);
        await storage.setItem(DIDIT_SESSION_KEY, sessionData);
        console.log('[DIDIT] Session saved successfully');
      } catch (error) {
        console.error('[DIDIT] Error saving session:', error);
      }
      
      setSessionId(sessionId);
      setIsCreatingSession(false);
      setIsVerifying(true);

      // Open Didit verification URL
      // For web, open in a new window/tab so the current page stays loaded and can handle the redirect back
      // For mobile, use WebBrowser which will open in a browser and return via deep link
      if (Platform.OS === 'web' || typeof window !== 'undefined') {
        // On web, open DIDIT in a new window
        const diditWindow = window.open(session.url, '_blank');
        if (!diditWindow) {
          Alert.alert(
            t('common.error'),
            'Please allow popups for this site to continue with verification',
          );
          setIsVerifying(false);
          await storage.removeItem(DIDIT_SESSION_KEY);
        }
        // The polling effect will handle checking the status
        // When DIDIT redirects back, it will reload this page with the session restored from localStorage
      } else {
        // On mobile, open in browser and expect to return via deep link
        const result = await WebBrowser.openAuthSessionAsync(session.url, returnUrl);

        // If the user cancels the auth session, stop verifying so they can retry
        if (result.type === 'cancel' || result.type === 'dismiss') {
          setIsVerifying(false);
          // Clear saved session
          try {
            await storage.removeItem(DIDIT_SESSION_KEY);
          } catch (error) {
            console.error('[DIDIT] Error clearing session:', error);
          }
          return;
        }
      }
    } catch (error: any) {
      setIsCreatingSession(false);
      setIsVerifying(false);
      Alert.alert(
        t('common.error'),
        error.message || 'Failed to start verification',
        [
          {
            text: 'OK',
            onPress: () => {},
          },
        ]
      );
    }
  };

  if (isVerifying) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{t('registration.step1')}</Text>
            </View>
            <Pressable style={styles.languageButton} onPress={toggleLanguage} testID="language-button">
              <Languages size={20} color="#667eea" strokeWidth={2} />
            </Pressable>
          </View>
          <Text style={styles.title}>{t('registration.identityVerification')}</Text>
          <Text style={styles.subtitle}>{t('registration.verifying')}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.verifyingContainer}>
          <View style={styles.verifyingIconContainer}>
            <View style={styles.verifyingIconCircle}>
              <Loader size={48} color="#667eea" strokeWidth={2} />
            </View>
          </View>
          <Text style={styles.verifyingText}>{t('registration.verifying')}</Text>
          <Text style={styles.verifyingSubtext}>
            {t('common.loading')}
            {'\n'}
            Please complete the verification in the browser window.
          </Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{t('registration.step1')}</Text>
          </View>
          <Pressable style={styles.languageButton} onPress={toggleLanguage}  testID="language-toggle">
            <Languages size={20} color="#667eea" strokeWidth={2} />
          </Pressable>
        </View>
        <Text style={styles.title}>{t('registration.identityVerification')}</Text>
        <Text style={styles.subtitle}>
          Verify your identity using Didit. You'll be redirected to complete the verification process.
        </Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Shield size={SCREEN_WIDTH < 375 ? 48 : 64} color="#667eea" strokeWidth={2} />
          </View>
        </View>

        <Text style={styles.description}>
          Click the button below to start the identity verification process. You'll be asked to:
        </Text>

        <View style={styles.stepsList}>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>Take a selfie</Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>Capture your ID document (front and back)</Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>Complete verification</Text>
          </View>
        </View>

        <Pressable
          style={[styles.button, (isCreatingSession || isVerifying) && styles.buttonDisabled]}
          onPress={handleStartVerification}
          disabled={isCreatingSession || isVerifying}
        >
          {isCreatingSession ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <ExternalLink size={20} color="#fff" strokeWidth={2.5} />
              <Text style={styles.buttonText}>Start Verification</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    flexGrow: 1,
    padding: SCREEN_WIDTH < 375 ? 20 : 32,
    paddingBottom: SCREEN_WIDTH < 375 ? 24 : 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: SCREEN_WIDTH < 375 ? 24 : 32,
  },
  iconCircle: {
    width: SCREEN_WIDTH < 375 ? 100 : 120,
    height: SCREEN_WIDTH < 375 ? 100 : 120,
    borderRadius: SCREEN_WIDTH < 375 ? 50 : 60,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#667eea',
  },
  description: {
    fontSize: SCREEN_WIDTH < 375 ? 14 : 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: SCREEN_WIDTH < 375 ? 24 : 32,
    lineHeight: 24,
    paddingHorizontal: SCREEN_WIDTH < 375 ? 8 : 0,
  },
  stepsList: {
    width: '100%',
    marginBottom: SCREEN_WIDTH < 375 ? 32 : 40,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: SCREEN_WIDTH < 375 ? 12 : 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  stepNumber: {
    width: SCREEN_WIDTH < 375 ? 28 : 32,
    height: SCREEN_WIDTH < 375 ? 28 : 32,
    borderRadius: SCREEN_WIDTH < 375 ? 14 : 16,
    backgroundColor: '#667eea',
    color: '#fff',
    fontSize: SCREEN_WIDTH < 375 ? 14 : 16,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: SCREEN_WIDTH < 375 ? 28 : 32,
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: SCREEN_WIDTH < 375 ? 14 : 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  button: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    padding: SCREEN_WIDTH < 375 ? 16 : 18,
    width: '100%',
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
  verifyingContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SCREEN_WIDTH < 375 ? 20 : 32,
    backgroundColor: '#fff',
    minHeight: '100%',
  },
  verifyingIconContainer: {
    marginBottom: SCREEN_WIDTH < 375 ? 24 : 32,
  },
  verifyingIconCircle: {
    width: SCREEN_WIDTH < 375 ? 100 : 120,
    height: SCREEN_WIDTH < 375 ? 100 : 120,
    borderRadius: SCREEN_WIDTH < 375 ? 50 : 60,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#667eea',
  },
  verifyingText: {
    fontSize: SCREEN_WIDTH < 375 ? 20 : 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
    paddingHorizontal: SCREEN_WIDTH < 375 ? 16 : 0,
  },
  verifyingSubtext: {
    fontSize: SCREEN_WIDTH < 375 ? 14 : 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SCREEN_WIDTH < 375 ? 16 : 0,
  },
});
