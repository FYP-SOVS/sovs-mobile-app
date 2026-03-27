import { supabase, FUNCTIONS_BASE_URL } from './supabase';

interface CastVoteResult {
  success: boolean;
  txHash?: string;
  blockNumber?: number;
  explorerUrl?: string;
  message?: string;
  error?: string;
  alreadyVoted?: boolean;
}

interface VotingStatusResult {
  hasVoted: boolean;
  txHash?: string;
  explorerUrl?: string;
  candidateApplicationId?: string;
  votedAt?: string;
  network?: string;
  error?: string;
}

async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Cast a vote on the blockchain via the cast-vote edge function.
 *
 * Calls: POST api.sovsapp.tech/functions/v1/cast-vote
 */
export async function castVote(
  electionId: string,
  candidateApplicationId: string
): Promise<CastVoteResult> {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: 'Not authenticated. Please log in again.' };
  }

  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/cast-vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ electionId, candidateApplicationId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Request failed (${response.status})`,
        alreadyVoted: data.alreadyVoted,
        txHash: data.txHash,
        explorerUrl: data.explorerUrl,
      };
    }

    return {
      success: true,
      txHash: data.txHash,
      blockNumber: data.blockNumber,
      explorerUrl: data.explorerUrl,
      message: data.message,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error — please try again.' };
  }
}

/**
 * Check whether the current user has voted in a specific election.
 *
 * Calls: GET api.sovsapp.tech/functions/v1/voting-status?electionId=<uuid>
 */
export async function getVotingStatus(electionId: string): Promise<VotingStatusResult> {
  const token = await getAccessToken();
  if (!token) {
    return { hasVoted: false, error: 'Not authenticated' };
  }

  try {
    const response = await fetch(
      `${FUNCTIONS_BASE_URL}/voting-status?electionId=${encodeURIComponent(electionId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { hasVoted: false, error: data.error };
    }

    return data;
  } catch (err: any) {
    return { hasVoted: false, error: err.message || 'Network error' };
  }
}
