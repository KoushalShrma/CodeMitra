import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { User, Mail, Building, GraduationCap, Code, Save, Loader2 } from 'lucide-react';
import { getCurrentUser, updateUser, createUser } from '../services/api';

function ProfilePage() {
  const { user: clerkUser } = useUser();
  const { getToken } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    branch: '',
    yearOfStudy: '',
    college: '',
    preferredLanguage: 'PYTHON'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const languages = [
    { value: 'PYTHON', label: 'Python' },
    { value: 'JAVA', label: 'Java' },
    { value: 'JAVASCRIPT', label: 'JavaScript' },
    { value: 'CPP', label: 'C++' },
  ];

  const yearOptions = [1, 2, 3, 4, 5];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await getCurrentUser();
      if (response.data.success && response.data.data) {
        const userData = response.data.data;
        setProfile({
          name: userData.name || clerkUser?.fullName || '',
          branch: userData.branch || '',
          yearOfStudy: userData.yearOfStudy || '',
          college: userData.college || '',
          preferredLanguage: userData.preferredLanguage || 'PYTHON'
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Initialize with Clerk user data
      if (clerkUser) {
        setProfile(prev => ({
          ...prev,
          name: clerkUser.fullName || ''
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      // Try to update, if that fails, create
      try {
        await updateUser(profile);
      } catch (updateError) {
        // User might not exist yet, try creating
        await createUser({
          clerkUserId: clerkUser?.id,
          email: clerkUser?.primaryEmailAddress?.emailAddress,
          ...profile
        });
      }
      
      setMessage({ type: 'success', text: 'Profile saved successfully!' });
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Failed to save profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
        <p className="text-gray-400">
          Update your profile information to personalize your experience.
        </p>
      </div>

      {/* Clerk User Info */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="flex items-center space-x-4">
          {clerkUser?.imageUrl && (
            <img 
              src={clerkUser.imageUrl} 
              alt="Profile" 
              className="h-16 w-16 rounded-full"
            />
          )}
          <div>
            <p className="font-semibold text-lg">{clerkUser?.fullName || 'User'}</p>
            <p className="text-gray-400">{clerkUser?.primaryEmailAddress?.emailAddress}</p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-6">Edit Profile</h2>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-900/20 border border-green-700 text-green-400'
              : 'bg-red-900/20 border border-red-700 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <User className="inline h-4 w-4 mr-2" />
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Your full name"
            />
          </div>

          {/* College */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Building className="inline h-4 w-4 mr-2" />
              College / Institution
            </label>
            <input
              type="text"
              name="college"
              value={profile.college}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Your college name"
            />
          </div>

          {/* Branch */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <GraduationCap className="inline h-4 w-4 mr-2" />
              Branch / Major
            </label>
            <input
              type="text"
              name="branch"
              value={profile.branch}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g., Computer Science, IT, ECE"
            />
          </div>

          {/* Year of Study */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Year of Study
            </label>
            <select
              name="yearOfStudy"
              value={profile.yearOfStudy}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Select year</option>
              {yearOptions.map(year => (
                <option key={year} value={year}>Year {year}</option>
              ))}
            </select>
          </div>

          {/* Preferred Language */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Code className="inline h-4 w-4 mr-2" />
              Preferred Programming Language
            </label>
            <select
              name="preferredLanguage"
              value={profile.preferredLanguage}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              {languages.map(lang => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProfilePage;
