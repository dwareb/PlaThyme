const express = require("express");
const path = require("path");
const cors = require("cors");
const PORT = process.env.PORT || 3001;
const app = express();
const http = require("http").createServer(app);
const EnigmaBreaker = require("./Games/EnigmaBreaker/EnigmaBreaker");
const { makeid } = require("./makeid");
const {
  joinRoom,
  leaveRoom,
  getUser,
  getGameId,
  numUsersInRoom,
  getUsersInRoom,
  getUserByNameAndCode,
} = require("./rooms.js");

//games is a dict of the game state objects, indexed bt the roomCode.
const games = {};
//Get sockets running
const io = require("socket.io")(http, { cors: { origin: "*" } });
app.use(cors());

//Handle all events related to a socket connection.
io.on("connection", (socket) => {
  console.log("Client Connected");

  //Socket events to handle the various events.
  socket.on("newRoom", (data) => handleCreateGame(data));
  socket.on("leaveRoom", () => {
    try {
      leaveRoom(socket.id);
    } catch (error) {
      console.error(error);
    }
  });
  socket.on("messageSend", (message) => handleMessageSend(message));
  socket.on("leaveGame", () => handleDisconnect());
  socket.on("disconnect", () => handleDisconnect());
  socket.on("joinGame", (data) => handleJoinGame(data));
  socket.on("game-data", (data) => {
    try {
      if (getUser(socket.id)) {
        games[getUser(socket.id).roomCode].recieveData(data);
      }
    } catch (error) {
      console.error(error);
    }
  });

  //Below are the functions to to handle the socket.on events.

  //New game greation.
  const handleCreateGame = (data) => {
    //Generate a random room code.
    let newRoom = true;
    if (data.roomCode === undefined) {
      roomCode = makeid(6);

      //Check if the random ID was a repeat. If so, recursively attempt again.
      if (numUsersInRoom(roomCode) > 0) {
        handleCreateGame(data);
        return;
      }
    } else {
      newRoom = false;
      roomCode = data.roomCode;
    }
    //Build the data to be sent out to the client.
    const gameData = {
      playerName: data.name,
      code: roomCode,
      gameId: data.gameId,
      minPlayers: data.minPlayers,
    };

    //Adds user, game to room tracking.
    let error = joinRoom({
      id: socket.id,
      name: data.name,
      gameId: data.gameId,
      roomCode: roomCode,
      score: 0,
    });

    //Transmit the game info to the client, and join them to the socket channel for the roomCode.
    socket.emit("gameData", gameData);
    socket.join(roomCode);

    //When Making a game, the game must be added to the list below for its creation with its matching ID.
    //Create a new game object for the selected game, and call its start game function.
    switch (data.gameId) {
      case 1: // EnigmaBreaker
        games[roomCode] = new EnigmaBreaker(
          roomCode,
          socket,
          io,
          [data.name],
          data.minPlayers
        );
        break;

      default:
        break;
    }

    //Send all players updated user list.
    io.to(roomCode).emit("userData", getUsersInRoom(roomCode));
  };

  //Join a client to an existing game
  const handleJoinGame = (data) => {
    try {
      const gid = getGameId(data.roomCode);
      const userId = socket.id;
      //Make sure game room exists.
      // if (gid === null || games[roomCode] === undefined) {
      //   socket.emit("error", { error: "gid" });
      //   return;
      // }
      if (games[data.roomCode] === undefined) {
        handleCreateGame(data);
        return;
      }

      //Try to join the user to the room.
      let error = joinRoom({
        id: socket.id,
        gameId: gid,
        name: data.name,
        roomCode: data.roomCode,
        score: 0,
      });

      //Check for duplicate user.
      if (error.error === "dup") {
        socket.emit("error", { error: "dup" });
        return;
      }

      //If the user name is valid, join the player to the room, aand
      if (error.error !== "dup" && error.error !== "dup") {
        socket.broadcast.to(data.roomCode).emit("message", {
          sender: "",
          text: `"${data.name}" has joined the game.`,
        });

        //Broadcast the game information to the client who just joined the game, and join them to the roomCode socket channel.
        const gameData = {
          playerName: data.name,
          code: data.roomCode,
          gameId: gid,
        };
        games[data.roomCode].newPlayer(data.name);
        socket.emit("gameData", gameData);
        socket.join(data.roomCode);

        //Notify the game object that a new player has joined.
        // Test: enter wrong room code; got error. (add checks)
        // switch(gid){
        //   case 3: // UKnowIt
        //     if(games[data.roomCode].players.length === games[data.roomCode].minPlayers){
        //         games[data.roomCode].startGame();
        //       }
        //       else {
        //         // send an error event indicating thta current room is full and redireect them to home page agin.
        //         io.to(userId).emit("GameRoomFullAlert");
        //       }
        //   break;

        //   default:
        //     break;
        // }

        //Send all players updated user list.
        io.to(data.roomCode).emit("userData", getUsersInRoom(data.roomCode));
      }
    } catch (error) {
      console.error(error);
    }
  };

  //Perform client disconnection actions
  const handleDisconnect = () => {
    console.log("Client Disconnected");
    try {
      //Remove the user from room tracking, and socket.
      const userName = leaveRoom(socket.id);
      socket.leave(roomCode);

      //Verify the user was in a room, then perform the other actions upon disconnect
      if (userName) {
        //Send chat message to all users in the room to notify of the disconnection.
        io.to(userName.roomCode).emit("message", {
          sender: "",
          text: `"${userName.name}" left the game.`,
        });
        //Send all players updated user list.
        io.to(userName.roomCode).emit(
          "userData",
          getUsersInRoom(userName.roomCode)
        );
        io.to(userName.roomCode).emit("playerLeft", {
          leftPlayerName: userName.name,
        });
        //Notify game object that the player has left, if the game exists.
        if (games[userName.roomCode]) {
          games[userName.roomCode].disconnection(userName.name);
          if (numUsersInRoom(userName.roomCode) === 0) {
            delete games[userName.roomCode];
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  //Forward chat messages to all clients in a room.
  const handleMessageSend = (message) => {
    try {
      //Get the room information for the client.
      const senderId = getUser(socket.id);
      //Forward the message to the game object, so it can use it.
      //Use the clients room code to re-transmit the message.
      io.to(senderId.roomCode).emit("message", {
        sender: message.sender,
        text: message.text,
      });
      games[senderId.roomCode].chatMessage({
        sender: message.sender,
        text: message.text,
      });
    } catch (error) {
      console.error(error);
    }
  };
});

//set listen port, and log it.
http.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

//Default routing path.
app.use(express.static(path.resolve(__dirname, "../client/build")));

//All other routing paths
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build/index.html"));
});
