import { invoke, Channel } from '@tauri-apps/api/core'

export interface OllamaModel {
  name: string
  size: number
}

interface ChatMessage {
  role: string
  content: string
}

type StreamEvent =
  | { event: 'token'; data: { content: string } }
  | { event: 'done'; data: { totalDuration: number } }
  | { event: 'error'; data: { message: string } }

type PullEvent =
  | { event: 'progress'; data: { status: string; completed: number | null; total: number | null } }
  | { event: 'done'; data: Record<string, never> }
  | { event: 'error'; data: { message: string } }

export async function checkOllama(): Promise<boolean> {
  return invoke<boolean>('check_ollama')
}

export async function listModels(): Promise<OllamaModel[]> {
  return invoke<OllamaModel[]>('list_models')
}

export async function getSystemRam(): Promise<number> {
  return invoke<number>('get_system_ram')
}

export async function chat(
  model: string,
  messages: ChatMessage[],
  onToken: (content: string) => void,
  onDone: () => void,
  onError: (message: string) => void,
): Promise<void> {
  const onEvent = new Channel<StreamEvent>()
  onEvent.onmessage = (msg) => {
    if (msg.event === 'token') {
      onToken(msg.data.content)
    } else if (msg.event === 'done') {
      onDone()
    } else if (msg.event === 'error') {
      onError(msg.data.message)
    }
  }

  await invoke('chat', { model, messages, onEvent })
}

export async function pullModel(
  name: string,
  onProgress: (status: string, completed: number | null, total: number | null) => void,
  onDone: () => void,
  onError: (message: string) => void,
): Promise<void> {
  const onEvent = new Channel<PullEvent>()
  onEvent.onmessage = (msg) => {
    if (msg.event === 'progress') {
      onProgress(msg.data.status, msg.data.completed, msg.data.total)
    } else if (msg.event === 'done') {
      onDone()
    } else if (msg.event === 'error') {
      onError(msg.data.message)
    }
  }

  await invoke('pull_model', { name, onEvent })
}

export async function deleteModel(name: string): Promise<void> {
  await invoke('delete_model', { name })
}

export async function waitForOllama(): Promise<boolean> {
  return invoke<boolean>('wait_for_ollama')
}

export interface StorageInfo {
  path: string
  sizeBytes: number
}

export async function getStorageInfo(): Promise<StorageInfo> {
  return invoke<StorageInfo>('get_storage_info')
}

export async function cancelChat(): Promise<void> {
  await invoke('cancel_chat')
}

export async function readFileContent(path: string): Promise<string> {
  return invoke<string>('read_file_content', { path })
}

export interface FolderFile {
  name: string
  path: string
  content: string
}

export async function readFolderFiles(path: string): Promise<FolderFile[]> {
  return invoke<FolderFile[]>('read_folder_files', { path })
}

export async function watchFolder(path: string): Promise<void> {
  await invoke('watch_folder', { path })
}

export async function unwatchFolder(path: string): Promise<void> {
  await invoke('unwatch_folder', { path })
}
