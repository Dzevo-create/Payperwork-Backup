import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SuperChatStore {
  // State
  isSuperChatEnabled: boolean;

  // Actions
  toggleSuperChat: () => void;
  setSuperChat: (enabled: boolean) => void;
}

export const useSuperChatStore = create<SuperChatStore>()(
  persist(
    (set) => ({
      // Initial state
      isSuperChatEnabled: false,

      // Actions
      toggleSuperChat: () => set((state) => ({
        isSuperChatEnabled: !state.isSuperChatEnabled
      })),

      setSuperChat: (enabled) => set({ isSuperChatEnabled: enabled }),
    }),
    {
      name: 'payperwork-superchat-storage',
    }
  )
);
