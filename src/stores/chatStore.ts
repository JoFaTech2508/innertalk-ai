import { create } from 'zustand'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface Chat {
  id: string
  title: string
  messages: Message[]
  model: string
  createdAt: number
  updatedAt: number
}

interface ChatState {
  chats: Chat[]
  activeChatId: string | null
  activeChat: Chat | null
  createChat: (model: string) => string
  deleteChat: (id: string) => void
  setActiveChat: (id: string) => void
  addMessage: (chatId: string, role: 'user' | 'assistant', content: string) => void
  updateLastMessage: (chatId: string, content: string) => void
}

const generateId = () => Math.random().toString(36).substring(2, 15)

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChatId: null,
  get activeChat() {
    const state = get()
    return state.chats.find(c => c.id === state.activeChatId) ?? null
  },

  createChat: (model: string) => {
    const id = generateId()
    const chat: Chat = {
      id,
      title: 'New Chat',
      messages: [],
      model,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    set(state => ({
      chats: [chat, ...state.chats],
      activeChatId: id,
    }))
    return id
  },

  deleteChat: (id: string) => {
    set(state => {
      const newChats = state.chats.filter(c => c.id !== id)
      const newActiveId = state.activeChatId === id
        ? (newChats[0]?.id ?? null)
        : state.activeChatId
      return { chats: newChats, activeChatId: newActiveId }
    })
  },

  setActiveChat: (id: string) => {
    set({ activeChatId: id })
  },

  addMessage: (chatId: string, role: 'user' | 'assistant', content: string) => {
    set(state => ({
      chats: state.chats.map(chat =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, {
                id: generateId(),
                role,
                content,
                timestamp: Date.now(),
              }],
              title: chat.messages.length === 0 && role === 'user'
                ? content.slice(0, 40) + (content.length > 40 ? '...' : '')
                : chat.title,
              updatedAt: Date.now(),
            }
          : chat
      ),
    }))
  },

  updateLastMessage: (chatId: string, content: string) => {
    set(state => ({
      chats: state.chats.map(chat =>
        chat.id === chatId
          ? {
              ...chat,
              messages: chat.messages.map((msg, i) =>
                i === chat.messages.length - 1 ? { ...msg, content } : msg
              ),
              updatedAt: Date.now(),
            }
          : chat
      ),
    }))
  },
}))
