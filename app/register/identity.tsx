import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Alert, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Shield, Loader, Languages, ExternalLink } from 'lucide-react-native';
import { createDiditSession, getDiditSessionResults } from '@/services/diditSession';
import { useTranslation } from '@/contexts/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
            // Navigate directly to password page
            router.push({
              pathname: '/register/password',
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
        
        // If not approved or missing data, start polling
        const interval = setInterval(() => {
          pollSessionResults(callbackSessionId);
        }, 3000);
        setPollingInterval(interval);
      } catch (error) {
        console.error('Error checking session on return:', error);
        // Start polling as fallback
        const interval = setInterval(() => {
          pollSessionResults(callbackSessionId);
        }, 3000);
        setPollingInterval(interval);
      }
    };

    // Check for params from URL (web callback - when DIDIT redirects back)
    const sessionIdFromParams = params.session_id as string | undefined;
    if (sessionIdFromParams && !sessionId) {
      processSessionCallback(sessionIdFromParams);
    }
  }, [params.session_id, sessionId]);

  // Handle deep links for mobile
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

  // Poll for session results
  const pollSessionResults = async (sessionId: string) => {
    try {
      const result = await getDiditSessionResults(sessionId);
      
      // Check if verification is complete
      const status = result.status || result.decision_status;
      if (status === 'Approved' || status === 'Declined') {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        
        setIsVerifying(false);
        
        if (status === 'Approved') {
          // Verification approved - proceed to password setup
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
            pathname: '/register/password',
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
          // Verification declined
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
      console.error('Error polling session:', error);
      // Continue polling on error (session might not be ready yet)
    }
  };

  const handleStartVerification = async () => {
    try {
      setIsCreatingSession(true);
      const returnUrl = Linking.createURL('/register/identity');
      
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

      setSessionId(session.session_id);
      setIsCreatingSession(false);
      setIsVerifying(true);

      // Start polling for results as soon as the session URL opens
      let activeInterval: NodeJS.Timeout | null = null;
      if (session.session_id) {
        activeInterval = setInterval(() => {
          pollSessionResults(session.session_id!);
        }, 3000); // Poll every 3 seconds
        setPollingInterval(activeInterval);
        
        // Also poll immediately
        setTimeout(() => pollSessionResults(session.session_id!), 2000);
      }

      // Open Didit verification URL and expect to return via deep link
      const result = await WebBrowser.openAuthSessionAsync(session.url, returnUrl);

      // If the user cancels the auth session, stop verifying so they can retry
      if (result.type === 'cancel' || result.type === 'dismiss') {
        if (activeInterval) {
          clearInterval(activeInterval);
        }
        setPollingInterval(null);
        setIsVerifying(false);
        return;
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
            <Pressable style={styles.languageButton} onPress={toggleLanguage}>
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
          <Pressable style={styles.languageButton} onPress={toggleLanguage}>
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
