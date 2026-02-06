import { create } from 'zustand'

export type Tab = 'chat' | 'files' | 'settings'
export type SidebarTab = 'chats' | 'files'

interface AppState {
  activeTab: Tab
  sidebarTab: SidebarTab
  selectedModel: string
  availableModels: string[]
  sidebarCollapsed: boolean
  setActiveTab: (tab: Tab) => void
  setSidebarTab: (tab: SidebarTab) => void
  setSelectedModel: (model: string) => void
  setAvailableModels: (models: string[]) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'chat',
  sidebarTab: 'chats',
  selectedModel: 'llama3.2',
  availableModels: ['llama3.2', 'mistral', 'codellama', 'phi3'],
  sidebarCollapsed: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setAvailableModels: (models) => set({ availableModels: models }),
  toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}))
