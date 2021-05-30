// If the webserver uses HTTPS, the websocket has to use SSL as well.
// Edit the variables below to suit your use case.
// You can run the application in docker and use a reverse proxy with Apache or Nginx to add SSL.

var serverParameters = {
	"websocket-protocol" : "ws",	// "ws" for insecure or "wss" for secure communication.
	"websocket-port" : "8082",		// The websocket port number.
}

module.exports = serverParameters;
