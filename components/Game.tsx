'use client'

import React, { useState, useEffect } from 'react'
import io, { Socket } from 'socket.io-client'
import { Player, Board } from '../types'

let socket: Socket

export default function Game() {
  const [room, setRoom] = useState('')
  const [playerNumber, setPlayerNumber] = useState<Player>(null)
  const [board, setBoard] = useState<Board>(Array(9).fill(null))
  const [moves, setMoves] = useState<number[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X')
  const [winner, setWinner] = useState<Player>(null)
  const [playersInRoom, setPlayersInRoom] = useState<number>(0)
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    socketInitializer()
  }, [])

  const socketInitializer = async () => {
    await fetch('/api/socket')
    socket = io({
      path: '/api/socket',
    })

    socket.on('connect', () => {
      console.log('Connected to server')
    })

    socket.on('room-update', (count: number) => {
      console.log('Room update:', count)
      setPlayersInRoom(count)
    })

    socket.on('player-number', (player: Player) => {
      console.log('Assigned player number:', player)
      setPlayerNumber(player)
    })

    socket.on('game-start', () => {
      setGameStarted(true)
    })

    socket.on('opponent-move', ({ player, position }: { player: Player; position: number }) => {
      makeMove(position, player)
    })
  }

  const joinRoom = () => {
    if (room !== '') {
      socket.emit('join-room', room)
    }
  }

  const startGame = () => {
    socket.emit('start-game', room)
    setGameStarted(true)
  }

  const makeMove = (position: number, player: Player) => {
    if (board[position] === null && !winner && gameStarted && player === currentPlayer) {
      const newBoard = [...board]
      newBoard[position] = player
      setBoard(newBoard)

      const newMoves = [...moves, position]
      if (newMoves.length > 3) {
        const oldestMove = newMoves.shift()
        if (oldestMove !== undefined) {
          newBoard[oldestMove] = null
        }
      }
      setMoves(newMoves)

      const gameWinner = checkWinner(newBoard)
      if (gameWinner) {
        setWinner(gameWinner)
      } else {
        setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X')
      }

      if (playerNumber === player) {
        socket.emit('make-move', { room, player, position })
      }
    }
  }

  const checkWinner = (board: Board): Player => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ]
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i]
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a]
      }
    }
    return null
  }

  const resetGame = () => {
    setBoard(Array(9).fill(null))
    setMoves([])
    setCurrentPlayer('X')
    setWinner(null)
    setGameStarted(false)
    socket.emit('reset-game', room)
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">マルバツゲーム (3つまで)</h1>
        
        {!playerNumber ? (
          <div className="space-y-4">
            <input 
              type="text" 
              value={room} 
              onChange={(e) => setRoom(e.target.value)} 
              placeholder="ルーム名を入力"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <button 
              onClick={joinRoom}
              className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition duration-300"
            >
              ルームに参加
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">ルーム: {room}</h2>
            <h3 className="text-lg font-medium text-gray-600">あなたの記号: {playerNumber}</h3>
            <h3 className="text-lg font-medium text-gray-600">プレイヤー数: {playersInRoom}/2</h3>
            {/* 残りのUIコードは変更なし */}
          </div>
        )}
      </div>
    </div>
  )
}