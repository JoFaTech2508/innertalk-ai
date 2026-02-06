import { create } from 'zustand'

export type Tab = 'chat' | 'files' | 'settings'

interface AppState {
  activeTab: Tab
  selectedModel: string
  availableModels: string[]
  sidebarCollapsed: boolean
  setActiveTab: (tab: Tab) => void
  setSelectedModel: (model: string) => void
  setAvailableModels: (models: string[]) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'chat',
  selectedModel: 'llama3.2',
  availableModels: ['llama3.2', 'mistral', 'codellama', 'phi3'],
  sidebarCollapsed: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setAvailableModels: (models) => set({ availableModels: models }),
  toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}))
