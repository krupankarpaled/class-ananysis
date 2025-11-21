import { io, Socket } from 'socket.io-client'

const url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000/live'

export function createLiveSocket(): Socket {
  const s = io(url, {
    transports: ['websocket'],
  })
  return s
}