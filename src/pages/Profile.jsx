import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ProfileCard from '../components/ProfileCard';
import {
  BASE_URL,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  uploadProfileImage,
} from '../services/apiClient';
import { QUERY_STALE_TIMES, queryKeys } from '../services/queryConfig';
import { useAuth } from '../context/AuthContext';

function toAbsoluteImageUrl(imagePath) {
  if (!imagePath) {
    return '';
  }

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  return `${BASE_URL}${imagePath}`;
}

function Profile() {
  const { user, applyUserPatch } = useAuth();
  const queryClient = useQueryClient();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [bioInput, setBioInput] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('success');

  const {
    data: profileResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.currentUserProfile(user?.id),
    queryFn: () => getCurrentUserProfile(),
    enabled: Boolean(user?.id),
    staleTime: QUERY_STALE_TIMES.profile,
  });

  const profile = profileResponse?.user
    ? {
        ...profileResponse.user,
        profile_image: toAbsoluteImageUrl(profileResponse.user.profile_image),
      }
    : null;

  const saveProfileMutation = useMutation({
    mutationFn: async ({ name, bio, imageFile }) => {
      let nextProfileImagePath;

      if (imageFile) {
        const uploadResponse = await uploadProfileImage(imageFile);
        nextProfileImagePath = uploadResponse.imageUrl;
      }

      const updatePayload = {
        name,
        bio,
      };

      if (nextProfileImagePath) {
        updatePayload.profile_image = nextProfileImagePath;
      }

      return updateCurrentUserProfile(updatePayload);
    },
    onSuccess: (updateResponse) => {
      const updatedUser = {
        ...profile,
        ...updateResponse.user,
        profile_image: toAbsoluteImageUrl(updateResponse.user.profile_image),
      };

      queryClient.setQueryData(queryKeys.currentUserProfile(user.id), updateResponse);

      applyUserPatch({
        name: updatedUser.name,
        email: updatedUser.email,
        bio: updatedUser.bio,
        profile_image: updatedUser.profile_image,
      });

      setStatusType('success');
      setStatusMessage('Profile updated successfully.');
      setIsEditorOpen(false);
    },
    onError: (saveError) => {
      setStatusType('error');
      setStatusMessage(saveError instanceof Error ? saveError.message : 'Unable to save profile');
    },
  });

  const pageError = !user?.id
    ? 'Please log in to view your profile.'
    : error instanceof Error
      ? error.message
      : '';

  const openEditor = () => {
    setNameInput(profile?.name || '');
    setBioInput(profile?.bio || '');
    setSelectedImageFile(null);
    setStatusMessage('');
    setIsEditorOpen(true);
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    if (!user?.id) {
      setStatusType('error');
      setStatusMessage('You are not logged in.');
      return;
    }

    if (!nameInput.trim()) {
      setStatusType('error');
      setStatusMessage('Name is required.');
      return;
    }

    setStatusMessage('');

    saveProfileMutation.mutate({
      name: nameInput.trim(),
      bio: bioInput.trim(),
      imageFile: selectedImageFile,
    });
  };

  return (
    <section className="premium-page">
      <header className="premium-hero subtle-grid">
        <div className="relative z-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">
            Personal Hub
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-brand-text sm:text-3xl">
            Your Profile
          </h1>
          <p className="mt-3 text-sm leading-7 text-brand-muted sm:text-base">
            Manage your personal details and monitor your coding momentum in one place.
          </p>
        </div>
      </header>

      {statusMessage ? (
        <p className={statusType === 'error' ? 'status-error' : 'status-success'}>
          {statusMessage}
        </p>
      ) : null}

      <ProfileCard
        user={profile}
        isLoading={isLoading}
        error={pageError}
        onEditClick={openEditor}
      />

      {isEditorOpen ? (
        <section className="premium-card mx-auto w-full max-w-3xl">
          <h2 className="text-lg font-semibold text-brand-text">Edit Profile</h2>

          <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="profile-name"
                className="mb-1.5 block text-sm font-medium text-brand-muted"
              >
                Name
              </label>
              <input
                id="profile-name"
                type="text"
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                className="form-input"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label
                htmlFor="profile-bio"
                className="mb-1.5 block text-sm font-medium text-brand-muted"
              >
                Bio
              </label>
              <textarea
                id="profile-bio"
                rows={4}
                value={bioInput}
                onChange={(event) => setBioInput(event.target.value)}
                className="form-input resize-none"
                placeholder="Tell us about your coding journey"
              />
            </div>

            <div>
              <label
                htmlFor="profile-image"
                className="mb-1.5 block text-sm font-medium text-brand-muted"
              >
                Profile Image
              </label>
              <input
                id="profile-image"
                type="file"
                accept="image/*"
                onChange={(event) => setSelectedImageFile(event.target.files?.[0] || null)}
                className="block w-full rounded-xl border border-brand-border/70 bg-brand-elevated/50 px-3 py-2.5 text-sm text-brand-text file:mr-3 file:rounded-lg file:border-0 file:bg-brand-secondary/20 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-text"
              />
              {selectedImageFile ? (
                <p className="mt-2 text-xs text-brand-muted">Selected: {selectedImageFile.name}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={saveProfileMutation.isPending}
                className="rounded-xl bg-gradient-to-r from-brand-accent to-brand-accentSoft px-4 py-2.5 text-sm font-semibold text-slate-900 transition-all hover:brightness-105 disabled:opacity-70"
              >
                {saveProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>

              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="rounded-xl border border-brand-border/70 bg-brand-elevated px-4 py-2.5 text-sm font-semibold text-brand-text"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </section>
  );
}

export default Profile;
