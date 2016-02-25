WebChatInterfaceAJS is the Angularjs version of the [web interface](https://github.com/DavidAFox/ChatWebInterface) for my [chat](https://github.com/DavidAFox/Chat) server.


#### Use
In order to use it change the app value "serverInfo" to point at the location of the chat server, include the javascript, css and make sure the template is somewhere the module can get to it.  Then add the chatInterface module as a dependency and use the chat-interface directive where you want it to go.

#### Connections
It will prefer connecting on a websocket if possible otherwise it will fall back on http.

Uses [this](https://github.com/Luegg/angularjs-scroll-glue) package for scrolling.