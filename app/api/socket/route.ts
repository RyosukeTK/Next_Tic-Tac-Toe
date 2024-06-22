import { NextResponse } from 'next/server';
import { Server as SocketIO } from "socket.io";

const io = new SocketIO({
  path: '/api/socket',
  addTrailingSlash: false,
});

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('A client connected');

  socket.on('join-room', (room: string) => {
    socket.join(room);
    if (!rooms.has(room)) {
      rooms.set(room, new Set());
    }
    rooms.get(room).add(socket.id);
    io.to(room).emit('room-update', rooms.get(room).size);
    console.log(`Client joined room: ${room}`);
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
    Array.from(rooms.entries()).forEach(([room, players]) => {
      if (players.has(socket.id)) {
        players.delete(socket.id);
        io.to(room).emit('room-update', players.size);
        if (players.size === 0) {
          rooms.delete(room);
        }
      }
    });
    console.log('A client disconnected');
  });
});

export async function GET(req: Request) {
  return NextResponse.json({ message: "Socket server is running" });
}

export const dynamic = 'force-dynamic';