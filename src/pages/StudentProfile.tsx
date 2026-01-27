import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import StudentLayout from '@/components/StudentLayout';

export default function StudentProfile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          <div className="space-y-6">
            {/* Profile Picture Section */}
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-4xl">👤</span>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-foreground">
                  {user?.name || 'Student'}
                </h2>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            {/* Profile Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    defaultValue={user?.name || ''}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                  />
                ) : (
                  <p className="text-lg text-foreground">{user?.name || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <p className="text-lg text-foreground">{user?.email || 'Not set'}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    defaultValue={user?.phone || ''}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                  />
                ) : (
                  <p className="text-lg text-foreground">{user?.phone || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Account Type
                </label>
                <p className="text-lg text-foreground capitalize">{user?.role || 'Student'}</p>
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}

