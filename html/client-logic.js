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
	1 : `Host (⭕)`,
	2 : "Deelnemer (❎)",
	3 : "Toeschouwer 📢",
}

const PLAYER_SYMBOLS = {
	1 : "⭕",
	2 : "❎",
}

let player = 0;
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
				document.getElementById("playerTurn").innerHTML = `<a style="font-weight: bold;">Aan de beurt:</a> ${PLAYER_SYMBOLS[data.playerTurn]}`
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
			document.getElementById("playerType").innerHTML = `<a style="font-weight: bold;">Player type:</a> ${PLAYER_TYPE_USER_FRIENDLY[player]}`;
			break;
		case "tileSelected":
			const tile = document.getElementById(data.location);
			tile.innerHTML = PLAYER_SYMBOLS[data.player];

			const playerTurn = (data.player == PLAYER_TYPE.HOST) ? PLAYER_TYPE.PARTICIPANT : PLAYER_TYPE.HOST;
			document.getElementById("playerTurn").innerHTML = `<a style="font-weight: bold;">Aan de beurt:</a> ${PLAYER_SYMBOLS[playerTurn]}`

			break;
		case "message":
			M.toast({html: data.message, classes: data.class})
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