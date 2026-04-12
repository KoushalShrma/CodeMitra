import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  getDiscoverableInstitutions,
  submitInstitutionJoinRequest,
} from '../services/apiClient';

function InstitutionJoinPage() {
  const [institutionId, setInstitutionId] = useState('');
  const [institutionCode, setInstitutionCode] = useState('');
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState('');

  const discoverQuery = useQuery({
    queryKey: ['discoverableInstitutions'],
    queryFn: getDiscoverableInstitutions,
  });

  const joinMutation = useMutation({
    mutationFn: (payload) => submitInstitutionJoinRequest(payload),
    onSuccess: (response) => {
      setFeedback(response?.message || 'Join request submitted');
      setMessage('');
    },
    onError: (error) => {
      setFeedback(error instanceof Error ? error.message : 'Unable to submit request');
    },
  });

  const institutions = useMemo(() => discoverQuery.data?.institutions || [], [discoverQuery.data]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setFeedback('');

    const normalizedId = institutionId ? Number(institutionId) : null;
    const payload = {
      institutionId: Number.isFinite(normalizedId) ? normalizedId : null,
      institutionCode: institutionCode.trim() || null,
      message: message.trim() || null,
    };

    joinMutation.mutate(payload);
  };

  return (
    <section className="page-main" style={{ display: 'grid', gap: 'var(--space-5)' }}>
      <header className="surface-card" style={{ padding: 'var(--space-6)', display: 'grid', gap: 'var(--space-2)' }}>
        <p className="label-text">Student Institution Access</p>
        <h1 style={{ fontSize: 'var(--text-2xl)' }}>Join an Institution</h1>
        <p style={{ color: 'var(--color-text-secondary)', maxWidth: 760 }}>
          Request membership to an institution so you can appear in institution-specific coding tests and reports.
        </p>
      </header>

      <section className="surface-card" style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-3)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 'var(--space-2)', maxWidth: 640 }}>
          <label className="label-text">Select Institution</label>
          <select
            className="ui-select"
            value={institutionId}
            onChange={(event) => setInstitutionId(event.target.value)}
          >
            <option value="">Choose from active institutions</option>
            {institutions.map((institution) => (
              <option key={institution.id} value={institution.id}>
                {institution.name} ({institution.code || `#${institution.id}`})
              </option>
            ))}
          </select>

          <label className="label-text">Or enter institution code</label>
          <input
            className="ui-input"
            value={institutionCode}
            onChange={(event) => setInstitutionCode(event.target.value)}
            placeholder="INST-ABCD-1234"
          />

          <label className="label-text">Message (optional)</label>
          <textarea
            className="ui-input"
            rows={3}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Mention your department, batch, or reason for joining"
          />

          <button type="submit" className="ui-button ui-button-primary" disabled={joinMutation.isPending}>
            {joinMutation.isPending ? 'Submitting...' : 'Submit Join Request'}
          </button>
        </form>

        {discoverQuery.isLoading ? (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Loading institutions...</p>
        ) : null}

        {feedback ? <p style={{ fontSize: 'var(--text-sm)' }}>{feedback}</p> : null}
      </section>
    </section>
  );
}

export default InstitutionJoinPage;
