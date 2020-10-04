import React, { useState, useEffect } from 'react'
import './App.css'

// 22 colors
const ALL_COLORS = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080', '#ffffff', '#000000']
const SIZE_OPTIONS = [[3, 4], [3, 6], [4, 6], [4, 8]]
function Card (props) {
  const [hover, setHover] = useState(false)
  const { flipped, color } = props.card
  const classNames = [
    'card',
    flipped ? 'flipped' : '',
    props.card.newMatch ? 'newMatch' : '',
    props.card.matched ? 'matched' : ''
  ]
  const style = { width: props.cardSize, height: props.cardSize }
  if (flipped) style.backgroundColor = color
  if (hover && !props.gameOver && !props.newMatch) {
    style.boxShadow = '0 0 10px lightgrey' // hover style
  }

  return (
    <div
      className={classNames.join(' ')}
      style={style}
      onClick={props.disableClicks ? null : props.flipCard}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    />
  )
}

function popColor (colorVals) {
  // take a rand color and remove it from the original list
  const i = Math.floor(Math.random() * colorVals.length)
  const removedColor = colorVals.splice(i, 1)[0]
  return removedColor
}

function createCards (size) {
  const numColors = size[0] * size[1] / 2
  const cards = new Array(size[0]).fill().map(() => new Array(size[1]).fill()) // make matrix
  const colorVals = [...ALL_COLORS]
  // assign a color to each card
  for (let i = 0; i < numColors; i++) {
    const color = popColor(colorVals)
    let numSet = 0
    while (numSet < 2) { // set each color to two random cards
      const randRow = Math.floor(Math.random() * size[0])
      const randCol = Math.floor(Math.random() * size[1])
      if (!cards[randRow][randCol]) {
        cards[randRow][randCol] = { color }
        numSet++
      }
    }
  }
  return cards
}

function countFlippedUnmatched (cards) {
  return cards.flat().filter(x => x.flipped && !x.matched).length
}

function getMatchingCards (cards, card) {
  // return [arg card, other card with same color]
  return cards.flat().filter(x => x.color === card.color)
}

function checkMatch (matchingCards) {
  return matchingCards.every(x => x.flipped)
}

function makeMatch (matchingCards) {
  matchingCards.forEach(x => {
    x.matched = true
    x.flipped = true
  })
}

async function unflipUnmatchedCards (cards, updateCards, setDisableClicks) {
  setDisableClicks(true) // disable clicks during the unflipping
  await new Promise(resolve => setTimeout(resolve, 850)) // wait in ms, pause so user sees color
  cards.flat().filter(x => !x.matched).forEach(x => { x.flipped = false })
  updateCards([...cards])
  setDisableClicks(false)
}

async function flashNewMatch (matchingCards, cards, updateCards) {
  // flash a white shadow on the matching cards
  matchingCards.forEach(x => { x.newMatch = true })
  updateCards([...cards])
  await new Promise(resolve => setTimeout(resolve, 900)) // wait in ms, remove the shadow
  matchingCards.forEach(x => { x.newMatch = false })
  updateCards([...cards])
}

function checkWin (cards) {
  return cards.flat().every(x => x.matched)
}

function ResetButton ({ resetFunc, gameInProgressFunc }) {
  function onClick () {
    if (gameInProgressFunc() && window.confirm('Are you sure you would like to reset the game?')) {
      resetFunc()
    }
  }
  return <div className='btn' onClick={onClick}>reset</div>
}

function SizeSelector ({ selectFunc, currentSize, gameInProgressFunc }) {
  function onClick (size) {
    if (!gameInProgressFunc() || window.confirm('Are you sure you would like to change the board size?\nThis will reset the game.')) {
      selectFunc(size)
    }
  }
  return (
    <div className='sizeSelector'>
      {SIZE_OPTIONS.map((size) => (
        <div className={`btn ${size.every((x, i) => x === currentSize[i]) ? 'active' : ''}`}
          key={size}
          onClick={() => onClick(size)}>{size.join('x')}
        </div>
      ))}
    </div>
  )
}

function App () {
  const [size, setSize] = useState([3, 4])
  const [cards, updateCards] = useState([[]])
  const [disableClicks, setDisableClicks] = useState(false)
  const [gameOver, setGameOver] = useState(false)

  useEffect(() => { // executes once unless size changes
    updateCards(createCards(size))
  }, [size])

  async function flipCard (card) {
    if (card.matched || gameOver) return
    card.flipped = !card.flipped
    updateCards([...cards])
    if (!card.flipped) return // unflipped a single card
    const flipCount = countFlippedUnmatched(cards)
    const matchingCards = getMatchingCards(cards, card)
    if (flipCount < 2) return
    if (checkMatch(matchingCards)) {
      makeMatch(matchingCards)
      updateCards([...cards])
      if (checkWin(cards)) {
        setGameOver(true)
      } else {
        flashNewMatch(matchingCards, cards, updateCards)
      }
    } else {
      unflipUnmatchedCards(cards, updateCards, setDisableClicks)
    }
  }

  function gameInProgress () {
    return cards.flat().some(x => x.flipped)
  }

  let cardSize = size[0] > 3 ? '15vh' : '20vh'
  if (window.innerWidth <= 800) {
    cardSize = 80 / size[1] + 'vw'
    console.log('small cardSize to', cardSize)
  } else {
    console.log('big cardSize to', cardSize)
  }

  return (
    <div className='app'>
      <SizeSelector currentSize={size} selectFunc={newSize => setSize(newSize)} gameInProgressFunc={gameInProgress}/>
      <div className={`game ${gameOver ? 'gameOver' : ''}`}>
        {cards.map((row, i) => (
          <div className='row' key={i}>
            {row.map((card, j) => (
              <Card
                key={'' + i + j}
                card={card}
                gameOver={gameOver}
                flipCard={flipCard.bind(null, card)}
                disableClicks={disableClicks}
                cardSize={cardSize}
              />)
            )}
          </div>
        ))}
      </div>
      <ResetButton gameInProgressFunc={gameInProgress} resetFunc={() => updateCards(createCards(size)) }/>
    </div>
  )
}

// TODO mobile sizing - need to use vw instead of vh for cardSizing

export default App
