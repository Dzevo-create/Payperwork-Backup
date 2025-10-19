/**
 * API Route: Get Manus Task Status
 *
 * GET /api/slides/manus-task/[taskId]
 *
 * Returns the current status of a Manus task
 */

import { NextRequest, NextResponse } from 'next/server';
import { getManusClient } from '@/lib/api/slides/manus-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Get task status from Manus API
    const manusClient = getManusClient();
    const taskStatus = await manusClient.getTaskStatus(taskId);

    console.log('📊 Task status:', taskStatus.status);

    return NextResponse.json({
      success: true,
      data: taskStatus,
    });
  } catch (error: any) {
    console.error('Error getting task status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get task status',
      },
      { status: 500 }
    );
  }
}
