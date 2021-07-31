const Game = require("../Game");
const wordsList = require("./wordsList");

class EnigmaBreaker extends Game {
  constructor(roomCode, socket, io, players) {
    super(roomCode, socket, io, players);
    this.teams = {};
    this.redTurnOrder = [];
    this.blueTurnOrder = [];
    this.redHints = [];
    this.redHistory = [];
    this.blueHints = [];
    this.blueHistory = [];
    this.redNum = 0;
    this.blueNum = 0;
    this.currentRound = 0;
    this.redSel = ["0", "0", "0", "0", "0", "0"];
    this.blueSel = ["0", "0", "0", "0", "0", "0"];
    this.statusMessage = "Waiting for more players...";
    this.started = false;
    this.words = wordsList;
    this.redWords = this.generateWords();
    this.blueWords = this.generateWords();
    this.redCode = ["E", "R", "R"];
    this.blueCode = ["E", "R", "R"];
    this.redGuessHistory = [];
    this.blueGuessHistory = [];
    this.redScore = [0, 0];
    this.blueScore = [0, 0];

    // Game flow:
    // #0 : pre game, waiting for players
    // #1 : code sent out, waiting for both teams hints to be submitted
    // #2 : one team hints submitted, waiting for other
    // #3 : all hints submitted, waiting for both teams to guess
    // #4 : one teams guess recieved waiting other
    // #5 : both teams guess recieved, results presented
    // check for win, if win return to 1, else
    // #6 : game is over present results offer new game.
    this.gameState = 0;
  }

  //When the recieveData is called by the server for this game instance, this switches on the events recieved.
  recieveData(data) {
    switch (data.event) {
      case "begin-game":
        this.handleStartGame();
        this.handleStartTurn();
        break;
      case "join-team":
        this.handleJoinTeam(data);
        break;
      case "team-chat":
        this.handleTeamChat(data);
        break;
      case "red-hints":
        this.handleRedHints(data);
        break;
      case "blue-hints":
        this.handleBlueHints(data);
        break;
      case "red-selections":
        this.handleRedSelections(data);
        break;
      case "blue-selections":
        this.handleBlueSelections(data);
        break;
      case "submit-guess":
        this.handleGuess(data);
        break;
      case "next-round":
        this.advanceTurnOrder();
        this.currentRound += 1;
        this.handleStartTurn();
        break;
      case "new-game":
        this.handleNewGame();
        break;
      default:
        break;
    }
  }

  disconnection(playerName){
    super.disconnection(playerName);
    team = this.teams[playerName];
    if(team === 'red'){
      this.redNum -= 1;
      if(this.redTurnOrder[0] === playerName){
        
      }
      this.redTurnOrder.filter((player) => player != playerName);
    
    }
    if(team === 'blue'){
      this.blueNum -= 1;
      if(this.blueTurnOrder[0] === playerName){
        
      }
      this.blueTurnOrder.filter((player) => player != playerName);
    }
  }


  //Retransmits team chat message to each memeber of the same team
  handleTeamChat(data) {
    if (data.team === "red") {
      for (let i = 0; i < this.redTurnOrder.length; i++) {
        super.sendDataToPlayer(this.redTurnOrder[i], {
          event: "team-chat",
          message: data.message,
        });
      }
    }
    if (data.team === "blue") {
      for (let i = 0; i < this.blueTurnOrder.length; i++) {
        super.sendDataToPlayer(this.blueTurnOrder[i], {
          event: "team-chat",
          message: data.message,
        });
      }
    }
  }

  //Advances turn order to determine who the next coder is.
  advanceTurnOrder() {
    const lastPlayer = this.redTurnOrder.shift();
    this.redTurnOrder.push(lastPlayer);
    const lastPlayer2 = this.blueTurnOrder.shift();
    this.blueTurnOrder.push(lastPlayer2);
  }

