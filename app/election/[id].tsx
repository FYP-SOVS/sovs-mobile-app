import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Linking,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Users,
  ChevronRight,
  AlertCircle,
  User,
  Clock,
  ShieldCheck,
  ExternalLink,
  Vote,
  CheckCircle,
} from 'lucide-react-native';
import { electionsAPI, candidatesAPI, Election, Candidate } from '@/services/elections';
import { castVote, getVotingStatus } from '@/services/voting';

type VoteState = 'idle' | 'confirming' | 'submitting' | 'success' | 'error';

interface VotingStatus {
  hasVoted: boolean;
  txHash?: string;
  explorerUrl?: string;
  candidateApplicationId?: string;
}

export default function ElectionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Voting state
  const [votingStatus, setVotingStatus] = useState<VotingStatus>({ hasVoted: false });
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [voteState, setVoteState] = useState<VoteState>('idle');
  const [voteError, setVoteError] = useState('');
  const [txHash, setTxHash] = useState('');
  const [explorerUrl, setExplorerUrl] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const isElectionOpen = election?.status === 'open';

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

  const fetchVotingStatus = useCallback(async () => {
    if (!id) return;
    const status = await getVotingStatus(id);
    setVotingStatus({
      hasVoted: status.hasVoted,
      txHash: status.txHash,
      explorerUrl: status.explorerUrl,
      candidateApplicationId: status.candidateApplicationId,
    });
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // Fetch voting status after election loads
    if (election) fetchVotingStatus();
  }, [election, fetchVotingStatus]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
    fetchVotingStatus();
  };

  const handleSelectCandidate = (candidate: Candidate) => {
    if (!isElectionOpen || votingStatus.hasVoted || voteState !== 'idle') return;
    setSelectedCandidate(prev =>
      prev?.application_id === candidate.application_id ? null : candidate
    );
  };

  const handleVotePress = () => {
    if (!selectedCandidate) return;
    setShowConfirmModal(true);
    setVoteState('confirming');
  };

  const handleConfirmVote = async () => {
    if (!selectedCandidate || !id) return;
    setShowConfirmModal(false);
    setVoteState('submitting');

    const result = await castVote(id, selectedCandidate.application_id);

    if (result.success && result.txHash) {
      setTxHash(result.txHash);
      setExplorerUrl(result.explorerUrl || '');
      setVotingStatus({
        hasVoted: true,
        txHash: result.txHash,
        explorerUrl: result.explorerUrl,
        candidateApplicationId: selectedCandidate.application_id,
      });
      setVoteState('success');
    } else {
      setVoteError(result.error || 'Failed to cast vote. Please try again.');
      setVoteState('error');
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setVoteState('idle');
  };

  const openExplorer = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Could not open blockchain explorer')
    );
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

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

  return (
    <View style={styles.container}>
      {/* Header */}
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#667eea" />
        }
      >
        {/* Election Info Card */}
        <View style={styles.electionCard}>
          <View style={styles.electionCardHeader}>
            <View style={styles.electionIconWrapper}>
              <Calendar size={26} color="#667eea" strokeWidth={2} />
            </View>
            <View style={[
              styles.statusBadge,
              isElectionOpen ? styles.openBadge : styles.pastBadge,
            ]}>
              <Text style={[
                styles.statusBadgeText,
                isElectionOpen ? styles.openBadgeText : styles.pastBadgeText,
              ]}>
                {isElectionOpen ? 'Voting Open' : election.status === 'upcoming' ? 'Upcoming' : 'Closed'}
              </Text>
            </View>
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

        {/* Already Voted Banner */}
        {votingStatus.hasVoted && (
          <View style={styles.votedBanner}>
            <ShieldCheck size={20} color="#16a34a" strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={styles.votedBannerTitle}>Vote recorded on blockchain</Text>
              <Text style={styles.votedBannerSub}>
                Your vote is immutably recorded and cannot be changed.
              </Text>
              {votingStatus.explorerUrl && (
                <Pressable
                  onPress={() => openExplorer(votingStatus.explorerUrl!)}
                  style={styles.explorerLink}
                >
                  <ExternalLink size={12} color="#15803d" strokeWidth={2} />
                  <Text style={styles.explorerLinkText}>View on blockchain explorer</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Vote Success */}
        {voteState === 'success' && txHash && (
          <View style={styles.successCard}>
            <ShieldCheck size={32} color="#16a34a" strokeWidth={2} />
            <Text style={styles.successTitle}>Vote Cast Successfully!</Text>
            <Text style={styles.successSub}>
              Your vote for{' '}
              <Text style={{ fontWeight: '700' }}>
                {selectedCandidate?.name} {selectedCandidate?.surname}
              </Text>{' '}
              has been recorded on the Ethereum blockchain.
            </Text>
            <View style={styles.txHashBox}>
              <Text style={styles.txHashLabel}>Transaction Hash</Text>
              <Text style={styles.txHashValue} numberOfLines={2}>{txHash}</Text>
            </View>
            {explorerUrl && (
              <Pressable
                style={styles.explorerButton}
                onPress={() => openExplorer(explorerUrl)}
              >
                <ExternalLink size={16} color="#fff" strokeWidth={2} />
                <Text style={styles.explorerButtonText}>View on Blockchain Explorer</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Vote Error */}
        {voteState === 'error' && voteError && (
          <View style={styles.errorCard}>
            <AlertCircle size={20} color="#ef4444" strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={styles.errorCardTitle}>Failed to cast vote</Text>
              <Text style={styles.errorCardSub}>{voteError}</Text>
            </View>
          </View>
        )}

        {/* Submitting indicator */}
        {voteState === 'submitting' && (
          <View style={styles.submittingCard}>
            <ActivityIndicator size="small" color="#667eea" />
            <Text style={styles.submittingText}>Submitting vote to blockchain…</Text>
          </View>
        )}

        {/* Candidates Section */}
        <View style={styles.candidatesSection}>
          <View style={styles.candidatesHeader}>
            <Users size={18} color="#667eea" strokeWidth={2} />
            <Text style={styles.sectionTitle}>
              Candidates{candidates.length > 0 ? ` (${candidates.length})` : ''}
            </Text>
          </View>
          {isElectionOpen && !votingStatus.hasVoted && voteState === 'idle' && (
            <Text style={styles.selectHint}>Tap a candidate to select your vote</Text>
          )}

          {candidates.length === 0 ? (
            <View style={styles.emptyCard}>
              <User size={36} color="#c7d2fe" strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No Candidates</Text>
              <Text style={styles.emptySubtitle}>No approved candidates for this election yet</Text>
            </View>
          ) : (
            candidates.map((candidate) => {
              const isSelected = selectedCandidate?.application_id === candidate.application_id;
              const isVotedFor = votingStatus.candidateApplicationId === candidate.application_id;
              const canSelect =
                isElectionOpen && !votingStatus.hasVoted && voteState === 'idle';

              return (
                <Pressable
                  key={candidate.application_id}
                  style={[
                    styles.candidateCard,
                    isSelected && styles.candidateCardSelected,
                    isVotedFor && styles.candidateCardVoted,
                  ]}
                  onPress={() => {
                    if (canSelect) {
                      handleSelectCandidate(candidate);
                    } else {
                      router.push(`/candidate/${candidate.application_id}`);
                    }
                  }}
                >
                  {/* Selection radio */}
                  {canSelect && (
                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                  )}

                  <View style={[styles.candidateAvatar, isSelected && styles.candidateAvatarSelected]}>
                    <Text style={styles.candidateInitials}>
                      {(candidate.name?.[0] ?? '?').toUpperCase()}
                      {(candidate.surname?.[0] ?? '').toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.candidateInfo}>
                    <View style={styles.candidateNameRow}>
                      <Text style={styles.candidateName}>
                        {candidate.name} {candidate.surname}
                      </Text>
                      {isVotedFor && (
                        <View style={styles.yourVoteBadge}>
                          <CheckCircle size={11} color="#16a34a" strokeWidth={2.5} />
                          <Text style={styles.yourVoteText}>Your vote</Text>
                        </View>
                      )}
                    </View>
                    {candidate.manifesto ? (
                      <Text style={styles.manifestoAvailable}>Manifesto available</Text>
                    ) : (
                      <Text style={styles.manifestoUnavailable}>No manifesto</Text>
                    )}
                  </View>

                  {!canSelect && <ChevronRight size={20} color="#c7d2fe" strokeWidth={2} />}
                </Pressable>
              );
            })
          )}
        </View>

        {/* Vote button (only for open elections) */}
        {isElectionOpen && !votingStatus.hasVoted && voteState !== 'success' && (
          <View style={styles.voteButtonContainer}>
            {voteState === 'error' && (
              <Pressable
                style={styles.retryVoteButton}
                onPress={() => { setVoteState('idle'); setVoteError(''); }}
              >
                <Text style={styles.retryVoteButtonText}>Try Again</Text>
              </Pressable>
            )}
            <Pressable
              style={[
                styles.voteButton,
                !selectedCandidate && styles.voteButtonDisabled,
              ]}
              disabled={!selectedCandidate || voteState === 'submitting'}
              onPress={handleVotePress}
            >
              <Vote size={20} color="#fff" strokeWidth={2} />
              <Text style={styles.voteButtonText}>
                {selectedCandidate
                  ? `Vote for ${selectedCandidate.name} ${selectedCandidate.surname}`
                  : 'Select a Candidate'}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Confirm Vote Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelConfirm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrapper}>
              <Vote size={28} color="#667eea" strokeWidth={2} />
            </View>
            <Text style={styles.modalTitle}>Confirm Your Vote</Text>
            <Text style={styles.modalBody}>
              You are about to vote for{'\n'}
              <Text style={styles.modalCandidateName}>
                {selectedCandidate?.name} {selectedCandidate?.surname}
              </Text>
            </Text>
            <Text style={styles.modalWarning}>
              This action is permanent and cannot be undone. Your vote will be recorded on the Ethereum blockchain.
            </Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelBtn} onPress={handleCancelConfirm}>
                <Text style={styles.modalCancelText}>Go Back</Text>
              </Pressable>
              <Pressable style={styles.modalConfirmBtn} onPress={handleConfirmVote}>
                <ShieldCheck size={16} color="#fff" strokeWidth={2} />
                <Text style={styles.modalConfirmText}>Submit Vote</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
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
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a1a' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  loadingText: { color: '#888', fontSize: 15 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  errorSubtitle: { fontSize: 14, color: '#888', textAlign: 'center' },
  retryButton: {
    backgroundColor: '#667eea', borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12, marginTop: 8,
  },
  retryButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  // Election card
  electionCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#e8e8f0',
    shadowColor: '#667eea', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  electionCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  electionIconWrapper: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#f0f4ff', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#667eea',
  },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  openBadge: { backgroundColor: '#f0f4ff', borderColor: '#667eea' },
  pastBadge: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb' },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
  openBadgeText: { color: '#667eea' },
  pastBadgeText: { color: '#9ca3af' },
  electionTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginBottom: 8, lineHeight: 28 },
  dateMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  dateText: { fontSize: 14, color: '#888' },
  electionDescription: {
    fontSize: 15, color: '#555', lineHeight: 22,
    borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 14,
  },

  // Voted banner
  votedBanner: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: '#f0fdf4', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#86efac', marginBottom: 16,
  },
  votedBannerTitle: { fontSize: 14, fontWeight: '700', color: '#15803d' },
  votedBannerSub: { fontSize: 13, color: '#166534', marginTop: 2 },
  explorerLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  explorerLinkText: { fontSize: 12, color: '#15803d', textDecorationLine: 'underline' },

  // Success card
  successCard: {
    backgroundColor: '#f0fdf4', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#86efac', alignItems: 'center',
    gap: 10, marginBottom: 16,
  },
  successTitle: { fontSize: 18, fontWeight: '800', color: '#15803d' },
  successSub: { fontSize: 14, color: '#166534', textAlign: 'center', lineHeight: 20 },
  txHashBox: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#bbf7d0', width: '100%',
  },
  txHashLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
  txHashValue: { fontSize: 11, fontFamily: 'monospace', color: '#1a1a1a', lineHeight: 16 },
  explorerButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#16a34a', borderRadius: 12,
    paddingHorizontal: 18, paddingVertical: 11, marginTop: 4,
  },
  explorerButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Error card
  errorCard: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: '#fef2f2', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#fca5a5', marginBottom: 16,
  },
  errorCardTitle: { fontSize: 14, fontWeight: '700', color: '#b91c1c' },
  errorCardSub: { fontSize: 13, color: '#991b1b', marginTop: 2 },

  // Submitting
  submittingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#f0f4ff', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#c7d2fe', marginBottom: 16,
  },
  submittingText: { fontSize: 14, color: '#4f46e5', fontWeight: '600' },

  // Candidates
  candidatesSection: { gap: 10 },
  candidatesHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  selectHint: { fontSize: 13, color: '#667eea', marginBottom: 6 },
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 36,
    alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#f0f0f0',
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center' },

  candidateCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#f0f0f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  candidateCardSelected: {
    borderColor: '#667eea', borderWidth: 2,
    backgroundColor: '#f5f3ff',
    shadowColor: '#667eea', shadowOpacity: 0.12,
  },
  candidateCardVoted: {
    borderColor: '#86efac', borderWidth: 1,
    backgroundColor: '#f0fdf4',
  },

  // Radio button
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#d1d5db',
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  radioSelected: { borderColor: '#667eea', backgroundColor: '#667eea' },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },

  candidateAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#667eea',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  candidateAvatarSelected: { backgroundColor: '#4f46e5' },
  candidateInitials: { color: '#fff', fontSize: 16, fontWeight: '700' },
  candidateInfo: { flex: 1, gap: 3 },
  candidateNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  candidateName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  yourVoteBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#dcfce7', borderRadius: 20,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  yourVoteText: { fontSize: 11, fontWeight: '700', color: '#16a34a' },
  manifestoAvailable: { fontSize: 13, color: '#16a34a', fontWeight: '500' },
  manifestoUnavailable: { fontSize: 13, color: '#aaa' },

  // Vote button
  voteButtonContainer: { marginTop: 24, gap: 10 },
  voteButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#667eea', borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 20,
    shadowColor: '#667eea', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  voteButtonDisabled: { backgroundColor: '#c7d2fe', shadowOpacity: 0 },
  voteButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  retryVoteButton: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  retryVoteButtonText: { color: '#6b7280', fontWeight: '600', fontSize: 14 },

  // Confirm modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 24,
    width: '100%', alignItems: 'center', gap: 12,
  },
  modalIconWrapper: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#f0f4ff', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#667eea',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  modalBody: { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 22 },
  modalCandidateName: { fontWeight: '800', color: '#1a1a1a' },
  modalWarning: {
    fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 18,
    backgroundColor: '#fafafa', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#f0f0f0',
  },
  modalActions: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 4 },
  modalCancelBtn: {
    flex: 1, borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 12, paddingVertical: 13, alignItems: 'center',
  },
  modalCancelText: { fontWeight: '600', color: '#6b7280', fontSize: 15 },
  modalConfirmBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#667eea', borderRadius: 12, paddingVertical: 13,
  },
  modalConfirmText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
