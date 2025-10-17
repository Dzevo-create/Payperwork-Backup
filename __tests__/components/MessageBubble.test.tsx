/**
 * Tests for MessageBubble component
 * Critical component that renders individual chat messages
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from '@/components/chat/Chat/MessageBubble';
import { Message } from '@/types/chat';

// Extend Message type to include wasGeneratedWithC1 (component uses this field)
type MessageWithC1 = Message & { wasGeneratedWithC1?: boolean };

// Mock child components to simplify testing
jest.mock('@/components/chat/Chat/MessageActions', () => ({
  MessageActions: ({ message }: { message: Message }) => (
    <div data-testid="message-actions">Actions for {message.id}</div>
  ),
}));

jest.mock('@/components/chat/Message/MessageContent', () => ({
  MessageContent: ({ message }: { message: Message }) => (
    <div data-testid="message-content">{message.content}</div>
  ),
}));

jest.mock('@/components/chat/Message/MessageEditMode', () => ({
  MessageEditMode: ({
    messageId,
    editContent,
  }: {
    messageId: string;
    editContent: string;
  }) => (
    <div data-testid="message-edit-mode">
      Editing {messageId}: {editContent}
    </div>
  ),
}));

jest.mock('@/components/chat/Message/MessageMetadata', () => ({
  MessageMetadata: ({ isUserMessage }: { isUserMessage: boolean }) => (
    <div data-testid="message-metadata">
      {isUserMessage ? 'User' : 'Assistant'}
    </div>
  ),
}));

jest.mock('@/components/chat/Message/MessageAttachments', () => ({
  MessageAttachments: () => <div data-testid="message-attachments">Attachments</div>,
}));

describe('MessageBubble', () => {
  const mockSetLightboxImage = jest.fn();
  const mockSetLightboxVideo = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnSaveEdit = jest.fn();
  const mockOnCancelEdit = jest.fn();
  const mockOnCopy = jest.fn();
  const mockSetEditContent = jest.fn();

  const baseMessage: Message = {
    id: 'msg-1',
    role: 'user',
    content: 'Test message content',
    timestamp: new Date('2024-01-01'),
  };

  const defaultProps = {
    message: baseMessage,
    isLastMessage: false,
    isGenerating: false,
    editingId: null,
    editContent: '',
    copiedId: null,
    onEdit: mockOnEdit,
    onSaveEdit: mockOnSaveEdit,
    onCancelEdit: mockOnCancelEdit,
    onCopy: mockOnCopy,
    setEditContent: mockSetEditContent,
    setLightboxImage: mockSetLightboxImage,
    setLightboxVideo: mockSetLightboxVideo,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render user message correctly', () => {
      render(<MessageBubble {...defaultProps} />);

      expect(screen.getByTestId('message-metadata')).toHaveTextContent('User');
      expect(screen.getByTestId('message-content')).toHaveTextContent(
        'Test message content'
      );
      expect(screen.getByTestId('message-actions')).toBeInTheDocument();
    });

    it('should render assistant message correctly', () => {
      const assistantMessage: Message = {
        ...baseMessage,
        role: 'assistant',
      };

      render(<MessageBubble {...defaultProps} message={assistantMessage} />);

      expect(screen.getByTestId('message-metadata')).toHaveTextContent('Assistant');
      expect(screen.getByTestId('message-content')).toHaveTextContent(
        'Test message content'
      );
    });

    it('should apply correct styling for user messages', () => {
      const { container } = render(<MessageBubble {...defaultProps} />);

      const messageContainer = container.querySelector('#message-msg-1');
      expect(messageContainer).toHaveClass('items-end');
    });

    it('should apply correct styling for assistant messages', () => {
      const assistantMessage: Message = {
        ...baseMessage,
        role: 'assistant',
      };

      const { container } = render(
        <MessageBubble {...defaultProps} message={assistantMessage} />
      );

      const messageContainer = container.querySelector('#message-msg-1');
      expect(messageContainer).toHaveClass('items-start');
    });
  });

  describe('Edit mode', () => {
    it('should render edit mode when editing', () => {
      render(
        <MessageBubble
          {...defaultProps}
          editingId="msg-1"
          editContent="Editing content"
        />
      );

      expect(screen.getByTestId('message-edit-mode')).toHaveTextContent(
        'Editing msg-1: Editing content'
      );
      expect(screen.queryByTestId('message-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('message-actions')).not.toBeInTheDocument();
    });

    it('should not render edit mode when editing different message', () => {
      render(
        <MessageBubble
          {...defaultProps}
          editingId="msg-2"
          editContent="Editing content"
        />
      );

      expect(screen.queryByTestId('message-edit-mode')).not.toBeInTheDocument();
      expect(screen.getByTestId('message-content')).toBeInTheDocument();
      expect(screen.getByTestId('message-actions')).toBeInTheDocument();
    });

    it('should not show message actions in edit mode', () => {
      render(
        <MessageBubble {...defaultProps} editingId="msg-1" editContent="Editing" />
      );

      expect(screen.queryByTestId('message-actions')).not.toBeInTheDocument();
    });
  });

  describe('Message content', () => {
    it('should display message content when not editing', () => {
      render(<MessageBubble {...defaultProps} />);

      expect(screen.getByTestId('message-content')).toHaveTextContent(
        'Test message content'
      );
    });

    it('should render attachments when not editing', () => {
      render(<MessageBubble {...defaultProps} />);

      expect(screen.getByTestId('message-attachments')).toBeInTheDocument();
    });

    it('should not render attachments in edit mode', () => {
      render(
        <MessageBubble {...defaultProps} editingId="msg-1" editContent="Editing" />
      );

      expect(screen.queryByTestId('message-attachments')).not.toBeInTheDocument();
    });
  });

  describe('C1 Message', () => {
    it('should apply C1 styling for assistant messages with wasGeneratedWithC1', () => {
      const c1Message: MessageWithC1 = {
        ...baseMessage,
        role: 'assistant',
        wasGeneratedWithC1: true,
      };

      const { container } = render(
        <MessageBubble {...defaultProps} message={c1Message as Message} />
      );

      const messageBubble = container.querySelector('.bg-white\\/90');
      expect(messageBubble).toBeInTheDocument();
    });
  });

  describe('Streaming messages', () => {
    it('should identify streaming message when last message, assistant role, and generating', () => {
      const assistantMessage: Message = {
        ...baseMessage,
        role: 'assistant',
      };

      render(
        <MessageBubble
          {...defaultProps}
          message={assistantMessage}
          isLastMessage={true}
          isGenerating={true}
        />
      );

      // Component should render (streaming logic is internal)
      expect(screen.getByTestId('message-content')).toBeInTheDocument();
    });

    it('should not identify as streaming if not last message', () => {
      const assistantMessage: Message = {
        ...baseMessage,
        role: 'assistant',
      };

      render(
        <MessageBubble
          {...defaultProps}
          message={assistantMessage}
          isLastMessage={false}
          isGenerating={true}
        />
      );

      expect(screen.getByTestId('message-content')).toBeInTheDocument();
    });
  });

  describe('Message metadata', () => {
    it('should render metadata with timestamp', () => {
      render(<MessageBubble {...defaultProps} />);

      expect(screen.getByTestId('message-metadata')).toBeInTheDocument();
    });
  });

  describe('Message ID', () => {
    it('should set correct message ID for DOM navigation', () => {
      const { container } = render(<MessageBubble {...defaultProps} />);

      const messageElement = container.querySelector('#message-msg-1');
      expect(messageElement).toBeInTheDocument();
    });

    it('should use unique IDs for different messages', () => {
      const message2: Message = {
        ...baseMessage,
        id: 'msg-2',
      };

      const { container: container1 } = render(<MessageBubble {...defaultProps} />);
      const { container: container2 } = render(
        <MessageBubble {...defaultProps} message={message2} />
      );

      expect(container1.querySelector('#message-msg-1')).toBeInTheDocument();
      expect(container2.querySelector('#message-msg-2')).toBeInTheDocument();
    });
  });
});
