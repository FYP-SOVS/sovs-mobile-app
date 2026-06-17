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
import { useTranslation } from '@/contexts/LanguageContext';
import { electionsAPI, candidatesAPI, Election, Candidate } from '@/services/elections';
import { castVote, getVotingStatus } from '@/services/voting';
import { electionOptionsAPI, ElectionOption } from '@/services/electionOptions';

type VoteState = 'idle' | 'confirming' | 'submitting' | 'success' | 'error';

interface VotingStatus {
  hasVoted: boolean;
  txHash?: string;
  explorerUrl?: string;
  candidateApplicationId?: string;
  optionId?: string;
}

export default function ElectionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, language } = useTranslation();
  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [options, setOptions] = useState<ElectionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Voting state
  const [votingStatus, setVotingStatus] = useState<VotingStatus>({ hasVoted: false });
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedOption, setSelectedOption] = useState<ElectionOption | null>(null);
  const [voteState, setVoteState] = useState<VoteState>('idle');
  const [voteError, setVoteError] = useState('');
  const [txHash, setTxHash] = useState('');
  const [explorerUrl, setExplorerUrl] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const isElectionOpen = election?.status === 'ongoing';
  const electionType = election?.election_type ?? 'candidate';
  const isPollLike = electionType !== 'candidate';

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setError('');
      const electionData = await electionsAPI.getById(id);
      const type = (electionData as any)?.election_type ?? 'candidate';

      const [candidatesData, optionsData] = await Promise.all([
        type === 'candidate' ? candidatesAPI.listByElection(id) : Promise.resolve([]),
        type !== 'candidate' ? electionOptionsAPI.listByElection(id) : Promise.resolve([]),
      ]);
      setElection(electionData);
      setCandidates(candidatesData);
      setOptions(optionsData);
    } catch (e: any) {
      setError(t('election.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, t]);

  const fetchVotingStatus = useCallback(async () => {
    if (!id) return;
    const status = await getVotingStatus(id);
    setVotingStatus({
      hasVoted: status.hasVoted,
      txHash: status.txHash,
      explorerUrl: status.explorerUrl,
      candidateApplicationId: status.candidateApplicationId,
      optionId: (status as any).optionId,
    });
  }, [id]);

  const fetchOptions = useCallback(async () => {
    if (!id) return;
    setLoadingOptions(true);
    try {
      const data = await electionOptionsAPI.listByElection(id);
      setOptions(data);
    } catch {
      setOptions([]);
    } finally {
      setLoadingOptions(false);
    }
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

  const handleSelectOption = (option: ElectionOption) => {
    if (!isElectionOpen || votingStatus.hasVoted || voteState !== 'idle') return;
    setSelectedOption(prev => (prev?.option_id === option.option_id ? null : option));
  };

  const handleVotePress = () => {
    if (isPollLike) {
      if (!selectedOption) return;
    } else {
      if (!selectedCandidate) return;
    }
    setShowConfirmModal(true);
    setVoteState('confirming');
  };

  const handleConfirmVote = async () => {
    if (!id) return;
    if (isPollLike && !selectedOption) return;
    if (!isPollLike && !selectedCandidate) return;
    setShowConfirmModal(false);
    setVoteState('submitting');

    const result = await castVote(
      id,
      isPollLike
        ? { optionId: selectedOption!.option_id }
        : { candidateApplicationId: selectedCandidate!.application_id }
    );

    if (result.success && result.txHash) {
      setTxHash(result.txHash);
      setExplorerUrl(result.explorerUrl || '');
      setVotingStatus({
        hasVoted: true,
        txHash: result.txHash,
        explorerUrl: result.explorerUrl,
        candidateApplicationId: isPollLike ? undefined : selectedCandidate!.application_id,
        optionId: isPollLike ? selectedOption!.option_id : undefined,
      });
      setVoteState('success');
    } else {
      setVoteError(
        language === 'en'
          ? result.error || t('election.castVoteFailedMessage')
          : t('election.castVoteFailedMessage')
      );
      setVoteState('error');
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setVoteState('idle');
  };

  const openExplorer = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert(t('common.error'), t('election.openExplorerError'))
    );
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  useEffect(() => {
    if (!election) return;
    const type = (election as any).election_type ?? 'candidate';
    if (type !== 'candidate' && options.length === 0 && !loadingOptions) {
      fetchOptions();
    }
  }, [election, options.length, loadingOptions, fetchOptions]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.navy} />
        <Text style={styles.loadingText}>{t('election.loading')}</Text>
      </View>
    );
  }

  if (error || !election) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color={theme.colors.navy} strokeWidth={2} />
          </Pressable>
        </View>
        <View style={styles.centered}>
          <AlertCircle size={40} color={theme.colors.danger} strokeWidth={1.5} />
          <Text style={styles.errorTitle}>{t('common.failedToLoad')}</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
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
          <ArrowLeft size={22} color={theme.colors.navy} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('election.details')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.navy} />
        }
      >
        {/* Election Info Card */}
        <View style={styles.electionCard}>
          <View style={styles.electionCardHeader}>
            <View style={styles.electionIconWrapper}>
              <Calendar size={26} color={theme.colors.navy} strokeWidth={2} />
            </View>
            <View style={[
              styles.statusBadge,
              isElectionOpen ? styles.openBadge : styles.pastBadge,
            ]}>
              <Text style={[
                styles.statusBadgeText,
                isElectionOpen ? styles.openBadgeText : styles.pastBadgeText,
              ]}>
                {isElectionOpen
                  ? t('election.votingOpen')
                  : election.status === 'upcoming'
                  ? t('election.upcoming')
                  : t('election.closed')}
              </Text>
            </View>
          </View>
          <Text style={styles.electionTitle}>{election.title}</Text>
          <View style={styles.dateMeta}>
            <Clock size={14} color={theme.colors.textTertiary} strokeWidth={2} />
            <Text style={styles.dateText}>{formatDate(election.election_date)}</Text>
          </View>
          {election.description ? (
            <Text style={styles.electionDescription}>{election.description}</Text>
          ) : null}
        </View>

        {/* Already Voted Banner */}
        {votingStatus.hasVoted && (
          <View style={styles.votedBanner}>
            <ShieldCheck size={20} color={theme.colors.success} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={styles.votedBannerTitle}>{t('election.voteRecordedTitle')}</Text>
              <Text style={styles.votedBannerSub}>
                {t('election.voteRecordedDescription')}
              </Text>
              {votingStatus.explorerUrl && (
                <Pressable
                  onPress={() => openExplorer(votingStatus.explorerUrl!)}
                  style={styles.explorerLink}
                >
                  <ExternalLink size={12} color={theme.colors.success} strokeWidth={2} />
                  <Text style={styles.explorerLinkText}>{t('election.viewExplorer')}</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Vote Success */}
        {voteState === 'success' && txHash && (
          <View style={styles.successCard}>
            <ShieldCheck size={32} color={theme.colors.success} strokeWidth={2} />
            <Text style={styles.successTitle}>{t('election.voteSuccess')}</Text>
            <Text style={styles.successSub}>
              {t('election.voteSuccessMessage', {
                name: isPollLike
                  ? `${selectedOption?.label ?? ''}`.trim()
                  : `${selectedCandidate?.name ?? ''} ${selectedCandidate?.surname ?? ''}`.trim(),
              })}
            </Text>
            <View style={styles.txHashBox}>
              <Text style={styles.txHashLabel}>{t('election.transactionHash')}</Text>
              <Text style={styles.txHashValue} numberOfLines={2}>{txHash}</Text>
            </View>
            {explorerUrl && (
              <Pressable
                style={styles.explorerButton}
                onPress={() => openExplorer(explorerUrl)}
              >
                <ExternalLink size={16} color={theme.colors.white} strokeWidth={2} />
                <Text style={styles.explorerButtonText}>{t('election.viewBlockchainExplorer')}</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Vote Error */}
        {voteState === 'error' && voteError && (
          <View style={styles.errorCard}>
            <AlertCircle size={20} color={theme.colors.danger} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={styles.errorCardTitle}>{t('election.castVoteFailed')}</Text>
              <Text style={styles.errorCardSub}>{voteError}</Text>
            </View>
          </View>
        )}

        {/* Submitting indicator */}
        {voteState === 'submitting' && (
          <View style={styles.submittingCard}>
            <ActivityIndicator size="small" color={theme.colors.navy} />
            <Text style={styles.submittingText}>{t('election.submittingVote')}</Text>
          </View>
        )}

        {/* Ballot Section */}
        <View style={styles.candidatesSection}>
          <View style={styles.candidatesHeader}>
            <Users size={18} color={theme.colors.navy} strokeWidth={2} />
            <Text style={styles.sectionTitle}>
              {isPollLike ? (electionType === 'referendum' ? 'Referendum' : 'Poll') : t('election.candidates')}
              {isPollLike
                ? (options.length > 0 ? ` (${options.length})` : '')
                : (candidates.length > 0 ? ` (${candidates.length})` : '')}
            </Text>
          </View>

          {isElectionOpen && !votingStatus.hasVoted && voteState === 'idle' && (
            <Text style={styles.selectHint}>
              {isPollLike ? 'Select one option.' : t('election.selectHint')}
            </Text>
          )}

          {!isPollLike ? (
            candidates.length === 0 ? (
              <View style={styles.emptyCard}>
                <User size={36} color={theme.colors.borderStrong} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>{t('election.noCandidates')}</Text>
                <Text style={styles.emptySubtitle}>{t('election.noCandidatesSubtitle')}</Text>
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
                        router.push({
                          pathname: '/candidate/[id]',
                          params: { id: candidate.application_id },
                        } as any);
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
                            <CheckCircle size={11} color={theme.colors.success} strokeWidth={2.5} />
                            <Text style={styles.yourVoteText}>{t('election.yourVote')}</Text>
                          </View>
                        )}
                      </View>
                      {candidate.manifesto ? (
                        <Text style={styles.manifestoAvailable}>{t('election.manifestoAvailable')}</Text>
                      ) : (
                        <Text style={styles.manifestoUnavailable}>{t('election.noManifesto')}</Text>
                      )}
                    </View>

                    {!canSelect && <ChevronRight size={20} color={theme.colors.borderStrong} strokeWidth={2} />}
                  </Pressable>
                );
              })
            )
          ) : loadingOptions ? (
            <View style={styles.centered}>
              <ActivityIndicator size="small" color={theme.colors.navy} />
              <Text style={styles.loadingText}>Loading options…</Text>
            </View>
          ) : options.length === 0 ? (
            <View style={styles.emptyCard}>
              <User size={36} color={theme.colors.borderStrong} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No options available</Text>
              <Text style={styles.emptySubtitle}>This ballot has no options configured.</Text>
            </View>
          ) : (
            options.map((opt) => {
              const isSelected = selectedOption?.option_id === opt.option_id;
              const isVotedFor = votingStatus.optionId === opt.option_id;
              const canSelect = isElectionOpen && !votingStatus.hasVoted && voteState === 'idle';

              return (
                <Pressable
                  key={opt.option_id}
                  style={[
                    styles.candidateCard,
                    isSelected && styles.candidateCardSelected,
                    isVotedFor && styles.candidateCardVoted,
                  ]}
                  onPress={() => {
                    if (canSelect) handleSelectOption(opt);
                  }}
                >
                  {canSelect && (
                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                  )}

                  <View style={styles.candidateInfo}>
                    <View style={styles.candidateNameRow}>
                      <Text style={styles.candidateName}>{opt.label}</Text>
                      {isVotedFor && (
                        <View style={styles.yourVoteBadge}>
                          <CheckCircle size={11} color={theme.colors.success} strokeWidth={2.5} />
                          <Text style={styles.yourVoteText}>{t('election.yourVote')}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <ChevronRight size={20} color={theme.colors.borderStrong} strokeWidth={2} />
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
                <Text style={styles.retryVoteButtonText}>{t('registration.tryAgain')}</Text>
              </Pressable>
            )}
            <Pressable
              style={[
                styles.voteButton,
                ((isPollLike && !selectedOption) || (!isPollLike && !selectedCandidate)) && styles.voteButtonDisabled,
              ]}
              disabled={
                voteState === 'submitting' ||
                (isPollLike ? !selectedOption : !selectedCandidate)
              }
              onPress={handleVotePress}
            >
              <Vote size={20} color={theme.colors.white} strokeWidth={2} />
              <Text style={styles.voteButtonText}>
                {isPollLike
                  ? (selectedOption ? `Vote: ${selectedOption.label}` : 'Select an option')
                  : (selectedCandidate
                    ? t('election.voteFor', { name: `${selectedCandidate.name} ${selectedCandidate.surname}` })
                    : t('election.selectCandidate'))}
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
              <Vote size={28} color={theme.colors.navy} strokeWidth={2} />
            </View>
            <Text style={styles.modalTitle}>{t('election.confirmVote')}</Text>
            <Text style={styles.modalBody}>
              {isPollLike ? (
                <>
                  You are about to vote for:{'\n'}
                  <Text style={styles.modalCandidateName}>{selectedOption?.label}</Text>
                </>
              ) : (
                <>
                  {t('election.aboutToVoteFor')}{'\n'}
                  <Text style={styles.modalCandidateName}>
                    {selectedCandidate?.name} {selectedCandidate?.surname}
                  </Text>
                </>
              )}
            </Text>
            <Text style={styles.modalWarning}>
              {t('election.voteWarning')}
            </Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelBtn} onPress={handleCancelConfirm}>
                <Text style={styles.modalCancelText}>{t('election.goBack')}</Text>
              </Pressable>
              <Pressable style={styles.modalConfirmBtn} onPress={handleConfirmVote}>
                <ShieldCheck size={16} color={theme.colors.white} strokeWidth={2} />
                <Text style={styles.modalConfirmText}>{t('election.submitVote')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    backgroundColor: theme.colors.white,
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.colors.goldSoft,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.textPrimary },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  loadingText: { color: theme.colors.textTertiary, fontSize: 15 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary },
  errorSubtitle: { fontSize: 14, color: theme.colors.textTertiary, textAlign: 'center' },
  retryButton: {
    backgroundColor: theme.colors.navy, borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12, marginTop: 8,
  },
  retryButtonText: { color: theme.colors.white, fontWeight: '600', fontSize: 15 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  // Election card
  electionCard: {
    backgroundColor: theme.colors.white, borderRadius: 20, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: theme.colors.border,
    shadowColor: theme.colors.navy, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  electionCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  electionIconWrapper: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: theme.colors.goldSoft, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: theme.colors.navy,
  },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  openBadge: { backgroundColor: theme.colors.goldSoft, borderColor: theme.colors.navy },
  pastBadge: { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.borderStrong },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
  openBadgeText: { color: theme.colors.navy },
  pastBadgeText: { color: theme.colors.textTertiary },
  electionTitle: { fontSize: 22, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 8, lineHeight: 28 },
  dateMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  dateText: { fontSize: 14, color: theme.colors.textTertiary },
  electionDescription: {
    fontSize: 15, color: theme.colors.textSecondary, lineHeight: 22,
    borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 14,
  },

  // Voted banner
  votedBanner: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: theme.colors.successSoft, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: theme.colors.success, marginBottom: 16,
  },
  votedBannerTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.success },
  votedBannerSub: { fontSize: 13, color: theme.colors.success, marginTop: 2 },
  explorerLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  explorerLinkText: { fontSize: 12, color: theme.colors.success, textDecorationLine: 'underline' },

  // Success card
  successCard: {
    backgroundColor: theme.colors.successSoft, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: theme.colors.success, alignItems: 'center',
    gap: 10, marginBottom: 16,
  },
  successTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.success },
  successSub: { fontSize: 14, color: theme.colors.success, textAlign: 'center', lineHeight: 20 },
  txHashBox: {
    backgroundColor: theme.colors.white, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: theme.colors.successSoft, width: '100%',
  },
  txHashLabel: { fontSize: 11, color: theme.colors.textTertiary, marginBottom: 4 },
  txHashValue: { fontSize: 11, fontFamily: 'monospace', color: theme.colors.textPrimary, lineHeight: 16 },
  explorerButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: theme.colors.success, borderRadius: 12,
    paddingHorizontal: 18, paddingVertical: 11, marginTop: 4,
  },
  explorerButtonText: { color: theme.colors.white, fontWeight: '700', fontSize: 14 },

  // Error card
  errorCard: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: theme.colors.dangerSoft, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: theme.colors.danger, marginBottom: 16,
  },
  errorCardTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.danger },
  errorCardSub: { fontSize: 13, color: theme.colors.danger, marginTop: 2 },

  // Submitting
  submittingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.colors.goldSoft, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: theme.colors.borderStrong, marginBottom: 16,
  },
  submittingText: { fontSize: 14, color: theme.colors.navyHover, fontWeight: '600' },

  // Candidates
  candidatesSection: { gap: 10 },
  candidatesHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary },
  selectHint: { fontSize: 13, color: theme.colors.navy, marginBottom: 6 },
  emptyCard: {
    backgroundColor: theme.colors.white, borderRadius: 16, padding: 36,
    alignItems: 'center', gap: 10, borderWidth: 1, borderColor: theme.colors.border,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: theme.colors.textTertiary, textAlign: 'center' },

  candidateCard: {
    backgroundColor: theme.colors.white, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: theme.colors.border,
    shadowColor: theme.colors.foreground, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  candidateCardSelected: {
    borderColor: theme.colors.navy, borderWidth: 2,
    backgroundColor: theme.colors.goldSoft,
    shadowColor: theme.colors.navy, shadowOpacity: 0.12,
  },
  candidateCardVoted: {
    borderColor: theme.colors.success, borderWidth: 1,
    backgroundColor: theme.colors.successSoft,
  },

  // Radio button
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: theme.colors.borderStrong,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  radioSelected: { borderColor: theme.colors.navy, backgroundColor: theme.colors.navy },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.white },

  candidateAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: theme.colors.navy,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  candidateAvatarSelected: { backgroundColor: theme.colors.navyHover },
  candidateInitials: { color: theme.colors.white, fontSize: 16, fontWeight: '700' },
  candidateInfo: { flex: 1, gap: 3 },
  candidateNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  candidateName: { fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary },
  yourVoteBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: theme.colors.successSoft, borderRadius: 20,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  yourVoteText: { fontSize: 11, fontWeight: '700', color: theme.colors.success },
  manifestoAvailable: { fontSize: 13, color: theme.colors.success, fontWeight: '500' },
  manifestoUnavailable: { fontSize: 13, color: theme.colors.textPlaceholder },

  // Vote button
  voteButtonContainer: { marginTop: 24, gap: 10 },
  voteButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: theme.colors.navy, borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 20,
    shadowColor: theme.colors.navy, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  voteButtonDisabled: { backgroundColor: theme.colors.borderStrong, shadowOpacity: 0 },
  voteButtonText: { color: theme.colors.white, fontWeight: '800', fontSize: 16 },
  retryVoteButton: {
    borderWidth: 1, borderColor: theme.colors.borderStrong, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  retryVoteButtonText: { color: theme.colors.textSecondary, fontWeight: '600', fontSize: 14 },

  // Confirm modal
  modalOverlay: {
    flex: 1, backgroundColor: theme.colors.overlay,
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalCard: {
    backgroundColor: theme.colors.white, borderRadius: 24, padding: 24,
    width: '100%', alignItems: 'center', gap: 12,
  },
  modalIconWrapper: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: theme.colors.goldSoft, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: theme.colors.navy,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.textPrimary },
  modalBody: { fontSize: 15, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  modalCandidateName: { fontWeight: '800', color: theme.colors.textPrimary },
  modalWarning: {
    fontSize: 13, color: theme.colors.textTertiary, textAlign: 'center', lineHeight: 18,
    backgroundColor: theme.colors.surfaceMuted, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  modalActions: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 4 },
  modalCancelBtn: {
    flex: 1, borderWidth: 1, borderColor: theme.colors.borderStrong,
    borderRadius: 12, paddingVertical: 13, alignItems: 'center',
  },
  modalCancelText: { fontWeight: '600', color: theme.colors.textSecondary, fontSize: 15 },
  modalConfirmBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: theme.colors.navy, borderRadius: 12, paddingVertical: 13,
  },
  modalConfirmText: { color: theme.colors.white, fontWeight: '700', fontSize: 15 },
});