  //These take the selections for guesses and re-transmiot them for each team
  handleRedSelections(data) {
    this.redSel.splice(data.index, 1, data.num);
    this.redTurnOrder.forEach((player) => {
      super.sendDataToPlayer(player, {
        event: "selections",
        selections: this.redSel,
      });
    });
  }
  handleBlueSelections(data) {
    this.blueSel.splice(data.index, 1, data.num);
    this.blueTurnOrder.forEach((player) => {
      super.sendDataToPlayer(player, {
        event: "selections",
        selections: this.blueSel,
      });
    });
  }

  //This generates the new word list for each time at the start of each round. Removing the selected word to prevent duplicates.
  generateWords() {
    let encoded = [];
    let rand = Math.floor(Math.random() * this.words.length);
    encoded.push(this.words.splice(rand, 1));
    rand = Math.floor(Math.random() * this.words.length);
    encoded.push(this.words.splice(rand, 1));
    rand = Math.floor(Math.random() * this.words.length);
    encoded.push(this.words.splice(rand, 1));
    rand = Math.floor(Math.random() * this.words.length);
    encoded.push(this.words.splice(rand, 1));
    return encoded;
  }

  //Each round each team needs a secret code that is given to one player. This generates the code as a random selection of the numbers 1-4 with no repeats.
  generateCode() {
    const nums = ["1", "2", "3", "4"];
    let code = [];
    let rand = Math.floor(Math.random() * nums.length);
    code.push(nums.splice(rand, 1)[0]);
    rand = Math.floor(Math.random() * nums.length);
    code.push(nums.splice(rand, 1)[0]);
    rand = Math.floor(Math.random() * nums.length);
    code.push(nums.splice(rand, 1)[0]);
    return code;
  }

  //Reset game state, to start new game.
  handleNewGame() {
    this.teams = {};
    this.redTurnOrder = [];
    this.blueTurnOrder = [];
    this.redHints = [];
    this.blueHints = [];
    this.redNum = 0;
    this.blueNum = 0;
    this.currentRound = 0;
    this.redSel = ["0", "0", "0", "0", "0", "0"];
    this.blueSel = ["0", "0", "0", "0", "0", "0"];
    this.statusMessage = "Waiting for more players to join teams...";
    this.started = false;
    this.redWords = this.generateWords();
    this.blueWords = this.generateWords();
    this.redCode = ["E", "R", "R"];
    this.blueCode = ["E", "R", "R"];
    this.redGuessHistory = [];
    this.blueGuessHistory = [];
    this.redScore = [0, 0];
    this.blueScore = [0, 0];
    this.gameState = 0;
    super.sendGameData({event:"reset-game"})
  }

  //When a team submits hints this records the hints, and distributes them to the other players.
  handleRedHints(data) {
    this.redHints.push([data.hint1, data.hint2, data.hint3]);
    this.gameState += 1; //Advance the game state. 2 indicates one team has hint in, 3 indicates that both are in.
    super.sendGameData({ event: "red-hints-in", state: this.gameState });

    //If both hints are in notify clients, and distribute hints.
    if (this.gameState === 3) {
      this.handleHintsSubmitted();
    }
  }
  handleBlueHints(data) {
    this.blueHints.push([data.hint1, data.hint2, data.hint3]);
    this.gameState += 1; //Advance the game state. 2 indicates one team has hint in, 3 indicates that both are in.
    super.sendGameData({ event: "blue-hints-in", state: this.gameState });

    //If both hints are in notify clients, and distribute hints.
    if (this.gameState === 3) {
      this.handleHintsSubmitted();
    }
  }

  //Both teams hints are in, present them to the players.
  handleHintsSubmitted() {
    super.sendGameData({
      event: "decryption",
      state: this.gameState,
      redHints: this.redHints[this.currentRound],
      blueHints: this.blueHints[this.currentRound],
    });
  }

  //Set the game as having started.
  handleStartGame() {
    this.gameState = 1; //A value of > 0 indicates that the game has started. First part of the round is 1.
    super.sendGameData({ event: "start-game", state: this.gameState });
  }

