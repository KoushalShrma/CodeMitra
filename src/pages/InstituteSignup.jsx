import { useState } from 'react';
import AuthRoleSwitch from '../components/auth/AuthRoleSwitch';
import { submitInstitutionRegistrationRequest } from '../services/apiClient';

function InstituteSignup() {
  const [form, setForm] = useState({
    institutionName: '',
    institutionType: 'COLLEGE',
    officialEmail: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback('');
    setIsSubmitting(true);

    try {
      const response = await submitInstitutionRegistrationRequest(form);
      setFeedback(response?.message || 'Institution request submitted successfully');
      setForm({
        institutionName: '',
        institutionType: 'COLLEGE',
        officialEmail: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        website: '',
        message: '',
      });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to submit institution request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-shell fade-slide-in">
      <div className="auth-card" style={{ maxWidth: 640, width: '100%' }}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">
          Institution Onboarding
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-brand-text">
          Request Institution Access
        </h1>
        <p className="mt-2 text-sm text-brand-muted">
          Submit your institution details. A super admin reviews and activates your organization.
        </p>

        <AuthRoleSwitch
          mode="signup"
          activeRole="organization"
          organizationHref="/institute-signup"
        />

        <form onSubmit={handleSubmit} className="mt-6" style={{ display: 'grid', gap: '0.75rem' }}>
          <input
            name="institutionName"
            value={form.institutionName}
            onChange={handleChange}
            className="ui-input"
            placeholder="Institution name"
            required
          />

          <select
            name="institutionType"
            value={form.institutionType}
            onChange={handleChange}
            className="ui-select"
            required
          >
            <option value="COLLEGE">College</option>
            <option value="SCHOOL">School</option>
            <option value="COMPANY">Company</option>
            <option value="TRAINING">Training</option>
          </select>

          <input
            name="officialEmail"
            value={form.officialEmail}
            onChange={handleChange}
            className="ui-input"
            type="email"
            placeholder="Official institution email"
            required
          />

          <input
            name="contactName"
            value={form.contactName}
            onChange={handleChange}
            className="ui-input"
            placeholder="Contact person name"
            required
          />

          <input
            name="contactEmail"
            value={form.contactEmail}
            onChange={handleChange}
            className="ui-input"
            type="email"
            placeholder="Contact person email"
            required
          />

          <input
            name="contactPhone"
            value={form.contactPhone}
            onChange={handleChange}
            className="ui-input"
            placeholder="Contact phone (optional)"
          />

          <input
            name="website"
            value={form.website}
            onChange={handleChange}
            className="ui-input"
            placeholder="Website (optional)"
          />

          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            className="ui-input"
            rows={3}
            placeholder="Additional details (optional)"
          />

          <button type="submit" className="ui-button ui-button-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>

          {feedback ? (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{feedback}</p>
          ) : null}
        </form>
      </div>
    </section>
  );
}

export default InstituteSignup;
