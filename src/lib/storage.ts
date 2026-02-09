import { invoke } from '@tauri-apps/api/core'
import type { StateStorage } from 'zustand/middleware'

export const tauriStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const data = await invoke<string | null>('load_store', { key: name })
      return data ?? null
    } catch {
      return null
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await invoke('save_store', { key: name, value })
    } catch (e) {
      console.error('Failed to save store:', e)
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await invoke('save_store', { key: name, value: '{}' })
    } catch (e) {
      console.error('Failed to remove store:', e)
    }
  },
}
