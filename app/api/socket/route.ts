import { NextResponse } from 'next/server';
import { Server as SocketIO } from "socket.io";

const io = new SocketIO({
  path: '/api/socket',
  addTrailingSlash: false,
});

const rooms = new Map<string, Set<string>>();

io.on('connection', (socket) => {
  console.log('A client connected');

  socket.on('join-room', (room: string) => {
    socket.join(room);
    if (!rooms.has(room)) {
      rooms.set(room, new Set());
    }
    rooms.get(room)!.add(socket.id);
    const playerCount = rooms.get(room)!.size;
    io.to(room).emit('room-update', playerCount);
    console.log(`Client joined room: ${room}. Players in room: ${playerCount}`);

    // 新しいプレイヤーに現在のプレイヤー数を送信
    socket.emit('player-number', playerCount === 1 ? 'X' : 'O');
  });

  socket.on('start-game', (room: string) => {
    io.to(room).emit('game-start');
    console.log(`Game started in room: ${room}`);
  });

  socket.on('make-move', ({ room, player, position }: { room: string; player: string; position: number }) => {
    socket.to(room).emit('opponent-move', { player, position });
    console.log(`Move made in room ${room} by ${player} at position ${position}`);
  });

  socket.on('reset-game', (room: string) => {
    io.to(room).emit('game-reset');
    console.log(`Game reset in room: ${room}`);
  });

  socket.on('disconnect', () => {
    for (const [room, players] of rooms.entries()) {
      if (players.has(socket.id)) {
        players.delete(socket.id);
        const playerCount = players.size;
        io.to(room).emit('room-update', playerCount);
        console.log(`Client left room: ${room}. Players in room: ${playerCount}`);
        if (playerCount === 0) {
          rooms.delete(room);
        }
      }
    }
    console.log('A client disconnected');
  });
});

export async function GET(req: Request) {
  return NextResponse.json({ message: "Socket server is running" });
}

export const dynamic = 'force-dynamic';