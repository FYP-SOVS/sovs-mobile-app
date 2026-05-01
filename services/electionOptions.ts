import { FUNCTIONS_BASE_URL } from './supabase';

export interface ElectionOption {
  option_id: string;
  label: string;
  display_order: number;
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

export const electionOptionsAPI = {
  listByElection: async (electionId: string): Promise<ElectionOption[]> => {
    const result = await apiFetch<{ options: ElectionOption[] }>(`elections/${encodeURIComponent(electionId)}/options`);
    return result.options ?? [];
  },
};

