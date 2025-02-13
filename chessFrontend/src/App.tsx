import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import ChessBoard from './components/ChessBoard'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <div className="app">
      <h1>Chess Game</h1>
      <ChessBoard />
    </div>
    </>
  )
}

export default App
