import { useState, useEffect, useCallback } from 'react';
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
import { signOut } from '@/services/auth';
import { electionsAPI, Election } from '@/services/elections';

export default function DashboardScreen() {
  const router = useRouter();
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchElections = useCallback(async () => {
    try {
      setError('');
      const data = await electionsAPI.list(false); // fetch all elections
      setElections(data);
    } catch (e: any) {
      setError('Could not load elections. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchElections();
  }, [fetchElections]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchElections();
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
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
            <Shield size={28} color="#667eea" strokeWidth={2} />
          </View>
          <View>
            <Text style={styles.welcomeText}>SOVS</Text>
            <Text style={styles.subWelcomeText}>Secure Online Voting</Text>
          </View>
        </View>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#667eea" strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#667eea" />}
      >
        <Text style={styles.sectionTitle}>Elections</Text>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Loading elections...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <AlertCircle size={20} color="#ef4444" strokeWidth={2} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : elections.length === 0 ? (
          <View style={styles.emptyCard}>
            <Calendar size={40} color="#c7d2fe" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No Elections Yet</Text>
            <Text style={styles.emptySubtitle}>Elections will appear here once scheduled</Text>
          </View>
        ) : (
          elections.map((election) => (
            <Pressable
              key={election.election_id}
              style={styles.electionCard}
              onPress={() => router.push(`/election/${election.election_id}`)}
            >
              <View style={styles.electionIconWrapper}>
                <Calendar size={22} color="#667eea" strokeWidth={2} />
              </View>
              <View style={styles.electionContent}>
                <Text style={styles.electionTitle} numberOfLines={2}>{election.title}</Text>
                <View style={styles.electionMeta}>
                  <Clock size={13} color="#999" strokeWidth={2} />
                  <Text style={styles.electionDate}>{formatDate(election.election_date)}</Text>
                </View>
                {isUpcoming(election.election_date) ? (
                  <View style={styles.upcomingBadge}>
                    <Text style={styles.upcomingBadgeText}>Upcoming</Text>
                  </View>
                ) : (
                  <View style={styles.pastBadge}>
                    <Text style={styles.pastBadgeText}>Past</Text>
                  </View>
                )}
              </View>
              <ChevronRight size={20} color="#c7d2fe" strokeWidth={2} />
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
    gap: 14,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  subWelcomeText: {
    fontSize: 13,
    color: '#888',
    marginTop: 1,
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
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    color: '#888',
    fontSize: 15,
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    flex: 1,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  electionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  electionIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#f0f4ff',
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
    color: '#1a1a1a',
    lineHeight: 22,
  },
  electionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  electionDate: {
    fontSize: 13,
    color: '#888',
  },
  upcomingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  upcomingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16a34a',
  },
  pastBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pastBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
  },
});
