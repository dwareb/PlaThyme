import React, { useState, useEffect, useRef, Fragment} from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useHistory } from "react-router-dom";
// import Carousel from "./Carousel";
import SelectGame from "./SelectGame";
import io from "socket.io-client";
import logo from '../images/plathyme.png';

let title;
let dialogText;
let buttonText;

const LandingPage = ({socket, setGameInfo, setCurrentPlayer, carSelect, setCarSelect, listofGames}) => {
  let history = useHistory()
  const [isOpen, setIsOpen] = useState(false);

    
  useEffect(() => {
    const openModal = () => setIsOpen(true);

    // Socket events
    socket.on("gameData", (gameData) => {
      const name = listofGames.find(
        (id) => id.gameId === gameData.gameId
      ).gameName;
      setGameInfo({
        gameName: name,
        minPlayers: gameData.minPlayers,
        roomCode: gameData.code,
        gameId: gameData.gameId,
      });
      let gName;
      if (gameData.gameId == 1){
        gName = "enigma";
      }
      history.push("/" + gName + "/" + gameData.code);
    });

    socket.on("error", (error) => {
      if (error.error === "dup") {
        title = "Error";
        dialogText = "User name is already in use in that game room";
        buttonText = "Dang...";
        openModal();
      }
      if (error.error === "gid") {
        title = "Error";
        dialogText = "Room code not valid";
        buttonText = "Typo?";
        openModal();
      }
      error = null;
    });
  }, []);

  // broadcast message to all players
  useEffect(() => {
    socket.on("GameRoomFullAlert", () => {
      title = "Room Full";
      dialogText =
        "The room you are trying to enter is already full. Try creating another room.";
      buttonText = "ok";
      setIsOpen(true);
    });
  }, []);

  const closeModal = () => setIsOpen(false);

  const handleCreateGame = (playerName, selectedGame) => {
    let truncName = playerName.slice(0, 19);
    setCurrentPlayer(truncName);
    socket.emit("newRoom", {
      name: truncName,
      roomCode: undefined,
      gameId: selectedGame.gameId,
      minPlayers: selectedGame.minPlayers,
    });
  };

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

  return (
    <div className="App font-mono bg-thyme-darkest">
      <div className="App font-mono bg-thyme-darkest h-screen">
        <img src={logo} alt="PlaThyme" className="w-80 block m-auto"></img>
        <SelectGame
          listofGames={listofGames}
          createGame={handleCreateGame}
          joinGame={handleJoinGame}
          setSelectedGame={setCarSelect}
        />
      </div>
      {/** modal Dialog, will be displayed when any error occured */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={closeModal}
        >
          <div className="min-h-screen px-4 text-center">
            <Transition.Child as={Fragment}>
              <Dialog.Overlay className="fixed inset-0" />
            </Transition.Child>

            <span
              className="inline-block h-screen align-middle"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-50"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-50"
            >
              <div className="inline-block max-w-md p-4 my-5 overflow-hidden text-left align-middle transition-all transform bg-thyme-700 shadow-md rounded-lg">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-thyme-300"
                >
                  {title}
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-md text-thyme-100">{dialogText}</p>
                </div>

                <div className="mt-4 w-full flex">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium shadow-md text-thyme-900 bg-thyme-100 rounded-md hover:bg-thyme-200"
                    onClick={closeModal}
                  >
                    {buttonText}
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default LandingPage;