  //This sets all the variables for at the start of a new round, and pushes the data to the players.
  handleStartTurn() {
    this.gameState = 1; //Set game state to start of round.

    //Reset selections for guesses.
    this.redSel = ["0", "0", "0", "0", "0", "0"];
    this.blueSel = ["0", "0", "0", "0", "0", "0"];

    //Notify all clients new turn has started.
    super.sendGameData({
      event: "new-turn",
      state: this.gameState,
      selections: this.redSel,
      round: this.currentRound,
    });

    //Generates secret codes.
    this.redCode = this.generateCode();
    this.blueCode = this.generateCode();

    //Send blue, and red team active player the code.
    super.sendDataToPlayer(this.redTurnOrder[0], {
      event: "your-turn",
      code: this.redCode,
    });
    super.sendDataToPlayer(this.blueTurnOrder[0], {
      event: "your-turn",
      code: this.blueCode,
    });
  }

  //When a guess is recieved add it to the history, and update clients on that team to indicate so.
  handleGuess(data) {
    //Handle red team guess
    if (data.team === "red") {
      this.redGuessHistory.push(data.guess);
      this.gameState += 1; //Advance the game state. 4 indicates 1 guess is in, 5 is both.
      if (this.gameState === 4) {
        //Check to see if both teams have guessed yet.
        super.sendGameData({ event: "wait-blue-guess", state: this.gameState });
      } else {
        // Both teams have guessed, score game.
        this.handleScoreGame();
      }
      this.redTurnOrder.forEach((player) => {
        //Distribute final guesses for a team to all their players
        super.sendDataToPlayer(player, {
          event: "guess-data",
          guess: data.guess,
        });
      });
    } else {
      //Handle blue team guess
      this.blueGuessHistory.push(data.guess);
      this.gameState += 1; //Advance the game state. 4 indicates 1 guess is in, 5 is both.
      if (this.gameState === 4) {
        //Check to see if both teams have guessed yet.
        super.sendGameData({ event: "wait-red-guess", state: this.gameState });
      } else {
        // Both teams have guessed, score game.
        this.handleScoreGame();
      }
      this.blueTurnOrder.forEach((player) => {
        //Distribute final guesses for a team to all their players
        super.sendDataToPlayer(player, {
          event: "guess-data",
          guess: data.guess,
        });
      });
    }
  }

