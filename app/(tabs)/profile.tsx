import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Phone, Mail, Calendar, Shield, LogOut, Languages } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from '@/contexts/LanguageContext';
import { Language } from '@/i18n/translations';
import { getCurrentUser, getCurrentSession, signOut } from '@/services/auth';
import { usersAPI } from '@/services/api';

interface UserData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  dateOfBirth: string;
  role: string;
  status?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Get current Supabase session
      const session = await getCurrentSession();
      const authUser = await getCurrentUser();
      
      // Try to get user ID from auth user metadata or session
      let userId: string | null = null;
      let phoneOrEmail: string | null = null;
      
      if (authUser?.user_metadata?.user_id) {
        userId = authUser.user_metadata.user_id;
      } else if (authUser?.id) {
        userId = authUser.id;
      }

      if (authUser?.phone) {
        phoneOrEmail = authUser.phone;
      } else if (authUser?.email) {
        phoneOrEmail = authUser.email;
      }

      // If we have userId, fetch from users table
      if (userId) {
        try {
          const user = await usersAPI.getById(userId);
          
          if (user) {
            setUserData({
              firstName: user.name || '',
              lastName: user.surname || '',
              phoneNumber: user.phone_number || '',
              email: user.email || undefined,
              dateOfBirth: user.date_of_birth || '',
              role: 'VOTER', // Default role, you can fetch from user_roles table if needed
              status: user.status || 'pending',
            });
            return; // Success, exit early
          }
        } catch (err) {
          console.error('Error fetching user data by ID:', err);
        }
      }

      // Fallback: Try to get user by phone/email
      if (phoneOrEmail) {
        try {
          const user = await usersAPI.getByPhoneOrEmail(phoneOrEmail);
          if (user) {
            setUserData({
              firstName: user.name || '',
              lastName: user.surname || '',
              phoneNumber: user.phone_number || '',
              email: user.email || undefined,
              dateOfBirth: user.date_of_birth || '',
              role: 'VOTER',
              status: user.status || 'pending',
            });
            return; // Success, exit early
          }
        } catch (err) {
          console.error('Error fetching user by phone/email:', err);
        }
      }

      // If we still don't have user data and no session/auth user, redirect to login
      if (!session && !authUser) {
        router.replace('/login');
        return;
      }

      // If we have session/auth but no user data, show error
      if (!userData) {
        console.warn('User session exists but user data not found in database');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Don't redirect on error, just show the error state
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoggingOut(true);
              // Sign out from Supabase
              await signOut();
              // Clear local storage
              await AsyncStorage.removeItem('hasSeenOnboarding');
              // Redirect to login
              router.replace('/login');
            } catch (error) {
              console.error('Logout error:', error);
              // Still redirect even if signOut fails
              router.replace('/login');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'tr' : 'en');
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>No user data found</Text>
          <Pressable style={styles.retryButton} onPress={loadUserData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        <Pressable style={styles.languageHeaderButton} onPress={toggleLanguage}>
          <Languages size={24} color="#667eea" strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <User size={48} color="#667eea" strokeWidth={2} />
          </View>
          <Text style={styles.name}>
            {userData.firstName} {userData.lastName}
          </Text>
          <Text style={styles.role}>{userData.role}</Text>
        </View>

        <View style={styles.languageSection}>
          <Text style={styles.languageSectionTitle}>{t('profile.language')}</Text>
          <Pressable style={styles.languageButton} onPress={toggleLanguage}>
            <View style={styles.languageButtonContent}>
              <Languages size={24} color="#667eea" strokeWidth={2} />
              <View style={styles.languageButtonText}>
                <Text style={styles.languageText}>
                  {language === 'en' ? '🇹🇷 Türkçe' : '🇬🇧 English'}
                </Text>
                <Text style={styles.languageSubtext}>
                  {language === 'en' ? t('profile.switchToTurkish') : t('profile.switchToEnglish')}
                </Text>
              </View>
            </View>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.personalInformation')}</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <User size={20} color="#667eea" strokeWidth={2} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('profile.fullName')}</Text>
              <Text style={styles.infoValue}>
                {userData?.firstName} {userData?.lastName}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Calendar size={20} color="#667eea" strokeWidth={2} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('registration.dateOfBirth')}</Text>
              <Text style={styles.infoValue}>
                {userData?.dateOfBirth
                  ? new Date(userData.dateOfBirth).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Phone size={20} color="#667eea" strokeWidth={2} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('registration.phoneNumber')}</Text>
              <Text style={styles.infoValue}>{userData?.phoneNumber || 'N/A'}</Text>
            </View>
          </View>

          {userData?.email && (
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Mail size={20} color="#667eea" strokeWidth={2} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('registration.email')}</Text>
                <Text style={styles.infoValue}>{userData.email}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Shield 
                size={20} 
                color={userData.status === 'verified' ? '#10b981' : userData.status === 'suspended' ? '#ef4444' : '#f59e0b'} 
                strokeWidth={2} 
              />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('profile.verificationStatus')}</Text>
              <Text style={[
                styles.infoValue,
                userData.status === 'verified' && styles.statusVerified,
                userData.status === 'suspended' && styles.statusSuspended,
                userData.status === 'pending' && styles.statusPending,
              ]}>
                {userData.status === 'verified' 
                  ? t('profile.verified') 
                  : userData.status === 'suspended'
                  ? t('profile.suspended') || 'Suspended'
                  : t('profile.pending') || 'Pending'}
              </Text>
            </View>
          </View>
        </View>

        <Pressable 
          style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]} 
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <LogOut size={20} color="#fff" strokeWidth={2.5} />
              <Text style={styles.logoutButtonText}>{t('profile.logout')}</Text>
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
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  languageHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  scrollContent: {
    padding: 24,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#667eea',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  languageSection: {
    marginBottom: 24,
  },
  languageSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  languageButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  languageButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageButtonText: {
    marginLeft: 16,
    flex: 1,
  },
  languageText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 4,
  },
  languageSubtext: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  infoRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusVerified: {
    color: '#10b981',
  },
  statusSuspended: {
    color: '#ef4444',
  },
  statusPending: {
    color: '#f59e0b',
  },
});
