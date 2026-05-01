import { useState, useEffect, useCallback } from 'react';
import { theme } from '@/theme';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, LogOut, Calendar, ChevronRight, Clock, AlertCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from '@/contexts/LanguageContext';
import { signOut } from '@/services/auth';
import { electionsAPI, Election } from '@/services/elections';

export default function DashboardScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState('');

  const fetchElections = useCallback(async () => {
    try {
      setError('');
      const data = await electionsAPI.list(false); // fetch all elections
      setElections(data);
    } catch (e: any) {
      setError(t('dashboard.loadElectionsError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    fetchElections();
  }, [fetchElections]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchElections();
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await Promise.allSettled([
        signOut(),
        AsyncStorage.removeItem('hasSeenOnboarding'),
      ]);
    } finally {
      router.replace('/login' as any);
      setIsLoggingOut(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isUpcoming = (dateStr: string) => new Date(dateStr) >= new Date();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.iconCircle}>
            <Shield size={28} color={theme.colors.navy} strokeWidth={2} />
          </View>
          <View>
            <Text style={styles.welcomeText}>SOVS</Text>
            <Text style={styles.subWelcomeText}>{t('dashboard.secureVotingShort')}</Text>
          </View>
        </View>
        <Pressable
          style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
          onPress={handleLogout}
          disabled={isLoggingOut}
          hitSlop={8}
          testID="logout-button"
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color={theme.colors.navy} />
          ) : (
            <LogOut size={20} color={theme.colors.navy} strokeWidth={2} />
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.navy} />}
      >
        <Text style={styles.sectionTitle}>{t('dashboard.elections')}</Text>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.navy} />
            <Text style={styles.loadingText}>{t('dashboard.loadingElections')}</Text>
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <AlertCircle size={20} color={theme.colors.danger} strokeWidth={2} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : elections.length === 0 ? (
          <View style={styles.emptyCard}>
            <Calendar size={40} color={theme.colors.borderStrong} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>{t('dashboard.noElectionsYet')}</Text>
            <Text style={styles.emptySubtitle}>{t('dashboard.electionsWillAppear')}</Text>
          </View>
        ) : (
          elections.map((election) => (
            <Pressable
              key={election.election_id}
              style={styles.electionCard}
              onPress={() => router.push({
                pathname: '/election/[id]',
                params: { id: election.election_id },
              } as any)}
            >
              <View style={styles.electionIconWrapper}>
                <Calendar size={22} color={theme.colors.navy} strokeWidth={2} />
              </View>
              <View style={styles.electionContent}>
                <Text style={styles.electionTitle} numberOfLines={2}>{election.title}</Text>
                <View style={styles.electionMeta}>
                  <Clock size={13} color={theme.colors.textTertiary} strokeWidth={2} />
                  <Text style={styles.electionDate}>{formatDate(election.election_date)}</Text>
                </View>
                {!!election.election_type && (
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>
                      {String(election.election_type).replaceAll('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                )}
                {isUpcoming(election.election_date) ? (
                  <View style={styles.upcomingBadge}>
                    <Text style={styles.upcomingBadgeText}>{t('dashboard.upcoming')}</Text>
                  </View>
                ) : (
                  <View style={styles.pastBadge}>
                    <Text style={styles.pastBadgeText}>{t('dashboard.past')}</Text>
                  </View>
                )}
              </View>
              <ChevronRight size={20} color={theme.colors.borderStrong} strokeWidth={2} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.white,
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.goldSoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.navy,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  subWelcomeText: {
    fontSize: 13,
    color: theme.colors.textTertiary,
    marginTop: 1,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.goldSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonDisabled: {
    opacity: 0.7,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    color: theme.colors.textTertiary,
    fontSize: 15,
  },
  errorCard: {
    backgroundColor: theme.colors.dangerSoft,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.danger,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 14,
    flex: 1,
  },
  emptyCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
  electionCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.foreground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  electionIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.colors.goldSoft,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  electionContent: {
    flex: 1,
    gap: 4,
  },
  electionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    lineHeight: 22,
  },
  electionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  electionDate: {
    fontSize: 13,
    color: theme.colors.textTertiary,
  },
  upcomingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.successSoft,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  upcomingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.success,
  },
  pastBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  pastBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textTertiary,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.goldSoft,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: theme.colors.navy,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.navy,
  },
});
