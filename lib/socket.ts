// This is a mock implementation of a socket.io client
// In a real application, you would use the actual socket.io-client library

class MockSocket {
  private callbacks: Record<string, Function[]> = {}
  private connected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 2000
  private reconnectTimer: NodeJS.Timeout | null = null

  constructor(private url: string) {
    this.connect()
  }

  connect() {
    // Simulate connection delay
    setTimeout(() => {
      this.connected = true
      this.emit("connect")
      console.log(`Connected to ${this.url}`)
    }, 500)
  }

  disconnect() {
    if (this.connected) {
      this.connected = false
      this.emit("disconnect")
      console.log("Disconnected from server")

      // Attempt to reconnect
      this.reconnect()
    }
  }

  private reconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)

      this.reconnectTimer = setTimeout(() => {
        this.connect()
      }, this.reconnectInterval)
    } else {
      console.log("Max reconnect attempts reached. Please try again later.")
      this.emit("reconnect_failed")
    }
  }

  on(event: string, callback: Function) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = []
    }
    this.callbacks[event].push(callback)
    return this
  }

  off(event: string, callback?: Function) {
    if (!callback) {
      delete this.callbacks[event]
    } else if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter((cb) => cb !== callback)
    }
    return this
  }

  emit(event: string, ...args: any[]) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach((callback) => {
        callback(...args)
      })
    }
    return this
  }

  // Mock methods to simulate sending data to server
  sendLocation(location: { lat: number; lng: number }) {
    if (!this.connected) {
      console.warn("Cannot send location: not connected")
      return
    }

    console.log("Sending location:", location)
    // In a real app, this would send the location to the server
    // socket.emit('update_location', location);

    // Simulate receiving acknowledgment
    setTimeout(() => {
      this.emit("location_updated", { success: true })
    }, 200)
  }

  sendMessage(message: { content: string; groupId: string }) {
    if (!this.connected) {
      console.warn("Cannot send message: not connected")
      return
    }

    console.log("Sending message:", message)
    // In a real app, this would send the message to the server
    // socket.emit('send_message', message);

    // Simulate receiving the message back from the server
    setTimeout(() => {
      this.emit("new_message", {
        id: Math.random().toString(36).substring(2, 9),
        sender: "1", // Current user
        content: message.content,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        groupId: message.groupId,
      })
    }, 300)
  }

  // Simulate network issues
  simulateNetworkIssue() {
    this.disconnect()
  }
}

// Create a singleton instance
let socketInstance: MockSocket | null = null

export function getSocket(url = "wss://api.grouptrack.app") {
  if (!socketInstance) {
    socketInstance = new MockSocket(url)
  }
  return socketInstance
}

export function closeSocket() {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }
}

