/**
 * Socket Server Tests - Phase 2
 * Tests WebSocket event emission functions
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import {
  initializeSocketServer,
  getSocketServer,
  emitToUser,
  emitPresentationReady,
  emitPresentationError,
  emitSlideUpdated,
  emitThinkingStepUpdate,
  emitThinkingActionAdd,
  emitSlidePreviewUpdate,
  emitGenerationStatus,
  emitGenerationProgress,
  emitGenerationCompleted,
  emitGenerationError,
} from '@/lib/socket/server';
import { WEBSOCKET_EVENTS } from '@/constants/slides';

// Mock Socket.IO
jest.mock('socket.io', () => {
  const mockEmit = jest.fn();
  const mockTo = jest.fn(() => ({ emit: mockEmit }));
  const mockOn = jest.fn();
  const mockJoin = jest.fn();
  const mockDisconnect = jest.fn();

  const mockSocket = {
    id: 'test-socket-id',
    on: mockOn,
    join: mockJoin,
    disconnect: mockDisconnect,
  };

  const MockServer = jest.fn().mockImplementation(() => ({
    on: mockOn,
    to: mockTo,
    emit: mockEmit,
  }));

  return {
    Server: MockServer,
    __mockSocket: mockSocket,
    __mockTo: mockTo,
    __mockEmit: mockEmit,
    __mockOn: mockOn,
  };
});

describe('Socket Server - Phase 2', () => {
  let httpServer: HTTPServer;
  let mockServer: any;

  beforeEach(() => {
    jest.clearAllMocks();
    httpServer = {} as HTTPServer;

    // Reset the io instance by requiring the module again
    jest.resetModules();
  });

  describe('Server Initialization', () => {
    it('should initialize Socket.IO server', () => {
      const io = initializeSocketServer(httpServer);
      expect(io).toBeDefined();
      expect(SocketIOServer).toHaveBeenCalledWith(httpServer, expect.any(Object));
    });

    it('should configure CORS correctly', () => {
      initializeSocketServer(httpServer);
      expect(SocketIOServer).toHaveBeenCalledWith(
        httpServer,
        expect.objectContaining({
          cors: expect.objectContaining({
            methods: ['GET', 'POST'],
            credentials: true,
          }),
        })
      );
    });

    it('should set correct path and transports', () => {
      initializeSocketServer(httpServer);
      expect(SocketIOServer).toHaveBeenCalledWith(
        httpServer,
        expect.objectContaining({
          path: '/api/socket',
          transports: ['websocket', 'polling'],
        })
      );
    });

    it('should return existing server instance on second initialization', () => {
      const io1 = initializeSocketServer(httpServer);
      const io2 = initializeSocketServer(httpServer);
      expect(io1).toBe(io2);
    });

    it('should be retrievable via getSocketServer', () => {
      const io = initializeSocketServer(httpServer);
      expect(getSocketServer()).toBe(io);
    });
  });

  describe('emitToUser', () => {
    beforeEach(() => {
      mockServer = initializeSocketServer(httpServer);
    });

    it('should emit event to user-specific room', () => {
      const { __mockTo, __mockEmit } = require('socket.io');

      emitToUser('user-123', 'test:event', { data: 'test' });

      expect(__mockTo).toHaveBeenCalledWith('user:user-123');
      expect(__mockEmit).toHaveBeenCalledWith('test:event', { data: 'test' });
    });

    it('should handle null server gracefully', () => {
      // Reset modules to clear server instance
      jest.resetModules();

      // Should not throw
      expect(() => {
        emitToUser('user-123', 'test:event', { data: 'test' });
      }).not.toThrow();
    });
  });

  describe('Phase 2 - Thinking Display Events', () => {
    beforeEach(() => {
      mockServer = initializeSocketServer(httpServer);
    });

    describe('emitThinkingStepUpdate', () => {
      it('should emit thinking step update with correct data', () => {
        const { __mockTo, __mockEmit } = require('socket.io');

        const step = {
          id: 'step-1',
          title: 'Analyzing requirements',
          status: 'running' as const,
          description: 'Processing user input...',
          actions: [],
          startedAt: '2024-01-01T00:00:00Z',
        };

        emitThinkingStepUpdate('user-123', step);

        expect(__mockTo).toHaveBeenCalledWith('user:user-123');
        expect(__mockEmit).toHaveBeenCalledWith(
          WEBSOCKET_EVENTS.THINKING_STEP_UPDATE,
          expect.objectContaining({
            step,
            timestamp: expect.any(String),
          })
        );
      });

      it('should include all step statuses', () => {
        const { __mockEmit } = require('socket.io');

        const statuses: ('pending' | 'running' | 'completed' | 'failed')[] = [
          'pending',
          'running',
          'completed',
          'failed',
        ];

        statuses.forEach((status) => {
          const step = {
            id: 'step-1',
            title: 'Test Step',
            status,
            actions: [],
          };

          emitThinkingStepUpdate('user-123', step);

          expect(__mockEmit).toHaveBeenCalledWith(
            WEBSOCKET_EVENTS.THINKING_STEP_UPDATE,
            expect.objectContaining({
              step: expect.objectContaining({ status }),
            })
          );
        });
      });

      it('should include optional fields when provided', () => {
        const { __mockEmit } = require('socket.io');

        const step = {
          id: 'step-1',
          title: 'Test Step',
          status: 'completed' as const,
          description: 'Test description',
          actions: [{ id: 'action-1', type: 'search', text: 'Searching...' }],
          result: 'Success',
          startedAt: '2024-01-01T00:00:00Z',
          completedAt: '2024-01-01T00:01:00Z',
        };

        emitThinkingStepUpdate('user-123', step);

        expect(__mockEmit).toHaveBeenCalledWith(
          WEBSOCKET_EVENTS.THINKING_STEP_UPDATE,
          expect.objectContaining({
            step: expect.objectContaining({
              description: 'Test description',
              result: 'Success',
              startedAt: '2024-01-01T00:00:00Z',
              completedAt: '2024-01-01T00:01:00Z',
            }),
          })
        );
      });
    });

    describe('emitThinkingActionAdd', () => {
      it('should emit thinking action add with correct data', () => {
        const { __mockTo, __mockEmit } = require('socket.io');

        const action = {
          id: 'action-1',
          type: 'search',
          text: 'Searching for presentation templates...',
          timestamp: '2024-01-01T00:00:00Z',
        };

        emitThinkingActionAdd('user-123', 'step-1', action);

        expect(__mockTo).toHaveBeenCalledWith('user:user-123');
        expect(__mockEmit).toHaveBeenCalledWith(
          WEBSOCKET_EVENTS.THINKING_ACTION_ADD,
          expect.objectContaining({
            stepId: 'step-1',
            action,
            timestamp: expect.any(String),
          })
        );
      });

      it('should handle actions without timestamp', () => {
        const { __mockEmit } = require('socket.io');

        const action = {
          id: 'action-1',
          type: 'analysis',
          text: 'Analyzing content structure...',
        };

        emitThinkingActionAdd('user-123', 'step-1', action);

        expect(__mockEmit).toHaveBeenCalledWith(
          WEBSOCKET_EVENTS.THINKING_ACTION_ADD,
          expect.objectContaining({
            action: expect.objectContaining({
              id: 'action-1',
              type: 'analysis',
              text: 'Analyzing content structure...',
            }),
          })
        );
      });
    });
  });

  describe('Phase 2 - Live Preview Events', () => {
    beforeEach(() => {
      mockServer = initializeSocketServer(httpServer);
    });

    describe('emitSlidePreviewUpdate', () => {
      it('should emit slide preview update with correct data', () => {
        const { __mockTo, __mockEmit } = require('socket.io');

        const slide = {
          order_index: 1,
          title: 'Introduction',
          content: '# Welcome\n\nThis is the introduction slide.',
          layout: 'title_slide',
        };

        emitSlidePreviewUpdate('user-123', 'presentation-456', slide);

        expect(__mockTo).toHaveBeenCalledWith('user:user-123');
        expect(__mockEmit).toHaveBeenCalledWith(
          WEBSOCKET_EVENTS.SLIDE_PREVIEW_UPDATE,
          expect.objectContaining({
            presentationId: 'presentation-456',
            slide,
            timestamp: expect.any(String),
          })
        );
      });

      it('should handle different slide layouts', () => {
        const { __mockEmit } = require('socket.io');

        const layouts = ['title_slide', 'content', 'two_column', 'image', 'quote'];

        layouts.forEach((layout) => {
          const slide = {
            order_index: 1,
            title: 'Test Slide',
            content: 'Test content',
            layout,
          };

          emitSlidePreviewUpdate('user-123', 'presentation-456', slide);

          expect(__mockEmit).toHaveBeenCalledWith(
            WEBSOCKET_EVENTS.SLIDE_PREVIEW_UPDATE,
            expect.objectContaining({
              slide: expect.objectContaining({ layout }),
            })
          );
        });
      });
    });
  });

  describe('Phase 2 - Generation Status Events', () => {
    beforeEach(() => {
      mockServer = initializeSocketServer(httpServer);
    });

    describe('emitGenerationStatus', () => {
      it('should emit generation status with all status types', () => {
        const { __mockEmit } = require('socket.io');

        const statuses: ('idle' | 'thinking' | 'generating' | 'completed' | 'error')[] = [
          'idle',
          'thinking',
          'generating',
          'completed',
          'error',
        ];

        statuses.forEach((status) => {
          emitGenerationStatus('user-123', 'presentation-456', status);

          expect(__mockEmit).toHaveBeenCalledWith(
            WEBSOCKET_EVENTS.GENERATION_STATUS,
            expect.objectContaining({
              presentationId: 'presentation-456',
              status,
              timestamp: expect.any(String),
            })
          );
        });
      });

      it('should include optional message when provided', () => {
        const { __mockEmit } = require('socket.io');

        emitGenerationStatus('user-123', 'presentation-456', 'thinking', 'AI is analyzing...');

        expect(__mockEmit).toHaveBeenCalledWith(
          WEBSOCKET_EVENTS.GENERATION_STATUS,
          expect.objectContaining({
            message: 'AI is analyzing...',
          })
        );
      });
    });

    describe('emitGenerationProgress', () => {
      it('should emit generation progress with correct data', () => {
        const { __mockTo, __mockEmit } = require('socket.io');

        emitGenerationProgress('user-123', 'presentation-456', 50, 'Creating slides...');

        expect(__mockTo).toHaveBeenCalledWith('user:user-123');
        expect(__mockEmit).toHaveBeenCalledWith(
          WEBSOCKET_EVENTS.GENERATION_PROGRESS,
          expect.objectContaining({
            presentationId: 'presentation-456',
            progress: 50,
            currentStep: 'Creating slides...',
            timestamp: expect.any(String),
          })
        );
      });

      it('should clamp progress to 0-100 range', () => {
        const { __mockEmit } = require('socket.io');

        // Test below minimum
        emitGenerationProgress('user-123', 'presentation-456', -10);
        expect(__mockEmit).toHaveBeenCalledWith(
          WEBSOCKET_EVENTS.GENERATION_PROGRESS,
          expect.objectContaining({ progress: 0 })
        );

        // Test above maximum
        emitGenerationProgress('user-123', 'presentation-456', 150);
        expect(__mockEmit).toHaveBeenCalledWith(
          WEBSOCKET_EVENTS.GENERATION_PROGRESS,
          expect.objectContaining({ progress: 100 })
        );

        // Test valid range
        emitGenerationProgress('user-123', 'presentation-456', 75);
        expect(__mockEmit).toHaveBeenCalledWith(
          WEBSOCKET_EVENTS.GENERATION_PROGRESS,
          expect.objectContaining({ progress: 75 })
        );
      });

      it('should handle progress without currentStep', () => {
        const { __mockEmit } = require('socket.io');

        emitGenerationProgress('user-123', 'presentation-456', 30);

        expect(__mockEmit).toHaveBeenCalledWith(
          WEBSOCKET_EVENTS.GENERATION_PROGRESS,
          expect.objectContaining({
            progress: 30,
            currentStep: undefined,
          })
        );
      });
    });

    describe('emitGenerationCompleted', () => {
      it('should emit generation completed with slides count', () => {
        const { __mockTo, __mockEmit } = require('socket.io');

        emitGenerationCompleted('user-123', 'presentation-456', 10);

        expect(__mockTo).toHaveBeenCalledWith('user:user-123');
        expect(__mockEmit).toHaveBeenCalledWith(
          WEBSOCKET_EVENTS.GENERATION_COMPLETED,
          expect.objectContaining({
            presentationId: 'presentation-456',
            slidesCount: 10,
            timestamp: expect.any(String),
          })
        );
      });

      it('should handle zero slides', () => {
        const { __mockEmit } = require('socket.io');

        emitGenerationCompleted('user-123', 'presentation-456', 0);

        expect(__mockEmit).toHaveBeenCalledWith(
          WEBSOCKET_EVENTS.GENERATION_COMPLETED,
          expect.objectContaining({ slidesCount: 0 })
        );
      });
    });

    describe('emitGenerationError', () => {
      it('should emit generation error with error message', () => {
        const { __mockTo, __mockEmit } = require('socket.io');

        emitGenerationError('user-123', 'presentation-456', 'API connection failed');

        expect(__mockTo).toHaveBeenCalledWith('user:user-123');
        expect(__mockEmit).toHaveBeenCalledWith(
          WEBSOCKET_EVENTS.GENERATION_ERROR,
          expect.objectContaining({
            presentationId: 'presentation-456',
            error: 'API connection failed',
            timestamp: expect.any(String),
          })
        );
      });

      it('should include optional step when provided', () => {
        const { __mockEmit } = require('socket.io');

        emitGenerationError('user-123', 'presentation-456', 'Parsing failed', 'parsing');

        expect(__mockEmit).toHaveBeenCalledWith(
          WEBSOCKET_EVENTS.GENERATION_ERROR,
          expect.objectContaining({
            error: 'Parsing failed',
            step: 'parsing',
          })
        );
      });
    });
  });

  describe('Legacy Events (Phase 1)', () => {
    beforeEach(() => {
      mockServer = initializeSocketServer(httpServer);
    });

    describe('emitPresentationReady', () => {
      it('should emit presentation ready event', () => {
        const { __mockTo, __mockEmit } = require('socket.io');

        emitPresentationReady('user-123', 'presentation-456');

        expect(__mockTo).toHaveBeenCalledWith('user:user-123');
        expect(__mockEmit).toHaveBeenCalledWith(
          WEBSOCKET_EVENTS.PRESENTATION_READY,
          expect.objectContaining({
            presentation_id: 'presentation-456',
            timestamp: expect.any(String),
          })
        );
      });
    });

    describe('emitPresentationError', () => {
      it('should emit presentation error event', () => {
        const { __mockTo, __mockEmit } = require('socket.io');

        emitPresentationError('user-123', 'presentation-456', 'Generation failed');

        expect(__mockTo).toHaveBeenCalledWith('user:user-123');
        expect(__mockEmit).toHaveBeenCalledWith(
          WEBSOCKET_EVENTS.PRESENTATION_ERROR,
          expect.objectContaining({
            presentation_id: 'presentation-456',
            error: 'Generation failed',
            timestamp: expect.any(String),
          })
        );
      });
    });

    describe('emitSlideUpdated', () => {
      it('should emit slide updated event', () => {
        const { __mockTo, __mockEmit } = require('socket.io');

        emitSlideUpdated('user-123', 'presentation-456', 'slide-789');

        expect(__mockTo).toHaveBeenCalledWith('user:user-123');
        expect(__mockEmit).toHaveBeenCalledWith(
          WEBSOCKET_EVENTS.SLIDE_UPDATED,
          expect.objectContaining({
            presentation_id: 'presentation-456',
            slide_id: 'slide-789',
            timestamp: expect.any(String),
          })
        );
      });
    });
  });
});
