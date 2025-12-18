import { useState, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Camera, Shield, Loader, Languages } from 'lucide-react-native';
import { verifyIdentityWithDidit } from '@/services/diditVerification';
import { useTranslation } from '@/contexts/LanguageContext';

export default function IdentityVerificationScreen() {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'tr' : 'en');
  };
  const [permission, requestPermission] = useCameraPermissions();
  const [isVerifying, setIsVerifying] = useState(false);
  const [facing, setFacing] = useState<CameraType>('front');
  const [captureStep, setCaptureStep] = useState<'selfie' | 'id_front' | 'id_back' | 'verifying'>('selfie');
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [idFrontUri, setIdFrontUri] = useState<string | null>(null);
  const [idBackUri, setIdBackUri] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Camera size={48} color="#667eea" strokeWidth={2} />
            </View>
          </View>
          <Text style={styles.title}>{t('registration.cameraPermissionTitle')}</Text>
          <Text style={styles.description}>
            {t('registration.cameraPermissionDescription')}
          </Text>
          <Pressable style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>{t('registration.grantPermission')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync();
      
      if (captureStep === 'selfie') {
        const selfieUriValue = photo.uri;
        setSelfieUri(selfieUriValue);
        setCaptureStep('id_front');
        setFacing('back'); // Switch to back camera for ID front
      } else if (captureStep === 'id_front') {
        const idFrontUriValue = photo.uri;
        setIdFrontUri(idFrontUriValue);
        setCaptureStep('id_back');
        // Keep back camera for ID back
      } else if (captureStep === 'id_back') {
        const idBackUriValue = photo.uri;
        setIdBackUri(idBackUriValue);
        setCaptureStep('verifying');
        
        // Wait a moment for state to update, then verify
        setTimeout(async () => {
          const currentSelfie = selfieUri;
          const currentIdFront = idFrontUri;
          const currentIdBack = idBackUriValue;
          
          if (!currentSelfie || !currentIdFront || !currentIdBack) {
            console.error('Missing images:', { currentSelfie, currentIdFront, currentIdBack });
            setIsVerifying(false);
            Alert.alert(t('common.error'), 'Missing images. Please try again.');
            setCaptureStep('selfie');
            setSelfieUri(null);
            setIdFrontUri(null);
            setIdBackUri(null);
            setFacing('front');
            return;
          }

          setIsVerifying(true);

          try {
            const result = await verifyIdentityWithDidit({
              frontImage: currentIdFront,
              backImage: currentIdBack,
              performDocumentLiveness: false,
            });

            setIsVerifying(false);

            // Check if verification was successful
            if (!result.success) {
              // Verification failed - show error message
              const errorMessage = result.error || 
                (result.critical_warnings 
                  ? 'Could not extract required information from the document. Please ensure the image is clear and all text is visible.'
                  : t('registration.verificationFailedMessage'));
              
              Alert.alert(
                t('registration.verificationFailed'),
                errorMessage,
                [
                    {
                      text: t('registration.tryAgain'),
                      onPress: () => {
                        setCaptureStep('selfie');
                        setSelfieUri(null);
                        setIdFrontUri(null);
                        setIdBackUri(null);
                        setFacing('front');
                      },
                    },
                ]
              );
              return;
            }

            // Check if we have critical data (name, DOB, document number)
            if (!result.has_critical_data || !result.data) {
              Alert.alert(
                t('registration.verificationFailed'),
                'Required information (name, date of birth, or document number) could not be extracted from the document. Please ensure the image is clear and try again.',
                [
                    {
                      text: t('registration.tryAgain'),
                      onPress: () => {
                        setCaptureStep('selfie');
                        setSelfieUri(null);
                        setIdFrontUri(null);
                        setIdBackUri(null);
                        setFacing('front');
                      },
                    },
                ]
              );
              return;
            }

            // Check if status is Declined
            if (result.status === 'Declined') {
              Alert.alert(
                t('registration.verificationFailed'),
                'Document verification was declined. Please ensure your ID is valid, not expired, and the image is clear.',
                [
                    {
                      text: t('registration.tryAgain'),
                      onPress: () => {
                        setCaptureStep('selfie');
                        setSelfieUri(null);
                        setIdFrontUri(null);
                        setIdBackUri(null);
                        setFacing('front');
                      },
                    },
                ]
              );
              return;
            }

            // Check for critical warnings even if success is true
            if (result.critical_warnings) {
              Alert.alert(
                t('registration.verificationFailed'),
                'Some critical information could not be detected from the document. Please ensure the image is clear and try again.',
                [
                    {
                      text: t('registration.tryAgain'),
                      onPress: () => {
                        setCaptureStep('selfie');
                        setSelfieUri(null);
                        setIdFrontUri(null);
                        setIdBackUri(null);
                        setFacing('front');
                      },
                    },
                ]
              );
              return;
            }

            // Success! Navigate to confirmation screen with Didit data
            const firstName = result.data.first_name || '';
            const lastName = result.data.last_name || '';
            const dateOfBirth = result.data.date_of_birth || '';

            // Validate that we have the minimum required data
            if (!firstName || !lastName || !dateOfBirth) {
              Alert.alert(
                t('registration.verificationFailed'),
                'Could not extract name or date of birth from the document. Please try again with a clearer image.',
                [
                    {
                      text: t('registration.tryAgain'),
                      onPress: () => {
                        setCaptureStep('selfie');
                        setSelfieUri(null);
                        setIdFrontUri(null);
                        setIdBackUri(null);
                        setFacing('front');
                      },
                    },
                ]
              );
              return;
            }

            router.push({
              pathname: '/register/confirm',
              params: {
                firstName: firstName,
                lastName: lastName,
                dateOfBirth: dateOfBirth,
                phoneNumber: '', // Will need to be entered separately
                email: '', // Will need to be entered separately
                documentNumber: result.data.document_number || '',
                diditData: JSON.stringify(result.data), // Store full Didit response
              },
            });
          } catch (error: any) {
            console.error('Verification error:', error);
            setIsVerifying(false);
            Alert.alert(t('common.error'), error.message || t('common.error'));
            setCaptureStep('selfie');
            setSelfieUri(null);
            setIdFrontUri(null);
            setIdBackUri(null);
            setFacing('front');
          }
        }, 100);
      }
    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert(t('common.error'), t('common.error'));
    }
  };

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
          {captureStep === 'selfie'
            ? t('registration.takeSelfie')
            : captureStep === 'id_front'
            ? t('registration.takeIdFront') || 'Take a photo of the front of your ID'
            : captureStep === 'id_back'
            ? t('registration.takeIdBack') || 'Take a photo of the back of your ID'
            : t('registration.verifying')}
        </Text>
      </View>

      {captureStep === 'verifying' ? (
        <View style={styles.verifyingContainer}>
          <View style={styles.verifyingIconContainer}>
            <View style={styles.verifyingIconCircle}>
              <Loader size={48} color="#667eea" strokeWidth={2} />
            </View>
          </View>
          <Text style={styles.verifyingText}>{t('registration.verifying')}</Text>
          <Text style={styles.verifyingSubtext}>{t('common.loading')}</Text>
        </View>
      ) : (
        <>
          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
            />
            <View style={styles.overlay}>
              {captureStep === 'selfie' && (
                <View style={styles.faceGuide}>
                  <View style={styles.guideCircle}>
                    <View style={styles.guideInnerCircle} />
                  </View>
                  <Text style={styles.guideText}>{t('registration.takeSelfie')}</Text>
                </View>
              )}
              {(captureStep === 'id_front' || captureStep === 'id_back') && (
                <View style={styles.idGuide}>
                  <View style={styles.guideRect} />
                  <Text style={styles.guideText}>
                    {captureStep === 'id_front' 
                      ? (t('registration.takeIdFront') || 'Front of ID')
                      : (t('registration.takeIdBack') || 'Back of ID')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.footer}>
            <Pressable
              style={[styles.captureButton, isVerifying && styles.buttonDisabled]}
              onPress={handleCapture}
              disabled={isVerifying}
            >
              <Camera size={24} color="#fff" strokeWidth={2.5} />
              <Text style={styles.captureButtonText}>
                {captureStep === 'selfie' 
                  ? t('registration.captureSelfie') 
                  : captureStep === 'id_front'
                  ? (t('registration.captureIdFront') || 'Capture Front')
                  : (t('registration.captureIdBack') || 'Capture Back')}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#667eea',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    padding: 18,
    width: '100%',
    alignItems: 'center',
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
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  faceGuide: {
    alignItems: 'center',
  },
  guideCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  guideInnerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#667eea',
    borderStyle: 'dashed',
  },
  idGuide: {
    alignItems: 'center',
  },
  guideRect: {
    width: 300,
    height: 200,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#fff',
    marginBottom: 24,
  },
  guideText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 32,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  captureButton: {
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
  captureButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  verifyingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  verifyingIconContainer: {
    marginBottom: 32,
  },
  verifyingIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#667eea',
  },
  verifyingText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  verifyingSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
