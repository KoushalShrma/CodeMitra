import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveInstitutionJoinRequestV2,
  deregisterInstitutionMemberV2,
  getInstitutionCurrentProfile,
  getInstitutionJoinRequestsV2,
  getInstitutionMembersV2,
  rejectInstitutionJoinRequestV2,
} from '../services/apiClient';

function InstitutionMembersPage() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState('');

  const profileQuery = useQuery({
    queryKey: ['institutionAuthProfile'],
    queryFn: getInstitutionCurrentProfile,
  });

  const institutionId = profileQuery.data?.institution?.id
    ? String(profileQuery.data.institution.id)
    : '';

  const joinRequestsQuery = useQuery({
    queryKey: ['institutionJoinRequests', institutionId],
    queryFn: () => getInstitutionJoinRequestsV2(institutionId),
    enabled: Boolean(institutionId),
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
  });

  const membersQuery = useQuery({
    queryKey: ['institutionMembers', institutionId],
    queryFn: () => getInstitutionMembersV2(institutionId),
    enabled: Boolean(institutionId),
  });

  const approveMutation = useMutation({
    mutationFn: ({ requestId }) =>
      approveInstitutionJoinRequestV2(institutionId, requestId, {
        role: 'USER',
      }),
    onSuccess: () => {
      setFeedback('Join request approved');
      void queryClient.invalidateQueries({ queryKey: ['institutionJoinRequests', institutionId] });
      void queryClient.invalidateQueries({ queryKey: ['institutionMembers', institutionId] });
    },
    onError: (error) => {
      setFeedback(error instanceof Error ? error.message : 'Unable to approve join request');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ requestId }) => rejectInstitutionJoinRequestV2(institutionId, requestId, {}),
    onSuccess: () => {
      setFeedback('Join request rejected');
      void queryClient.invalidateQueries({ queryKey: ['institutionJoinRequests', institutionId] });
    },
    onError: (error) => {
      setFeedback(error instanceof Error ? error.message : 'Unable to reject join request');
    },
  });

  const deregisterMutation = useMutation({
    mutationFn: ({ membershipId }) => deregisterInstitutionMemberV2(institutionId, membershipId),
    onSuccess: () => {
      setFeedback('Member deregistered');
      void queryClient.invalidateQueries({ queryKey: ['institutionMembers', institutionId] });
    },
    onError: (error) => {
      setFeedback(error instanceof Error ? error.message : 'Unable to deregister member');
    },
  });

  const pendingRequests = useMemo(
    () => joinRequestsQuery.data?.requests || [],
    [joinRequestsQuery.data]
  );
  const members = useMemo(() => membersQuery.data?.members || [], [membersQuery.data]);

  const queryError =
    profileQuery.error instanceof Error
      ? profileQuery.error.message
      : joinRequestsQuery.error instanceof Error
        ? joinRequestsQuery.error.message
        : membersQuery.error instanceof Error
          ? membersQuery.error.message
          : '';

  return (
    <section className="page-main" style={{ display: 'grid', gap: 'var(--space-5)' }}>
      <header
        className="surface-card"
        style={{ padding: 'var(--space-6)', display: 'grid', gap: 'var(--space-2)' }}
      >
        <p className="label-text">Institution Membership</p>
        <h1 style={{ fontSize: 'var(--text-2xl)' }}>Manage Join Requests</h1>
        <p style={{ color: 'var(--color-text-secondary)', maxWidth: 760 }}>
          Review student join requests and maintain institution member access.
        </p>
      </header>

      {feedback || queryError ? (
        <section className="surface-card" style={{ padding: 'var(--space-4)' }}>
          <p style={{ color: queryError ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
            {feedback || queryError}
          </p>
        </section>
      ) : null}

      {institutionId ? (
        <>
          <section
            className="surface-card"
            style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-2)' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 'var(--space-2)',
                flexWrap: 'wrap',
              }}
            >
              <h2 style={{ fontSize: 'var(--text-lg)' }}>Pending Join Requests</h2>
              <button
                type="button"
                className="ui-button ui-button-secondary"
                onClick={() => joinRequestsQuery.refetch()}
                disabled={joinRequestsQuery.isFetching}
              >
                {joinRequestsQuery.isFetching ? 'Refreshing...' : 'Refresh Requests'}
              </button>
            </div>
            {joinRequestsQuery.isLoading ? (
              <p style={{ color: 'var(--color-text-secondary)' }}>Loading pending requests...</p>
            ) : !pendingRequests.length ? (
              <p style={{ color: 'var(--color-text-secondary)' }}>No pending requests.</p>
            ) : (
              <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                {pendingRequests.map((request) => (
                  <article
                    key={request.id}
                    className="surface-elevated"
                    style={{ padding: 'var(--space-3)', display: 'grid', gap: 'var(--space-2)' }}
                  >
                    <div>
                      <strong>{request.name || `User #${request.userId}`}</strong>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                        {request.email || 'No email available'}
                      </p>
                    </div>
                    {request.message ? (
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                        {request.message}
                      </p>
                    ) : null}
                    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="ui-button ui-button-primary"
                        onClick={() => approveMutation.mutate({ requestId: request.id })}
                        disabled={approveMutation.isPending}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="ui-button ui-button-danger"
                        onClick={() => rejectMutation.mutate({ requestId: request.id })}
                        disabled={rejectMutation.isPending}
                      >
                        Reject
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section
            className="surface-card"
            style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-2)' }}
          >
            <h2 style={{ fontSize: 'var(--text-lg)' }}>Current Members</h2>
            {membersQuery.isLoading ? (
              <p style={{ color: 'var(--color-text-secondary)' }}>Loading members...</p>
            ) : !members.length ? (
              <p style={{ color: 'var(--color-text-secondary)' }}>No members found.</p>
            ) : (
              <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                {members.map((member) => (
                  <article
                    key={member.membershipId}
                    className="surface-elevated"
                    style={{ padding: 'var(--space-3)' }}
                  >
                    <strong>{member.name || `User #${member.userId}`}</strong>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                      {member.email || ''}
                    </p>
                    <p className="label-text" style={{ marginTop: 'var(--space-1)' }}>
                      {member.role}
                    </p>
                    <div style={{ marginTop: 'var(--space-2)' }}>
                      <button
                        type="button"
                        className="ui-button ui-button-danger"
                        onClick={() => deregisterMutation.mutate({ membershipId: member.membershipId })}
                        disabled={deregisterMutation.isPending}
                      >
                        {deregisterMutation.isPending ? 'Deregistering...' : 'Deregister User'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </section>
  );
}

export default InstitutionMembersPage;
