import { FUNCTIONS_BASE_URL } from './supabase';

export interface Election {
  election_id: string;
  title: string;
  description: string;
  election_date: string;
  candidate_count?: number;
}

export interface Candidate {
  application_id: string;
  election_id: string;
  manifesto: string | null;
  submitted_at: string;
  manifesto_reads?: number;
  user_id: string;
  name: string;
  surname: string;
  email: string | null;
  phone_number: string;
  date_of_birth: string | null;
}

async function apiFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${FUNCTIONS_BASE_URL}/${path}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }
  return response.json();
}

export const electionsAPI = {
  list: async (upcomingOnly = true): Promise<Election[]> => {
    const query = upcomingOnly ? 'upcoming=true' : '';
    const result = await apiFetch<{ elections: Election[] }>(`elections${query ? '?' + query : ''}`);
    return result.elections;
  },

  getById: async (electionId: string): Promise<Election> => {
    return apiFetch<Election>(`elections/${electionId}`);
  },
};

export const candidatesAPI = {
  listByElection: async (electionId: string): Promise<Candidate[]> => {
    const result = await apiFetch<{ candidates: Candidate[] }>(
      `candidates?election_id=${encodeURIComponent(electionId)}`
    );
    return result.candidates;
  },

  getById: async (applicationId: string): Promise<Candidate> => {
    return apiFetch<Candidate>(`candidates/${applicationId}`);
  },
};
