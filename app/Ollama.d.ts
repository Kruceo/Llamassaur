type OllamaRoles = "user" | "assistant" | "system"

interface OllamaHistoryItem {
  role: OllamaRoles,
  images?: string[],
  __extra?: { rawImages?: string[] }
  content: string,
  errored: boolean
}

interface OllamaChatResponseChunk {
  error?: string
  model: string,
  message: OllamaHistoryItem,
  done: boolean,
  created_at: string
}
interface OllamaPullResponseChunk {
  status: string,
  digest?: string,
  total?: number,
  completed?: number
}