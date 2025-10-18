'use client';

import { useState } from 'react';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import {
  migrateLocalStorageToSupabase,
  getMigrationStatus,
  type MigrationResult
} from '@/scripts/migrate-to-supabase';

export default function MigratePage() {
  const [status, setStatus] = useState<Awaited<ReturnType<typeof getMigrationStatus>> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);

  const checkStatus = async () => {
    setIsLoading(true);
    const migrationStatus = await getMigrationStatus();
    setStatus(migrationStatus);
    setIsLoading(false);
  };

  const runMigration = async () => {
    if (!confirm('Are you sure you want to migrate localStorage data to Supabase? This will backup your localStorage data.')) {
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const migrationResult = await migrateLocalStorageToSupabase();
      setResult(migrationResult);
    } catch (error) {
      setResult({
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        conversationsMigrated: 0,
        messagesMigrated: 0,
      });
    } finally {
      setIsLoading(false);
      await checkStatus(); // Refresh status
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🚀 Migrate to Supabase
        </h1>
        <p className="text-gray-600 mb-8">
          Migrate your chat data from localStorage to Supabase for unlimited storage and multi-device sync.
        </p>

        {/* Status Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Migration Status</h2>

          {!status && (
            <button
              onClick={checkStatus}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Checking...' : 'Check Status'}
            </button>
          )}

          {status && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-gray-700">localStorage data:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  status.hasLocalStorage
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {status.hasLocalStorage ? '⚠️ Present' : '✅ Clean'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-gray-700">Supabase conversations:</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {status.supabaseConversationCount} conversations
                </span>
              </div>

              {status.recommendMigration && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 font-medium">
                    📊 Migration Recommended
                  </p>
                  <p className="text-yellow-700 text-sm mt-1">
                    You have localStorage data but no Supabase data. Run migration to move your chats to the cloud.
                  </p>
                </div>
              )}

              <button
                onClick={checkStatus}
                disabled={isLoading}
                className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                🔄 Refresh Status
              </button>
            </div>
          )}
        </div>

        {/* Migration Action */}
        {status && status.hasLocalStorage && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Run Migration</h2>

            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">What will happen:</h3>
              <ul className="text-blue-800 text-sm space-y-1 list-disc list-inside">
                <li>All conversations will be copied to Supabase</li>
                <li>All messages will be preserved</li>
                <li>localStorage data will be backed up (not deleted)</li>
                <li>You can verify the migration before removing old data</li>
              </ul>
            </div>

            <button
              onClick={runMigration}
              disabled={isLoading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {isLoading ? '⏳ Migrating...' : '▶️ Start Migration'}
            </button>
          </div>
        )}

        {/* Migration Result */}
        {result && (
          <div className={`bg-white rounded-lg shadow-sm p-6 ${
            result.success ? 'border-2 border-green-500' : 'border-2 border-red-500'
          }`}>
            <h2 className="text-xl font-semibold mb-4">
              {result.success ? '✅ Migration Complete' : '❌ Migration Failed'}
            </h2>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-gray-700">Conversations migrated:</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {result.conversationsMigrated}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-gray-700">Messages migrated:</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {result.messagesMigrated}
                </span>
              </div>

              {result.errors.length > 0 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium mb-2">
                    ⚠️ {result.errors.length} Error(s)
                  </p>
                  <ul className="text-red-700 text-sm space-y-1">
                    {result.errors.map((err: string, i: number) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.success && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium mb-2">
                    🎉 Next Steps
                  </p>
                  <ol className="text-green-700 text-sm space-y-2 list-decimal list-inside">
                    <li>Go to <a href="/chat" className="underline font-medium">/chat</a> and verify your conversations are there</li>
                    <li>Check that messages and attachments loaded correctly</li>
                    <li>Once verified, you can safely delete the localStorage backup</li>
                    <li>Your chats are now synced to Supabase! ☁️</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-3">📚 Instructions</h2>
          <ol className="text-gray-700 text-sm space-y-2 list-decimal list-inside">
            <li>First, run the Supabase migration SQL in your database</li>
            <li>Check migration status to see if you have data to migrate</li>
            <li>Run the migration - it will backup your localStorage automatically</li>
            <li>Verify your data in the chat interface</li>
            <li>Once confirmed, the old localStorage can be safely removed</li>
          </ol>
        </div>
      </div>
      </div>
    </ErrorBoundary>
  );
}
