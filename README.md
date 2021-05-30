
# tictactoe-online
Een boter, kaar &amp; eieren spel voor in de webbrowser. Gemaakt om ervaring op te doen met websockets.

**Project status:** Niet-maintained, het is een leerproject ¯\_(ツ)_/¯

### Screenshot van hoe het eruit ziet

![Screenshot van het spel](https://github.com/jordy-u/tictactoe-online/raw/master/docs/screenshot_match_ended.png)

### Installatie

 1. Clone de repository
 2. Stel de websocket host goed in in /html/client-logic.js. Voorbeeld: `const websocket = new WebSocket("ws://localhost:8082");`
 3. Open de /server file in je terminal en installeer de NPM packages: `npm install`
 4. Vanuit /server, run `npm start` of `node ./index.js`.
 5. Browser files staan in de html-folder. Open 2 of meer browsers en open index.html.
> Speel je op localhost, dan hoef je niks te doen. Open html/index.html in browser (vanuit je filesystem).
> Speel je met anderen (online), host de html-folder met een webserver (Apache/Nginx/ect.)
5. Spelen!
