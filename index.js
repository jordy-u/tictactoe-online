const serverParameters = require("./html/parameters");
const WebSocket = require("ws");
const TicTacToe  = require('tictactoe_model');

const GAME_STATE = {
	WAITING_FOR_2_PLAYERS : 1,
	GAME_ACTIVE : 2,
	WAITING_FOR_REMATCH : 3,
}

const PLAYER_TYPE = {
	UNDEFINED : 0,
	HOST : 1,
	PARTICIPANT : 2,
	SPECTATOR : 3,
}

const SYMBOL = {
	1 : "X",
	2 : "O",
}

const PLAYER_TYPE_USER_FRIENDLY = {
	0 : `Onbekend`,
	1 : `Host`,
	2 : "Deelnemer",
	3 : "Toeschouwer 📢",
}

const LOCATION_ID = {
	1 : [0,0],
	2 : [0,1],
	3 : [0,2],
	4 : [1,0],
	5 : [1,1],
	6 : [1,2],
	7 : [2,0],
	8 : [2,1],
	9 : [2,2],
}

const websocketServer = new WebSocket.Server({port:serverParameters["websocket-port"]});

let aantalVerbindingen = 0;
let gameState = null;
let clients = null;
let playerTurn = null;
let players = null;
let ticTacToe = null;

const initialiseGame = () => {
	gameState = GAME_STATE.WAITING_FOR_2_PLAYERS;
	clients = [];
	playerTurn = null;
	players = {
		player1 : {
			websocketConnection : null,
			symbol : "-",
		},
		player2 : {
			websocketConnection : null,
			symbol : "-",
		},
	};
	ticTacToe = new TicTacToe();
};

initialiseGame();

function broadcastMessage(message) {
	clients.forEach(function(client) {
		client.send(message);
	  });
}

function randomizePlayerSymbols() {
	playerTurn = Math.round(Math.random()+1);

	players.player1.symbol = (playerTurn === 1) ? "X" : "O";
	players.player2.symbol = (playerTurn === 2) ? "X" : "O";
}


