import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  User,
  Calendar,
  Mail,
  Phone,
  FileText,
  Download,
  AlertCircle,
} from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { candidatesAPI, Candidate } from '@/services/elections';

export default function CandidateScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const fetchCandidate = useCallback(async () => {
    if (!id) return;
    try {
      setError('');
      const data = await candidatesAPI.getById(id);
      setCandidate(data);
    } catch (e: any) {
      setError('Could not load candidate details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCandidate();
  }, [fetchCandidate]);

  const handleDownloadManifesto = async () => {
    if (!candidate?.manifesto) {
      Alert.alert('No Manifesto', 'This candidate has not uploaded a manifesto.');
      return;
    }
    setDownloading(true);
    try {
      const result = await WebBrowser.openBrowserAsync(candidate.manifesto);
      if (result.type === 'cancel') {
        // User closed the browser — that's fine
      }
    } catch (e) {
      // Fallback to system browser
      try {
        await Linking.openURL(candidate.manifesto);
      } catch {
        Alert.alert('Error', 'Could not open the manifesto. Please try again.');
      }
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not provided';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading candidate...</Text>
      </View>
    );
  }

  if (error || !candidate) {
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
          <Pressable style={styles.retryButton} onPress={fetchCandidate}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const initials =
    `${candidate.name?.[0] ?? '?'}${candidate.surname?.[0] ?? ''}`.toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#667eea" strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Candidate</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar & Name */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <Text style={styles.candidateName}>
            {candidate.name} {candidate.surname}
          </Text>
          <Text style={styles.candidateRole}>Candidate</Text>
        </View>

        {/* Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsCardTitle}>Personal Information</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <User size={16} color="#667eea" strokeWidth={2} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Full Name</Text>
              <Text style={styles.detailValue}>
                {candidate.name} {candidate.surname}
              </Text>
            </View>
          </View>

          {candidate.date_of_birth ? (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Calendar size={16} color="#667eea" strokeWidth={2} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Date of Birth</Text>
                <Text style={styles.detailValue}>{formatDate(candidate.date_of_birth)}</Text>
              </View>
            </View>
          ) : null}

          {candidate.email ? (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Mail size={16} color="#667eea" strokeWidth={2} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{candidate.email}</Text>
              </View>
            </View>
          ) : null}

          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <View style={styles.detailIcon}>
              <FileText size={16} color="#667eea" strokeWidth={2} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Application Date</Text>
              <Text style={styles.detailValue}>{formatDate(candidate.submitted_at)}</Text>
            </View>
          </View>
        </View>

        {/* Manifesto Download */}
        <View style={styles.manifestoCard}>
          <View style={styles.manifestoHeader}>
            <FileText size={20} color="#667eea" strokeWidth={2} />
            <Text style={styles.manifestoTitle}>Manifesto</Text>
          </View>

          {candidate.manifesto ? (
            <>
              <Text style={styles.manifestoDescription}>
                Read {candidate.name}'s official election manifesto to understand their vision and plans.
              </Text>
              <Pressable
                style={[styles.downloadButton, downloading && styles.downloadButtonDisabled]}
                onPress={handleDownloadManifesto}
                disabled={downloading}
              >
                {downloading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Download size={18} color="#fff" strokeWidth={2.5} />
                )}
                <Text style={styles.downloadButtonText}>
                  {downloading ? 'Opening...' : 'View / Download Manifesto'}
                </Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.noManifesto}>
              <AlertCircle size={18} color="#f59e0b" strokeWidth={2} />
              <Text style={styles.noManifestoText}>
                This candidate has not uploaded a manifesto yet.
              </Text>
            </View>
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
    paddingBottom: 48,
    gap: 16,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e8e8f0',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  candidateName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  candidateRole: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e8e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  detailsCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  detailContent: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  manifestoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e8e8f0',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  manifestoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  manifestoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  manifestoDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  downloadButton: {
    backgroundColor: '#667eea',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  downloadButtonDisabled: {
    opacity: 0.7,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  noManifesto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  noManifestoText: {
    fontSize: 14,
    color: '#92400e',
    flex: 1,
    lineHeight: 20,
  },
});
