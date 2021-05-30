const GAME_STATE = {
	WAITING_FOR_2_PLAYERS : 1,
	GAME_ACTIVE : 2,
	WAITING_FOR_REMATCH : 3,
}

const spinner = `  <div class="preloader-wrapper small active">
<div class="spinner-layer spinner-green-only">
  <div class="circle-clipper left">
	<div class="circle"></div>
  </div><div class="gap-patch">
	<div class="circle"></div>
  </div><div class="circle-clipper right">
	<div class="circle"></div>
  </div>
</div>
</div>`;

const GAME_STATE_USER_FRIENDLY = {
	1 : `Waiting for 2nd player ${spinner}`,
	2 : "Game active <i class='material-icons'>casino</i>",
	3 : "Waiting for rematch",
}

const PLAYER_TYPE = {
	UNDEFINED : 0,
	HOST : 1,
	PARTICIPANT : 2,
	SPECTATOR : 3,
}

const PLAYER_TYPE_USER_FRIENDLY = {
	0 : `Onbekend`,
	1 : `Host`,
	2 : "Deelnemer",
	3 : "Toeschouwer 📢",
}

const PLAYER_SYMBOLS = {
	1 : "❎",
	2 : "⭕",
	"X" : "❎",
	"O" : "⭕", 
}

let player = 0;
let mySymbol = null;
let opponentSymbol = null
let hostSymbol = null;
let participantSymbol = null;
const websocket = new WebSocket("ws://thuis.jordyu.nl:8082");
// const websocket = new WebSocket("ws://localhost:8082");

websocket.addEventListener("open", () => {
	console.log("connected");
});

websocket.addEventListener("message", e => {
	const data = JSON.parse(e.data);
	console.log(data);

	switch(data.type) {
		case "changeGameState":
			document.getElementById("gameState").innerHTML = `<a style="font-weight: bold;">Game state:</a> ${GAME_STATE_USER_FRIENDLY[data.newState]}`;

			if (data.newState === GAME_STATE.GAME_ACTIVE) {
				const playerTurn = (data.playerTurn == PLAYER_TYPE.HOST) ? PLAYER_TYPE.PARTICIPANT : PLAYER_TYPE.HOST;
				
				for (var i = 0; i < buttons.length; i++) {
					buttons[i].innerHTML = "";
				}
				rematchBtn.style.display = "none";
			}

			if (data.newState === GAME_STATE.WAITING_FOR_REMATCH) {
				M.toast({html: "Het spel is afgelopen.", classes: "green darken-3"})
				rematchBtn.style.display = "block";
			}
			break;
		case "playerData":
			player = data.playerData.status;
			document.getElementById("playerType").innerHTML = `${PLAYER_TYPE_USER_FRIENDLY[player]}`;
			// document.getElementById("playerSymbol").innerHTML = `(${PLAYER_SYMBOLS[player]})`;
			break;
		case "tileSelected":
			const tile = document.getElementById(data.location);
			tile.innerHTML = PLAYER_SYMBOLS[data.symbol];

			const symbolNextPlayer = (data.player == PLAYER_TYPE.HOST) ? PLAYER_SYMBOLS[participantSymbol] : PLAYER_SYMBOLS[hostSymbol];

			document.getElementById("playerTurn").innerHTML = `<a style="font-weight: bold;">Aan de beurt:</a> ${symbolNextPlayer}`;

			break;
		case "message":
			M.toast({html: data.message, classes: data.class})
			break;
		case "syncBoardState":

			hostSymbol = data.hostSymbol;
			participantSymbol = data.participantSymbol;

			console.debug(data.board);
			for (let x = 0; x <= 2; x++) {
				for (let y = 0; y <= 2; y++) {
					let location = x + y*3;
					if (data.board[y][x] === null)
						continue;
					if (data.board[y][x] === "O") {
						buttons[location].innerHTML = PLAYER_SYMBOLS[2];
						continue;
					}
					if (data.board[y][x] === "X") {
						buttons[location].innerHTML = PLAYER_SYMBOLS[1];
						continue;
					}
				}
			}

			document.getElementById("playerTurn").innerHTML = `<a style="font-weight: bold;">Aan de beurt:</a> ${PLAYER_SYMBOLS[1]}`;

			if (player === PLAYER_TYPE.SPECTATOR) {
				document.getElementById("playerSymbol").innerHTML = ``;
				break;
			}

			const mySymbolData = (player === PLAYER_TYPE.HOST) ? data.hostSymbol : data.participantSymbol;
			if (mySymbolData === "X") {
				mySymbol = PLAYER_SYMBOLS[1];
				opponentSymbol = PLAYER_SYMBOLS[2];
			} else {
				mySymbol = PLAYER_SYMBOLS[2];
				opponentSymbol = PLAYER_SYMBOLS[1];
				
			}

			document.getElementById("playerSymbol").innerHTML = `(${mySymbol})`;
			
			break;
		case "debug":
			console.debug(data);
			break;
		default:
			console.error("Not implemented yet");
			break;
	}
})

const pressBtn = function() {
	const pressedButton = this.id;
	console.log(`Pressed button: ${pressedButton}`);

	console.log(this.id);

	const selectTileEvent = {
		type : "select",
		location : pressedButton,
		player : player,
	}
	websocket.send(JSON.stringify(selectTileEvent));
	
}

var buttons = document.getElementsByClassName("boterkaaseieren_btn");
const rematchBtn = document.getElementById("rematch_btn");

for (var i = 0; i < buttons.length; i++) {
	buttons[i].addEventListener('click', pressBtn, false);
}

const rematchBtn_click = function() {
	console.log(`Rematch button clicked`);

	const rematchEvent = {
		type : "rematch",
	}
	websocket.send(JSON.stringify(rematchEvent));
	
}

rematchBtn.addEventListener('click', rematchBtn_click, false);