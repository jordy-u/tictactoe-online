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
	1 : "O",
	2 : "X",
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

const websocketServer = new WebSocket.Server({port:8082});

let aantalVerbindingen = 0;
let gameState = GAME_STATE.WAITING_FOR_2_PLAYERS;
let clients = [];
let playerTurn = 0;
let players = {
	player1 : {
		websocketConnection : null,
		symbol : "⭕",
	},
	player2 : {
		websocketConnection : null,
		symbol : "❎",
	},
};
let ticTacToe = null;

function broadcastMessage(message) {
	clients.forEach(function(client) {
		client.send(message);
	  });
}


websocketServer.on("connection", websocketConnection => {

	aantalVerbindingen++;

	console.log(`New client connected! Active players: ${aantalVerbindingen}`);

	clients.push(websocketConnection);

	websocketConnection.playerType = PLAYER_TYPE.UNDEFINED;

	switch(aantalVerbindingen) {
		case 1:
			websocketConnection.playerType = PLAYER_TYPE.HOST;
			break;
		case 2:
			websocketConnection.playerType = PLAYER_TYPE.PARTICIPANT;
			break;
		default:
			websocketConnection.playerType = PLAYER_TYPE.SPECTATOR;
			break;
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

	if (gameState == GAME_STATE.WAITING_FOR_2_PLAYERS && aantalVerbindingen >= 2) {
		gameState = GAME_STATE.GAME_ACTIVE;

		ticTacToe = new TicTacToe();
		playerTurn = Math.round(Math.random()+1);

		broadcastMessage(JSON.stringify({
			type : "changeGameState",
			newState : gameState,
			playerTurn : playerTurn
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
				playerTurn = Math.round(Math.random()+1);

				broadcastMessage(JSON.stringify({
					type : "changeGameState",
					newState : gameState,
					playerTurn : playerTurn,
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
	});
});

