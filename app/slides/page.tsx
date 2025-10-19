/**
 * Slides Page - Redirect to Chat Workflow
 *
 * This page redirects to the new inline slides workflow in chat.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 4: Layout Integration
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SlidesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to chat with slides workflow
    router.replace('/chat?workflow=slides');
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">Redirecting to Slides Workflow...</p>
      </div>
    </div>
  );
}
