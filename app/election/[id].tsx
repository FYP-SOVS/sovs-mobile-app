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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, Users, ChevronRight, AlertCircle, User, Clock } from 'lucide-react-native';
import { electionsAPI, candidatesAPI, Election, Candidate } from '@/services/elections';

export default function ElectionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setError('');
      const [electionData, candidatesData] = await Promise.all([
        electionsAPI.getById(id),
        candidatesAPI.listByElection(id),
      ]);
      setElection(electionData);
      setCandidates(candidatesData);
    } catch (e: any) {
      setError('Could not load election details. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isUpcoming = (dateStr: string) => new Date(dateStr) >= new Date();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading election...</Text>
      </View>
    );
  }

  if (error || !election) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color="#667eea" strokeWidth={2} />
          </Pressable>
        </View>
        <View style={styles.centered}>
          <AlertCircle size={40} color="#ef4444" strokeWidth={1.5} />
          <Text style={styles.errorTitle}>Failed to load</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const upcoming = isUpcoming(election.election_date);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#667eea" strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Election Details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#667eea" />}
      >
        {/* Election Info Card */}
        <View style={styles.electionCard}>
          <View style={styles.electionCardHeader}>
            <View style={styles.electionIconWrapper}>
              <Calendar size={26} color="#667eea" strokeWidth={2} />
            </View>
            {upcoming ? (
              <View style={styles.upcomingBadge}>
                <Text style={styles.upcomingBadgeText}>Upcoming</Text>
              </View>
            ) : (
              <View style={styles.pastBadge}>
                <Text style={styles.pastBadgeText}>Past</Text>
              </View>
            )}
          </View>
          <Text style={styles.electionTitle}>{election.title}</Text>
          <View style={styles.dateMeta}>
            <Clock size={14} color="#888" strokeWidth={2} />
            <Text style={styles.dateText}>{formatDate(election.election_date)}</Text>
          </View>
          {election.description ? (
            <Text style={styles.electionDescription}>{election.description}</Text>
          ) : null}
        </View>

        {/* Candidates Section */}
        <View style={styles.candidatesSection}>
          <View style={styles.candidatesHeader}>
            <Users size={18} color="#667eea" strokeWidth={2} />
            <Text style={styles.sectionTitle}>
              Candidates{candidates.length > 0 ? ` (${candidates.length})` : ''}
            </Text>
          </View>

          {candidates.length === 0 ? (
            <View style={styles.emptyCard}>
              <User size={36} color="#c7d2fe" strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No Candidates</Text>
              <Text style={styles.emptySubtitle}>No approved candidates for this election yet</Text>
            </View>
          ) : (
            candidates.map((candidate) => (
              <Pressable
                key={candidate.application_id}
                style={styles.candidateCard}
                onPress={() => router.push(`/candidate/${candidate.application_id}`)}
              >
                <View style={styles.candidateAvatar}>
                  <Text style={styles.candidateInitials}>
                    {(candidate.name?.[0] ?? '?').toUpperCase()}
                    {(candidate.surname?.[0] ?? '').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.candidateInfo}>
                  <Text style={styles.candidateName}>
                    {candidate.name} {candidate.surname}
                  </Text>
                  {candidate.manifesto ? (
                    <Text style={styles.manifestoAvailable}>Manifesto available</Text>
                  ) : (
                    <Text style={styles.manifestoUnavailable}>No manifesto</Text>
                  )}
                </View>
                <ChevronRight size={20} color="#c7d2fe" strokeWidth={2} />
              </Pressable>
            ))
          )}
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
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  loadingText: {
    color: '#888',
    fontSize: 15,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  electionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e8e8f0',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  electionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  electionIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  upcomingBadge: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  upcomingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  pastBadge: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pastBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
  },
  electionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 28,
  },
  dateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 14,
    color: '#888',
  },
  electionDescription: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 14,
  },
  candidatesSection: {
    gap: 10,
  },
  candidatesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 36,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  candidateCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  candidateAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  candidateInitials: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  candidateInfo: {
    flex: 1,
    gap: 3,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  manifestoAvailable: {
    fontSize: 13,
    color: '#16a34a',
    fontWeight: '500',
  },
  manifestoUnavailable: {
    fontSize: 13,
    color: '#aaa',
  },
});
