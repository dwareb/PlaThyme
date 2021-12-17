import React, { useState, useEffect, useRef} from "react";
import { BrowserRouter as Router, Switch, Route, Link, useHistory} from "react-router-dom";
import { Dialog, Transition } from "@headlessui/react";
import io from "socket.io-client";

// import Carousel from './components/Carousel';
// import SelectGame from './components/SelectGame';
import GameRoom from './components/GameRoom';
// import logo from './images/plathyme.png';
import LandingPage from './components/LandingPage';
import Login from "./components/Login";

import EnigmaBreaker from './Games/EnigmaBreaker/EnigmaBreaker';
// import DrawTheWord from './Games/DrawTheWord/DrawTheWord';
// import UKnowIt from './Games/UKnowIt/UKnowIt';

import './App.css';

const SERVER = "http://localhost:3001";
let socket = io(SERVER)

export default function App() {
  // Enter the new game in this Dictionary.
  const [listofGames, setListofGames] = useState([
    { gameId: 1, gameName: "Enigma Breaker", minPlayers: 4, urlName: "enigma"},
  ]);

  // Game and player Info
  const [currentPlayer, setCurrentPlayer] = useState("none");
  const [gameInfo, setGameInfo] = useState({
    gameName: null,
    minPlayers: null,
    roomCode: null,
    gameId: null,
  });
  const [inGame, setInGame] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [carSelect, setCarSelect] = useState(0);
  let gid = -1;

  //For router history

  useEffect(() => {
    // Component DidUnmount, clear setup.
    return () => {
      socket.emit("disconnect");
      socket.off();
    };
  }, [SERVER]);

  const handleJoinGame = (playerName, roomCode, selectedGame) => {
    let truncName = playerName.slice(0, 19);
    setCurrentPlayer(truncName);
    socket.emit("joinGame", {
      name: truncName,
      roomCode: roomCode,
      gameId: selectedGame.gameId,
      minPlayers: selectedGame.minPlayers,
    });
  };

  // broadcast message to all players
  const renderGame = (gameId) => {
    switch (gameId) {
      case 1:
        return <EnigmaBreaker socket={socket} playerName={currentPlayer} />;
      default:
        return <Login listofGames={listofGames} handleJoinGame={handleJoinGame}/>
    }
    return <></>;
  };

  return (
    <Router>
        <Route path="/:game/:roomid">
          <GameRoom
            gameInfo={gameInfo}
            currentPlayer={currentPlayer}
            leaveGame={setInGame}
            socket={socket}
            listofGames={listofGames}
            setGameInfo={setGameInfo}
            setCurrentPlayer={setCurrentPlayer}
            >
            {renderGame(gameInfo.gameId)}
          </GameRoom>
        </Route>
        <Route path="/" exact={true}>
          <LandingPage
            socket={socket}
            setGameInfo={setGameInfo}
            setCurrentPlayer={setCurrentPlayer}
            carSelect={carSelect}
            setCarSelect={setCarSelect}
            listofGames={listofGames}
            SERVER={SERVER}
            />
        </Route>
    </Router>
  );
}
