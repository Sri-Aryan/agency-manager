import { WebSocket } from 'ws';

export type WsMessage = {
  type: 'task_update' | 'notification' | 'presence_update';
  payload: any;
};

class WsService {
  // Map of userId -> Set of WebSockets (user can have multiple tabs open)
  private clients = new Map<string, Set<WebSocket>>();
  // Map of roomId -> Set of WebSockets
  private rooms = new Map<string, Set<WebSocket>>();

  public addClient(userId: string, socket: WebSocket) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(socket);

    socket.on('close', () => {
      this.removeClient(userId, socket);
    });
  }

  public removeClient(userId: string, socket: WebSocket) {
    const userSockets = this.clients.get(userId);
    if (userSockets) {
      userSockets.delete(socket);
      if (userSockets.size === 0) {
        this.clients.delete(userId);
      }
    }
    
    // Also remove from all rooms (brute force cleanup for simplicity, in prod we'd map socket->rooms)
    for (const [roomId, roomSockets] of this.rooms.entries()) {
      roomSockets.delete(socket);
      if (roomSockets.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  public joinRoom(roomId: string, socket: WebSocket) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(socket);
  }

  public leaveRoom(roomId: string, socket: WebSocket) {
    const roomSockets = this.rooms.get(roomId);
    if (roomSockets) {
      roomSockets.delete(socket);
      if (roomSockets.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  public broadcastToRoom(roomId: string, message: WsMessage) {
    const roomSockets = this.rooms.get(roomId);
    if (roomSockets) {
      const msgString = JSON.stringify(message);
      for (const socket of roomSockets) {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(msgString);
        }
      }
    }
  }

  public sendToUser(userId: string, message: WsMessage) {
    const userSockets = this.clients.get(userId);
    if (userSockets) {
      const msgString = JSON.stringify(message);
      for (const socket of userSockets) {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(msgString);
        }
      }
    }
  }

  public getOnlineUsersCount(): number {
    return this.clients.size;
  }
}

export const wsService = new WsService();
