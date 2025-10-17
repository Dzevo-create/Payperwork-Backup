/**
 * Tests for useMessageActions hook
 * Critical hook that manages message copying and editing functionality
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useMessageActions } from '@/hooks/chat/useMessageActions';

describe('useMessageActions', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Initial state', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useMessageActions());

      expect(result.current.copiedId).toBeNull();
      expect(result.current.editingId).toBeNull();
      expect(result.current.editContent).toBe('');
    });
  });

  describe('handleCopy', () => {
    it('should copy text to clipboard', async () => {
      const { result } = renderHook(() => useMessageActions());

      await act(async () => {
        await result.current.handleCopy('test content', 'msg-1');
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test content');
      expect(result.current.copiedId).toBe('msg-1');
    });

    it('should reset copiedId after 2 seconds', async () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useMessageActions());

      await act(async () => {
        await result.current.handleCopy('test content', 'msg-1');
      });

      expect(result.current.copiedId).toBe('msg-1');

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(result.current.copiedId).toBeNull();
      });

      jest.useRealTimers();
    });
  });

  describe('handleEdit', () => {
    it('should set editing state with message id and content', () => {
      const { result } = renderHook(() => useMessageActions());

      act(() => {
        result.current.handleEdit('msg-1', 'original content');
      });

      expect(result.current.editingId).toBe('msg-1');
      expect(result.current.editContent).toBe('original content');
    });

    it('should allow editing different messages sequentially', () => {
      const { result } = renderHook(() => useMessageActions());

      act(() => {
        result.current.handleEdit('msg-1', 'content 1');
      });

      expect(result.current.editingId).toBe('msg-1');
      expect(result.current.editContent).toBe('content 1');

      act(() => {
        result.current.handleEdit('msg-2', 'content 2');
      });

      expect(result.current.editingId).toBe('msg-2');
      expect(result.current.editContent).toBe('content 2');
    });
  });

  describe('handleSaveEdit', () => {
    it('should call onEditMessage callback when content is valid', () => {
      const mockOnEditMessage = jest.fn();
      const { result } = renderHook(() => useMessageActions(mockOnEditMessage));

      act(() => {
        result.current.handleEdit('msg-1', 'original');
      });

      act(() => {
        result.current.setEditContent('updated content');
      });

      act(() => {
        result.current.handleSaveEdit('msg-1');
      });

      expect(mockOnEditMessage).toHaveBeenCalledWith('msg-1', 'updated content');
      expect(result.current.editingId).toBeNull();
      expect(result.current.editContent).toBe('');
    });

    it('should not save if content is empty', () => {
      const mockOnEditMessage = jest.fn();
      const { result } = renderHook(() => useMessageActions(mockOnEditMessage));

      act(() => {
        result.current.handleEdit('msg-1', 'original');
      });

      act(() => {
        result.current.setEditContent('   '); // whitespace only
      });

      act(() => {
        result.current.handleSaveEdit('msg-1');
      });

      expect(mockOnEditMessage).not.toHaveBeenCalled();
    });

    it('should not save if onEditMessage callback is not provided', () => {
      const { result } = renderHook(() => useMessageActions());

      act(() => {
        result.current.handleEdit('msg-1', 'original');
      });

      act(() => {
        result.current.setEditContent('updated content');
      });

      act(() => {
        result.current.handleSaveEdit('msg-1');
      });

      // Should not throw error, but editing state should not be cleared
      expect(result.current.editingId).toBe('msg-1');
    });
  });

  describe('handleCancelEdit', () => {
    it('should reset editing state', () => {
      const { result } = renderHook(() => useMessageActions());

      act(() => {
        result.current.handleEdit('msg-1', 'original content');
      });

      expect(result.current.editingId).toBe('msg-1');
      expect(result.current.editContent).toBe('original content');

      act(() => {
        result.current.handleCancelEdit();
      });

      expect(result.current.editingId).toBeNull();
      expect(result.current.editContent).toBe('');
    });
  });

  describe('setEditContent', () => {
    it('should update edit content', () => {
      const { result } = renderHook(() => useMessageActions());

      act(() => {
        result.current.handleEdit('msg-1', 'original');
      });

      act(() => {
        result.current.setEditContent('updated');
      });

      expect(result.current.editContent).toBe('updated');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete edit workflow', () => {
      const mockOnEditMessage = jest.fn();
      const { result } = renderHook(() => useMessageActions(mockOnEditMessage));

      // Start editing
      act(() => {
        result.current.handleEdit('msg-1', 'original content');
      });

      expect(result.current.editingId).toBe('msg-1');
      expect(result.current.editContent).toBe('original content');

      // Update content
      act(() => {
        result.current.setEditContent('updated content');
      });

      expect(result.current.editContent).toBe('updated content');

      // Save changes
      act(() => {
        result.current.handleSaveEdit('msg-1');
      });

      expect(mockOnEditMessage).toHaveBeenCalledWith('msg-1', 'updated content');
      expect(result.current.editingId).toBeNull();
      expect(result.current.editContent).toBe('');
    });

    it('should handle edit cancellation workflow', () => {
      const mockOnEditMessage = jest.fn();
      const { result } = renderHook(() => useMessageActions(mockOnEditMessage));

      // Start editing
      act(() => {
        result.current.handleEdit('msg-1', 'original content');
      });

      // Update content
      act(() => {
        result.current.setEditContent('updated content');
      });

      // Cancel editing
      act(() => {
        result.current.handleCancelEdit();
      });

      expect(mockOnEditMessage).not.toHaveBeenCalled();
      expect(result.current.editingId).toBeNull();
      expect(result.current.editContent).toBe('');
    });
  });
});
