/**
 * Tool Slice
 *
 * Manages tool history and computer panel state.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @refactored 2025-10-20 - Added panel type support for modular panels
 */

import { StateCreator } from 'zustand';
import { ToolAction } from '@/types/slides';
import { slidesLogger } from '@/lib/logger';

// ============================================
// Panel Types
// ============================================

export type PanelType = 'slides' | 'tools' | 'thinking' | null;

// ============================================
// Tool Slice State
// ============================================

export interface ToolSlice {
  // State
  toolHistory: ToolAction[];
  showComputerPanel: boolean;
  currentPanelType: PanelType; // NEW: Determines which panel to show

  // Actions
  addToolAction: (action: ToolAction) => void;
  updateToolAction: (id: string, updates: Partial<ToolAction>) => void;
  clearToolHistory: () => void;
  setShowComputerPanel: (show: boolean) => void;
  toggleComputerPanel: () => void;
  setPanelType: (type: PanelType) => void; // NEW: Set panel type
}

// ============================================
// Tool Slice Creator
// ============================================

export const createToolSlice: StateCreator<ToolSlice, [], [], ToolSlice> = (
  set
) => ({
  // Initial State
  toolHistory: [],
  showComputerPanel: false,
  currentPanelType: null, // NEW: Default to no panel

  // Actions
  addToolAction: (action) => {
    slidesLogger.debug('Adding tool action', {
      action: 'addToolAction',
      toolId: action.id,
      toolType: action.type,
      status: action.status,
    });
    set((state) => {
      // Check if tool already exists (for updates)
      const existingIndex = state.toolHistory.findIndex((t) => t.id === action.id);
      if (existingIndex !== -1) {
        // Update existing
        const newHistory = [...state.toolHistory];
        newHistory[existingIndex] = action;
        return { toolHistory: newHistory };
      } else {
        // Add new
        return { toolHistory: [...state.toolHistory, action] };
      }
    });
  },

  updateToolAction: (id, updates) => {
    slidesLogger.debug('Updating tool action', {
      action: 'updateToolAction',
      toolId: id,
      updates: Object.keys(updates),
    });
    set((state) => ({
      toolHistory: state.toolHistory.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  },

  clearToolHistory: () => {
    slidesLogger.debug('Clearing tool history', {
      action: 'clearToolHistory',
    });
    set({ toolHistory: [] });
  },

  setShowComputerPanel: (show) => {
    slidesLogger.debug('Setting show computer panel', {
      action: 'setShowComputerPanel',
      show,
    });
    set({ showComputerPanel: show });
  },

  toggleComputerPanel: () => {
    set((state) => {
      const newValue = !state.showComputerPanel;
      slidesLogger.debug('Toggling computer panel', {
        action: 'toggleComputerPanel',
        newValue,
      });
      return { showComputerPanel: newValue };
    });
  },

  setPanelType: (type) => {
    slidesLogger.debug('Setting panel type', {
      action: 'setPanelType',
      type,
    });
    set({ currentPanelType: type });
  },
});
