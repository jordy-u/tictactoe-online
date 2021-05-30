const WebSocket = require("ws");
// const TicTacToe  = require('tictactoe_model');

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
// const ticTacToe = new TicTacToe();

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

				// if (board.isMoveValid(data.location)) {
				// 	websocketConnection.send(JSON.stringify({
				// 		type : "message",
				// 		class : "red darken-3",
				// 		message : "Ongeldige locatie"
				// 	}));
				// 	break;
				// }

				// if (board.isPositionTaken(data.location)) {
				// 	websocketConnection.send(JSON.stringify({
				// 		type : "message",
				// 		class : "gray darken-3",
				// 		message : "Locatie al bezet"
				// 	}));
				// 	break;
				// }

				// const boardString = board.makeMove(data.location, SYMBOL[data.player]);

				// ticTacToe.move(0, 0);

				// console.debug(ticTacToe.turn());
				// console.debug(ticTacToe.squares());

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
				break;
			case "skip":
				const skipEvent = {
					type : "skip",
					player : data.player,
				}
				broadcastMessage(JSON.stringify(skipEvent));
				break;
			case "rematch":
				break;
			default:
				console.error(`Message with unknown type recieved: ${data.type}`);
				break;
		}

		
	})

	websocketConnection.on("close", () => {
		console.log("Disconnected");
	});
});

