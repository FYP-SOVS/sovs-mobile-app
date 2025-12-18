import { useState, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Camera, Shield, Loader, Languages } from 'lucide-react-native';
import { verifyIdentity } from '@/services/mockIdentityVerification';
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
  const [captureStep, setCaptureStep] = useState<'selfie' | 'id' | 'verifying'>('selfie');
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [idUri, setIdUri] = useState<string | null>(null);
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
        setSelfieUri(photo.uri);
        setCaptureStep('id');
        setFacing('back');
      } else if (captureStep === 'id') {
        setIdUri(photo.uri);
        setCaptureStep('verifying');
        await handleVerify();
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('common.error'));
    }
  };

  const handleVerify = async () => {
    if (!selfieUri || !idUri) return;

    setIsVerifying(true);

    try {
      const result = await verifyIdentity({
        selfieImage: selfieUri,
        idImage: idUri,
      });

      if (result.success && result.nationalIdNumber) {
        router.push({
          pathname: '/register/government-data',
          params: { nationalIdNumber: result.nationalIdNumber },
        });
      } else {
        setIsVerifying(false);
        Alert.alert(
          t('registration.verificationFailed'),
          t('registration.verificationFailedMessage'),
          [
            {
              text: t('registration.tryAgain'),
              onPress: () => {
                setCaptureStep('selfie');
                setSelfieUri(null);
                setIdUri(null);
                setFacing('front');
              },
            },
          ]
        );
      }
    } catch (error) {
      setIsVerifying(false);
      Alert.alert(t('common.error'), t('common.error'));
      setCaptureStep('selfie');
      setSelfieUri(null);
      setIdUri(null);
      setFacing('front');
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
            : captureStep === 'id'
            ? t('registration.takeIdPhoto')
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
              {captureStep === 'id' && (
                <View style={styles.idGuide}>
                  <View style={styles.guideRect} />
                  <Text style={styles.guideText}>{t('registration.takeIdPhoto')}</Text>
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
                {captureStep === 'selfie' ? t('registration.captureSelfie') : t('registration.captureId')}
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
