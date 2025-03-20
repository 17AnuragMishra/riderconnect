import { BasicUserInfo } from './user'

export interface Message {
  _id?: string
  text: string
  user: BasicUserInfo
  createdAt: string
  replyTo?: Message
  isSender?: boolean
}
