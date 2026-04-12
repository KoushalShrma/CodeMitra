import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  approveAdminInstitutionRequest,
  createAdminUser,
  getAdminInstitutions,
  getAdminCurrentProfile,
  getAdminInstitutionRequests,
  getAdminUsers,
  removeAdminInstitution,
  rejectAdminInstitutionRequest,
  updateAdminUserPermissions,
} from '../services/apiClient';
import { clearAdminSession } from '../utils/adminSession';

function emptyApprovalState() {
  return {
    institutionCode: '',
    loginEmail: '',
    note: '',
  };
}

function emptyCreateAdminForm() {
  return {
    name: '',
    username: '',
    email: '',
    password: '',
    canAddAdmins: false,
    canApproveInstitutions: false,
  };
}

function AdminDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('PENDING');
  const [institutionStatus, setInstitutionStatus] = useState('ACTIVE');
  const [approvalStateById, setApprovalStateById] = useState({});
  const [createAdminForm, setCreateAdminForm] = useState(() => emptyCreateAdminForm());
  const [errorMessage, setErrorMessage] = useState('');

  const profileQuery = useQuery({
    queryKey: ['adminProfile'],
    queryFn: getAdminCurrentProfile,
  });

  const requestsQuery = useQuery({
    queryKey: ['adminInstitutionRequests', status],
    queryFn: () => getAdminInstitutionRequests(status),
    enabled: Boolean(profileQuery.data?.admin?.canApproveInstitutions),
  });

  const adminUsersQuery = useQuery({
    queryKey: ['adminUsers'],
    queryFn: getAdminUsers,
    enabled: Boolean(profileQuery.data?.admin?.canAddAdmins),
  });

  const institutionsQuery = useQuery({
    queryKey: ['adminInstitutions', institutionStatus],
    queryFn: () => getAdminInstitutions(institutionStatus),
    enabled: Boolean(profileQuery.data?.admin?.canApproveInstitutions),
  });

  const approveMutation = useMutation({
    mutationFn: ({ requestId, payload }) => approveAdminInstitutionRequest(requestId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['adminInstitutionRequests'] });
      setErrorMessage('');
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to approve request');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ requestId, payload }) => rejectAdminInstitutionRequest(requestId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['adminInstitutionRequests'] });
      setErrorMessage('');
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to reject request');
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: (payload) => createAdminUser(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setCreateAdminForm(emptyCreateAdminForm());
      setErrorMessage('');
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create admin');
    },
  });

  const updatePermissionMutation = useMutation({
    mutationFn: ({ adminId, payload }) => updateAdminUserPermissions(adminId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setErrorMessage('');
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update permissions');
    },
  });

  const removeInstitutionMutation = useMutation({
    mutationFn: (institutionId) => removeAdminInstitution(institutionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['adminInstitutions'] });
      void queryClient.invalidateQueries({ queryKey: ['adminInstitutionRequests'] });
      setErrorMessage('');
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to remove institution');
    },
  });

  const requests = useMemo(() => requestsQuery.data?.requests || [], [requestsQuery.data]);
  const adminUsers = useMemo(() => adminUsersQuery.data?.admins || [], [adminUsersQuery.data]);
  const institutions = useMemo(() => institutionsQuery.data?.institutions || [], [institutionsQuery.data]);
  const canApproveInstitutions = Boolean(profileQuery.data?.admin?.canApproveInstitutions);
  const canAddAdmins = Boolean(profileQuery.data?.admin?.canAddAdmins);

  const getApprovalState = (requestId) => approvalStateById[requestId] || emptyApprovalState();

  const updateApprovalState = (requestId, patch) => {
    setApprovalStateById((current) => ({
      ...current,
      [requestId]: {
        ...getApprovalState(requestId),
        ...patch,
      },
    }));
  };

  const handleApprove = (requestId) => {
    const state = getApprovalState(requestId);
    approveMutation.mutate({
      requestId,
      payload: {
        institutionCode: state.institutionCode || undefined,
        loginEmail: state.loginEmail || undefined,
        note: state.note || undefined,
      },
    });
  };

  const handleReject = (requestId) => {
    const state = getApprovalState(requestId);
    rejectMutation.mutate({
      requestId,
      payload: {
        note: state.note || undefined,
      },
    });
  };

  const handleCreateAdminFieldChange = (event) => {
    const { name, type, checked, value } = event.target;
    setCreateAdminForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreateAdmin = (event) => {
    event.preventDefault();
    setErrorMessage('');
    createAdminMutation.mutate({
      name: createAdminForm.name,
      username: createAdminForm.username,
      email: createAdminForm.email,
      password: createAdminForm.password,
      canAddAdmins: createAdminForm.canAddAdmins,
      canApproveInstitutions: createAdminForm.canApproveInstitutions,
    });
  };

  const handleTogglePermission = (admin, key, checked) => {
    updatePermissionMutation.mutate({
      adminId: admin.id,
      payload: {
        canAddAdmins: key === 'canAddAdmins' ? checked : admin.canAddAdmins,
        canApproveInstitutions:
          key === 'canApproveInstitutions' ? checked : admin.canApproveInstitutions,
      },
    });
  };

  const isLoading =
    profileQuery.isLoading
    || (canApproveInstitutions && requestsQuery.isLoading)
    || (canApproveInstitutions && institutionsQuery.isLoading)
    || (canAddAdmins && adminUsersQuery.isLoading);
  const queryError =
    profileQuery.error instanceof Error
      ? profileQuery.error.message
      : requestsQuery.error instanceof Error
        ? requestsQuery.error.message
        : institutionsQuery.error instanceof Error
          ? institutionsQuery.error.message
        : adminUsersQuery.error instanceof Error
          ? adminUsersQuery.error.message
        : '';

  return (
    <main className="page-container">
      <section className="page-main" style={{ display: 'grid', gap: 'var(--space-5)' }}>
        <header
          className="surface-card"
          style={{
            padding: 'var(--space-6)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--space-2)',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <p className="label-text">Super Admin Dashboard</p>
            <h1 style={{ fontSize: 'var(--text-2xl)', marginTop: 'var(--space-1)' }}>
              Admin Control Center
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              Logged in as {profileQuery.data?.admin?.name || profileQuery.data?.admin?.email || 'Admin'}
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
              <span className="ui-badge">
                Can add admins: {canAddAdmins ? 'Yes' : 'No'}
              </span>
              <span className="ui-badge">
                Can approve institutions: {canApproveInstitutions ? 'Yes' : 'No'}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="ui-button ui-button-danger"
            onClick={() => {
              clearAdminSession();
              navigate('/admin/login', { replace: true });
            }}
          >
            Logout
          </button>
        </header>

        {errorMessage || queryError ? (
          <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>
            {errorMessage || queryError}
          </p>
        ) : null}

        <section className="surface-card" style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-3)' }}>
          <p className="label-text">Institution Approval Requests</p>

          {!canApproveInstitutions ? (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              Your account does not have permission to approve institution requests.
            </p>
          ) : isLoading ? (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              Loading requests...
            </p>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                {['PENDING', 'APPROVED', 'REJECTED', ''].map((item) => (
                  <button
                    key={item || 'ALL'}
                    type="button"
                    className={status === item ? 'ui-button ui-button-primary' : 'ui-button ui-button-secondary'}
                    onClick={() => setStatus(item)}
                  >
                    {item || 'ALL'}
                  </button>
                ))}
              </div>

              {!requests.length ? (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                  No requests found for this filter.
                </p>
              ) : (
                <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                  {requests.map((request) => {
                    const approvalState = getApprovalState(request.id);
                    return (
                      <article
                        key={request.id}
                        className="surface-elevated"
                        style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-2)' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                          <div>
                            <strong style={{ fontSize: 'var(--text-base)' }}>{request.institutionName}</strong>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                              {request.institutionType} | {request.officialEmail}
                            </p>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                              Contact: {request.contactName} ({request.contactEmail})
                            </p>
                          </div>
                          <span className="label-text">{request.status}</span>
                        </div>

                        {request.message ? (
                          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>{request.message}</p>
                        ) : null}

                        {request.status === 'PENDING' ? (
                          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                              <input
                                value={approvalState.institutionCode}
                                onChange={(event) =>
                                  updateApprovalState(request.id, { institutionCode: event.target.value })
                                }
                                className="ui-input"
                                style={{ maxWidth: 220 }}
                                placeholder="Institution code (optional)"
                              />
                              <input
                                value={approvalState.loginEmail}
                                onChange={(event) =>
                                  updateApprovalState(request.id, { loginEmail: event.target.value })
                                }
                                className="ui-input"
                                style={{ maxWidth: 260 }}
                                placeholder="Login email (optional)"
                              />
                            </div>

                            <textarea
                              value={approvalState.note}
                              onChange={(event) => updateApprovalState(request.id, { note: event.target.value })}
                              className="ui-input"
                              rows={2}
                              placeholder="Admin note (optional)"
                            />

                            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className="ui-button ui-button-primary"
                                onClick={() => handleApprove(request.id)}
                                disabled={approveMutation.isPending}
                              >
                                {approveMutation.isPending ? 'Approving...' : 'Approve'}
                              </button>
                              <button
                                type="button"
                                className="ui-button ui-button-danger"
                                onClick={() => handleReject(request.id)}
                                disabled={rejectMutation.isPending}
                              >
                                {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>

        <section className="surface-card" style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-3)' }}>
          <p className="label-text">Institution Management</p>

          {!canApproveInstitutions ? (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              Your account does not have permission to manage institutions.
            </p>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                {['ACTIVE', 'REMOVED', ''].map((item) => (
                  <button
                    key={item || 'ALL_INSTITUTIONS'}
                    type="button"
                    className={institutionStatus === item ? 'ui-button ui-button-primary' : 'ui-button ui-button-secondary'}
                    onClick={() => setInstitutionStatus(item)}
                  >
                    {item || 'ALL'}
                  </button>
                ))}
              </div>

              {!institutions.length ? (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                  No institutions found for this filter.
                </p>
              ) : (
                <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                  {institutions.map((institution) => {
                    const isRemoved = String(institution.status || '').toUpperCase() === 'REMOVED';
                    return (
                      <article
                        key={institution.id}
                        className="surface-elevated"
                        style={{ padding: 'var(--space-3)', display: 'grid', gap: 'var(--space-2)' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                          <div>
                            <strong>{institution.name}</strong>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                              {institution.type} | {institution.code || '-'}
                            </p>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                              Login: {institution.loginEmail || '-'}
                            </p>
                          </div>
                          <span className="label-text">{institution.status || 'ACTIVE'}</span>
                        </div>

                        {!isRemoved ? (
                          <div>
                            <button
                              type="button"
                              className="ui-button ui-button-danger"
                              onClick={() => removeInstitutionMutation.mutate(institution.id)}
                              disabled={removeInstitutionMutation.isPending}
                            >
                              {removeInstitutionMutation.isPending ? 'Removing...' : 'Remove Institution'}
                            </button>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>

        <section className="surface-card" style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-3)' }}>
          <p className="label-text">Admin Management</p>

          {!canAddAdmins ? (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              Your account does not have permission to create or edit admins.
            </p>
          ) : (
            <>
              <form onSubmit={handleCreateAdmin} style={{ display: 'grid', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <input
                    name="name"
                    value={createAdminForm.name}
                    onChange={handleCreateAdminFieldChange}
                    className="ui-input"
                    style={{ maxWidth: 240 }}
                    placeholder="Admin name"
                    required
                  />
                  <input
                    name="username"
                    value={createAdminForm.username}
                    onChange={handleCreateAdminFieldChange}
                    className="ui-input"
                    style={{ maxWidth: 220 }}
                    placeholder="Username"
                    required
                  />
                  <input
                    name="email"
                    value={createAdminForm.email}
                    onChange={handleCreateAdminFieldChange}
                    className="ui-input"
                    style={{ maxWidth: 280 }}
                    type="email"
                    placeholder="Email"
                    required
                  />
                  <input
                    name="password"
                    value={createAdminForm.password}
                    onChange={handleCreateAdminFieldChange}
                    className="ui-input"
                    style={{ maxWidth: 200 }}
                    type="password"
                    placeholder="Password"
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <input
                      type="checkbox"
                      name="canAddAdmins"
                      checked={createAdminForm.canAddAdmins}
                      onChange={handleCreateAdminFieldChange}
                    />
                    <span style={{ fontSize: 'var(--text-sm)' }}>Can add/manage admins</span>
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <input
                      type="checkbox"
                      name="canApproveInstitutions"
                      checked={createAdminForm.canApproveInstitutions}
                      onChange={handleCreateAdminFieldChange}
                    />
                    <span style={{ fontSize: 'var(--text-sm)' }}>Can approve institutions</span>
                  </label>
                </div>

                <button type="submit" className="ui-button ui-button-primary" disabled={createAdminMutation.isPending}>
                  {createAdminMutation.isPending ? 'Creating admin...' : 'Create Admin'}
                </button>
              </form>

              {!adminUsers.length ? (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                  No admins found.
                </p>
              ) : (
                <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                  {adminUsers.map((admin) => (
                    <article
                      key={admin.id}
                      className="surface-elevated"
                      style={{ padding: 'var(--space-3)', display: 'grid', gap: 'var(--space-2)' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                        <div>
                          <strong>{admin.name}</strong>
                          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                            {admin.username} | {admin.email}
                          </p>
                        </div>
                        <span className="label-text">ID {admin.id}</span>
                      </div>

                      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <input
                            type="checkbox"
                            checked={Boolean(admin.canAddAdmins)}
                            onChange={(event) => handleTogglePermission(admin, 'canAddAdmins', event.target.checked)}
                            disabled={updatePermissionMutation.isPending}
                          />
                          <span style={{ fontSize: 'var(--text-sm)' }}>Can add admins</span>
                        </label>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <input
                            type="checkbox"
                            checked={Boolean(admin.canApproveInstitutions)}
                            onChange={(event) =>
                              handleTogglePermission(admin, 'canApproveInstitutions', event.target.checked)
                            }
                            disabled={updatePermissionMutation.isPending}
                          />
                          <span style={{ fontSize: 'var(--text-sm)' }}>Can approve institutions</span>
                        </label>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </section>
    </main>
  );
}

export default AdminDashboardPage;
