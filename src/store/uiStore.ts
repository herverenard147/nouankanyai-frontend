import { create } from 'zustand'

interface UiState {
  assistantOpen: boolean
  toggleAssistant: () => void
  closeAssistant: () => void
  mobileDrawerOpen: boolean
  toggleMobileDrawer: () => void
  closeMobileDrawer: () => void
}

export const useUiStore = create<UiState>()((set) => ({
  assistantOpen: false,
  toggleAssistant: () => set((state) => ({ assistantOpen: !state.assistantOpen })),
  closeAssistant: () => set({ assistantOpen: false }),
  mobileDrawerOpen: false,
  toggleMobileDrawer: () => set((state) => ({ mobileDrawerOpen: !state.mobileDrawerOpen })),
  closeMobileDrawer: () => set({ mobileDrawerOpen: false }),
}))