websocketServer.on("connection", websocketConnection => {

	aantalVerbindingen++;

	console.log(`New client connected! Active players: ${aantalVerbindingen}`);

	clients.push(websocketConnection);

	websocketConnection.playerType = PLAYER_TYPE.UNDEFINED;

	if (players.player1.websocketConnection == null) {
		websocketConnection.playerType = PLAYER_TYPE.HOST;
		players.player1.websocketConnection = websocketConnection;
	}
	else if (players.player2.websocketConnection == null) {
		websocketConnection.playerType = PLAYER_TYPE.PARTICIPANT;
		players.player2.websocketConnection = websocketConnection;
	} else {
		websocketConnection.playerType = PLAYER_TYPE.SPECTATOR;
	}

	let playerData = {
		type : "playerData",
		playerData : {
			status : websocketConnection.playerType,
		},
	};
	websocketConnection.send(JSON.stringify(playerData));

	websocketConnection.send(JSON.stringify({
		type : "changeGameState",
		newState : gameState,
	}));

	websocketConnection.send(JSON.stringify({
		type : "syncBoardState",
		board : ticTacToe.squares(),
		playerTurn : playerTurn,
		hostSymbol : players.player1.symbol,
		participantSymbol : players.player2.symbol,
	}));
	

	if (gameState == GAME_STATE.GAME_ACTIVE && websocketConnection.playerType !== PLAYER_TYPE.SPECTATOR) {

		broadcastMessage(JSON.stringify({
			type : "message",
			class : "green darken-3",
			message : `De ${PLAYER_TYPE_USER_FRIENDLY[websocketConnection.playerType]} is wedergekeerd. Het spel wordt hervat.`
		}))
	}

	if (gameState == GAME_STATE.WAITING_FOR_2_PLAYERS && aantalVerbindingen >= 2) {
		gameState = GAME_STATE.GAME_ACTIVE;

		ticTacToe = new TicTacToe();
		
		randomizePlayerSymbols();

		broadcastMessage(JSON.stringify({
			type : "changeGameState",
			newState : gameState,
		}));

		broadcastMessage(JSON.stringify({
			type : "syncBoardState",
			board : ticTacToe.squares(),
			playerTurn : playerTurn,
			hostSymbol : players.player1.symbol,
			participantSymbol : players.player2.symbol,
		}));
	}

	websocketConnection.on("message", dataString => {
		const data = JSON.parse(dataString);

		switch(data.type) {
			case "select":

				console.log(websocketConnection.playerType);

				if (data.player == PLAYER_TYPE.SPECTATOR) {
					websocketConnection.send(JSON.stringify({
						type : "message",
						class : "red darken-3",
						message : "Foei! Je bent spectator! Je mag geen zet doen!"
					}));
					break;
				}

				if (websocketConnection.playerType !== playerTurn) {
					websocketConnection.send(JSON.stringify({
						type : "message",
						class : "red darken-3",
						message : "Foei! Jij bent nog niet aan de beurt!"
					}));
					break;
				}

				if (data.location < 1 || data.location > 9) {
					websocketConnection.send(JSON.stringify({
						type : "message",
						class : "red darken-3",
						message : "Ongeldige locatie"
					}));
					break;
				}

				const coordinates = LOCATION_ID[data.location];
				const moveSuccesful = ticTacToe.move(...coordinates)

				if (!moveSuccesful) {
					websocketConnection.send(JSON.stringify({
						type : "message",
						class : "gray darken-3",
						message : "Locatie al bezet"
					}));
					break;
				}

				console.debug(moveSuccesful);

				const selectTileEvent = {
					type : "tileSelected",
					location : data.location,
					player : data.player,
					symbol : (websocketConnection.playerType === PLAYER_TYPE.HOST) ? players.player1.symbol : players.player2.symbol,
				}

				playerTurn = (playerTurn == PLAYER_TYPE.HOST) ? PLAYER_TYPE.PARTICIPANT : PLAYER_TYPE.HOST;
				
				// Check of tile al bezet was.
				// Check of persoon aan de beurt is
				// Doe zet
				// Check of iemand gewonnen heeft
				broadcastMessage(JSON.stringify(selectTileEvent));

				if (ticTacToe.isDone()) {
					const winner = ticTacToe.winner()+1;
					gameState = GAME_STATE.WAITING_FOR_REMATCH;

					broadcastMessage(JSON.stringify({
						type : "changeGameState",
						newState : gameState,
						playerTurn : null
					}));
				}
				break;
			case "skip":
				const skipEvent = {
					type : "skip",
					player : data.player,
				}
				broadcastMessage(JSON.stringify(skipEvent));
				break;
			case "rematch":
				if (gameState !== GAME_STATE.WAITING_FOR_REMATCH) {
					websocketConnection.send(JSON.stringify({
						type : "message",
						class : "red darken-3",
						message : "Rematch niet mogelijk. Spel is nog niet afgelopen."
					}));
					break;
				}

				gameState = GAME_STATE.GAME_ACTIVE;
				ticTacToe = new TicTacToe();
				randomizePlayerSymbols();

				broadcastMessage(JSON.stringify({
					type : "changeGameState",
					newState : gameState,
					playerTurn : playerTurn,
				}));

				broadcastMessage(JSON.stringify({
					type : "syncBoardState",
					board : ticTacToe.squares(),
					playerTurn : playerTurn,
					hostSymbol : players.player1.symbol,
					participantSymbol : players.player2.symbol,
				}));
				break;
			default:
				console.error(`Message with unknown type recieved: ${data.type}`);
				break;
		}

		//Show board
		console.debug(ticTacToe.squares());
		
	})

	websocketConnection.on("close", () => {
		console.log("Disconnected");
		aantalVerbindingen--;

		if (websocketConnection.playerType == PLAYER_TYPE.HOST) {
			players.player1.websocketConnection = null;
			broadcastMessage(JSON.stringify({
				type : "message",
				class : "red darken-3",
				message : "De host heef het spel verlaten."
			}))
		}

		if (websocketConnection.playerType == PLAYER_TYPE.PARTICIPANT) {
			players.player2.websocketConnection = null;
			broadcastMessage(JSON.stringify({
				type : "message",
				class : "red darken-3",
				message : "De deelnemer heef het spel verlaten."
			}))
		}

		if (aantalVerbindingen === 0) {
			initialiseGame();
		}
	});
});

