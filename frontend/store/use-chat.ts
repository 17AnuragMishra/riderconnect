import { Message } from '@/types/message'
import { create } from 'zustand'

export interface ChatState {
  reply?: Message
  setReply: (value?: Message) => void
}

const useChatState = create<ChatState>((set) => ({
  reply: undefined,
  setReply: (value?: Message) => set((state) => ({ reply: value })),
}))

export default useChatState
