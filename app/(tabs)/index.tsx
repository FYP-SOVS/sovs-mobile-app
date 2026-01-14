import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, CheckCircle2, Clock, AlertCircle, LogOut } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from '@/contexts/LanguageContext';

export default function DashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('hasSeenOnboarding');
      router.replace('/');
    } catch (error) {
      router.replace('/');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.iconCircle}>
            <Shield size={32} color="#667eea" strokeWidth={2} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.welcomeText}>{t('dashboard.welcome')}</Text>
            <Text style={styles.subWelcomeText}>{t('dashboard.secureVotingSystem')}</Text>
          </View>
        </View>
<Pressable
  onPress={handleLogout}
  accessibilityRole="button"
  testID="logout-button"
>

          <LogOut size={20} color="#667eea" strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <CheckCircle2 size={24} color="#10b981" strokeWidth={2.5} />
            <Text style={styles.statusTitle}>{t('dashboard.accountVerified')}</Text>
          </View>
          <Text style={styles.statusDescription}>
            {t('dashboard.accountVerifiedDescription')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.quickActions')}</Text>
          
          <View style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Clock size={24} color="#667eea" strokeWidth={2} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{t('dashboard.upcomingElections')}</Text>
              <Text style={styles.actionDescription}>{t('dashboard.noElectionsScheduled')}</Text>
            </View>
          </View>

          <View style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Shield size={24} color="#667eea" strokeWidth={2} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{t('dashboard.votingStatus')}</Text>
              <Text style={styles.actionDescription}>{t('dashboard.accountReady')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('common.information')}</Text>
          
          <View style={styles.infoCard}>
            <AlertCircle size={20} color="#f59e0b" strokeWidth={2} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>{t('dashboard.votingPeriod')}</Text>
              <Text style={styles.infoText}>
                {t('dashboard.votingPeriodDescription')}
              </Text>
            </View>
          </View>
        </View>
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#667eea',
  },
  headerText: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  subWelcomeText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 24,
  },
  statusCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#065f46',
    marginLeft: 12,
  },
  statusDescription: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 18,
  },
});
