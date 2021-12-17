import { handle } from "express/lib/router";
import React, { useRef, useEffect } from "react";
import { useParams, useHistory } from "react-router-dom";

const Login = ({ listofGames, handleJoinGame }) => {
  let { game } = useParams();
  let { roomid } = useParams();
  let history = useHistory();
  const nameRef = useRef();

  useEffect(() => {
    let exists = false;
    for (let g of listofGames) {
      if (g.urlName === game) {
        exists = true;
      }
    }
    if (!exists) {
      history.push("/");
    }
    if (roomid.length > 20) {
      history.push("/");
    }
  }, [game,roomid]);

  const joinGame = (e) => {
    e.preventDefault();
    let gid = 0;
    for (let g of listofGames) {
        if (g.urlName === game) {
          gid = g.gameId;
        }
    }
    const selectedGame = listofGames.find(
        (item) => item.urlName === game
      );
    handleJoinGame(nameRef.current.value, roomid, selectedGame);
  }

  return (
    <div>
      <div className="bg-thyme p-4 shadow mx-auto">
        <form onSubmit={joinGame} action="">
          <div className="mb-5">
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Username"
              maxLength="20"
              className="border border-gray-300 shadow p-2 w-full"
              autoComplete="off"
              ref={nameRef}
              required
            />
          </div>
          <button className="block w-full bg-thyme-darkest hover:text-thyme-light text-white font-bold p-2">
            Enter Your Name
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
