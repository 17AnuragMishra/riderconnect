import { Session } from 'next-auth'

export interface SocketConfig {
  session: Session
}

export interface SocketEvents {
  connect: () => void
  disconnect: (reason: string) => void
}