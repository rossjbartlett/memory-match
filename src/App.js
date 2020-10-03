import React, { useState, useEffect } from 'react'
import './App.css'

// 22 colors
const ALL_COLORS = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080', '#ffffff', '#000000']

function Card (props) {
  const [hover, setHover] = useState(false)
  const { flipped, color } = props.card
  const classNames = [
    'card',
    flipped ? 'flipped' : '',
    props.card.newMatch ? 'newMatch' : '',
    props.card.matched ? 'matched' : ''
  ]
  const style = flipped ? { backgroundColor: color } : {}
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

function createCards (numRows, numCols) {
  const numColors = numRows * numCols / 2
  const cards = new Array(numRows).fill().map(() => new Array(numCols).fill()) // make matrix
  const colorVals = [...ALL_COLORS]
  // assign a color to each card
  for (let i = 0; i < numColors; i++) {
    const color = popColor(colorVals)
    let numSet = 0
    while (numSet < 2) { // set each color to two random cards
      const randRow = Math.floor(Math.random() * numRows)
      const randCol = Math.floor(Math.random() * numCols)
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

function App ({ numRows = 3, numCols = 4 }) {
  const [cards, updateCards] = useState([[]])
  const [disableClicks, setDisableClicks] = useState(false)
  const [gameOver, setGameOver] = useState(false)

  useEffect(() => { // executes once unless numRows/numCols change
    updateCards(createCards(numRows, numCols))
  }, [numRows, numCols])

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

  return (
    <div className={`app ${gameOver ? 'gameOver' : ''}`}>
      {cards.map((row, i) => (
        <div className='row' key={i}>
          {row.map((card, j) => (
            <Card
              key={'' + i + j}
              card={card}
              gameOver={gameOver}
              flipCard={flipCard.bind(null, card)}
              disableClicks={disableClicks}
            />)
          )}
        </div>
      ))}
    </div>
  )
}

// TODO make reset funciton
// TODO make size selector
// TODO download img

export default App