  //Score the round.
  handleScoreGame() {
    let redGuess = this.redGuessHistory[this.currentRound];
    let blueGuess = this.blueGuessHistory[this.currentRound];
    let score = [0, 0, 0, 0];
    let actual = [
      this.redCode[0],
      this.redCode[1],
      this.redCode[2],
      this.blueCode[0],
      this.blueCode[1],
      this.blueCode[2],
    ];
    let redRoundHistory = ["<<------------------------->>", "<<------------------------->>", "<<------------------------->>", "<<------------------------->>"];
    redRoundHistory[parseInt(this.redCode[0]) - 1] = redGuess[0] + " >> " + this.redHints[this.currentRound][0];
    redRoundHistory[parseInt(this.redCode[1]) - 1] = redGuess[1] + " >> " + this.redHints[this.currentRound][1];
    redRoundHistory[parseInt(this.redCode[2]) - 1] = redGuess[2] + " >> " + this.redHints[this.currentRound][2];
    this.redHistory.push(redRoundHistory);

    let blueRoundHistory = ["<<------------------------->>", "<<------------------------->>", "<<------------------------->>", "<<------------------------->>"];
    blueRoundHistory[parseInt(this.blueCode[0]) - 1] = blueGuess[3] + " >> " + this.blueHints[this.currentRound][0];
    blueRoundHistory[parseInt(this.blueCode[1]) - 1] = blueGuess[4] + " >> " + this.blueHints[this.currentRound][1];
    blueRoundHistory[parseInt(this.blueCode[2]) - 1] = blueGuess[5] + " >> " + this.blueHints[this.currentRound][2];
    this.blueHistory.push(blueRoundHistory);
    
    if (
      //check to see if red guessed their code correctly. No score change if they did.
      redGuess[0] === this.redCode[0] &&
      redGuess[1] === this.redCode[1] &&
      redGuess[2] === this.redCode[2]
    ) {
    } else {
      //If red didn't guess their code correctly, they get a miss
      score[1] = 1;
      this.redScore[1] += 1;
    }
    if (
      //Check to see if red guessed blue's code correctly. Award a hint if they did.
      redGuess[3] === this.blueCode[0] &&
      redGuess[4] === this.blueCode[1] &&
      redGuess[5] === this.blueCode[2]
    ) {
      score[0] = 1;
      this.redScore[0] += 1;
    }

    if (
      //check to see if blue guessed their code correctly. No score change if they did.
      blueGuess[3] === this.blueCode[0] &&
      blueGuess[4] === this.blueCode[1] &&
      blueGuess[5] === this.blueCode[2]
    ) {
    } else {
      //If blue didn't guess their code correctly, they get a miss
      score[3] = 1;
      this.blueScore[1] += 1;
    }
    if (
      //Check to see if blue guessed red's codeAward a hint if they did.
      blueGuess[0] === this.redCode[0] &&
      blueGuess[1] === this.redCode[1] &&
      blueGuess[2] === this.redCode[2]
    ) {
      score[2] = 1;
      this.blueScore[0] += 1;
    }

    //Check for end of game conditions.
    if (
      this.redScore[0] === 2 ||
      this.redScore[1] === 2 ||
      this.blueScore[0] === 2 ||
      this.blueScore[1] === 2 ||
      this.currentRound === 7
    ) {
      // If any score has reached 2, or 8th round is over, the game ends.
      //Check for outright victory by red or blue
      let rScore = this.redScore[0] - this.redScore[1];
      let bScore = this.blueScore[0] - this.blueScore[1];
      let victor = "tie";
      if (rScore > bScore) {
        victor = "Red";
      }
      if (bScore > rScore) {
        victor = "Blue";
      }
      this.gameState += 1; //Advance game state to end of the game.
      super.sendGameData({
        event: "game-over",
        score: score,
        codes: actual,
        redScore: this.redScore,
        blueScore: this.blueScore,
        winner: victor,
        state: this.gameState,
        redHistory: this.redHistory,
        blueHistory: this.blueHistory,
      });
      super.sendChat({sender:"Game-Over", text:"To start a new game press continue"});
      return;
    }

    //If the game isn't over, send the results.
    super.sendGameData({
      event: "score-result",
      score: score,
      codes: actual,
      redScore: this.redScore,
      blueScore: this.blueScore,
      state: this.gameState,
      redHistory: this.redHistory,
      blueHistory: this.blueHistory,
    });
  }

  handleJoinTeam(data) {
    if (data.team === "red") {
      this.teams[data.playerName] = "red";
      this.redNum += 1;
      this.redTurnOrder.push(data.playerName);
    }
    if (data.team === "blue") {
      this.teams[data.playerName] = "blue";
      this.blueNum += 1;
      this.blueTurnOrder.push(data.playerName);
    }
    if (data.team === "any") {
      if (this.redNum > this.blueNum) {
        this.teams[data.playerName] = "blue";
        this.blueNum += 1;
        this.blueTurnOrder.push(data.playerName);
      } else {
        this.teams[data.playerName] = "red";
        this.redNum += 1;
        this.redTurnOrder.push(data.playerName);
      }
    }
    if (this.teams[data.playerName] === "red") {
      super.sendDataToPlayer(data.playerName, {
        event: "team-info",
        team: "red",
        selections: this.redSel,
        status: this.statusMessage,
        wordList: this.redWords,
      });
    }
    if (this.teams[data.playerName] === "blue") {
      super.sendDataToPlayer(data.playerName, {
        event: "team-info",
        team: "blue",
        selections: this.blueSel,
        status: this.statusMessage,
        wordList: this.blueWords,
      });
    }
    if (this.redNum > 1 && this.blueNum > 1 && this.started === false) {
      super.sendGameData({ event: "allow-start" });
    }
  }
}
module.exports = EnigmaBreaker;