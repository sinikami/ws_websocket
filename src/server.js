//import Net from "net";
let WebSocketServer = require("ws").Server;
let wss = new WebSocketServer({port: 9000});
let clients = [];
let rooms = {};
let dices = [];

wss.on('connection', function (ws) {

    console.log('client connected');
    ws.userId = Math.floor(Math.random() * 1000);
    ws.userName = "user@" + ws.userId;

    ws.response = {
        error: 0,
        msg: "ok",
        mode: '',
        data: {}
    };

    ws.response.mode = 'connection';
    ws.response.data.userId = ws.userId;
    ws.response.data.userName = ws.userName;

    clients.push(ws);
    send(ws);
    notice();

    ws.on('message', function (message) {
        let msg = JSON.parse(message);
        let users = [];
        console.log(msg);

        switch (msg.command) {
            case 'throw':
                //console.log("")
                ws.dice = dice();
                dices.push(ws.dice);
                send(ws)
                break;
            case 'login':
                if (msg.userName == undefined) {
                    msg.userName = "user" + clients.length;
                }
                let client = clients[clients.indexOf(ws)];
                client.userName = msg.userName;
                client.winMsg = msg.message;
                ws.response.mode = msg.command;
                //ws.response.msg = "기본 정보가 업그레이드 되었습니다.";

                clients.map(function (data) {
                    users.push({userName: data.userName})
                })
                ws.response.data = users;
                sendAll(ws.response)
                break;

            case 'createRoom':

                if (rooms.hasOwnProperty(ws.userId)) {
                    ws.response = {
                        error: 1,
                        msg: "You'd already created a room."
                    }
                    send(ws);
                    return;
                }
                if (msg.roomName == undefined) {
                    msg.roomName = "Room" + rooms.length;
                }
                //msg.id = Object.keys(rooms) + 1;
                msg.roomId = ws.userId;
                rooms[ws.userId]={};
                rooms[ws.userId].roomId = msg.roomId;
                rooms[ws.userId].roomName = msg.roomName;
                rooms[ws.userId].rootId = ws.userId;
                rooms[ws.userId].client = [];
                rooms[ws.userId].state = 0;
                rooms[ws.userId].client.push(ws);

                ws.response.msg = 'You just created a room.';
                ws.response.mode = msg.command;

                ws.response.data.list = {
                    roomId: msg.roomId,
                    roomName: msg.roomName,
                    players: rooms[ws.userId].client.length,
                    state: 0
                }
                /*  clients.map(function (data) {
                 users.push({userName: data.userName})
                 })
                 ws.response.data.users = users;*/
                sendAll(ws.response)
                break;
            case 'join':
                if (rooms.hasOwnProperty(ws.roomId)) delete rooms[ws.roomId];
                if(msg.roomId == undefined){
                    ws.response.msg = '방을 선택하세요.';
                    ws.response.mode = msg.command;
                    ws.response.error = 1
                    send(ws);
                    return;
                }
                if (ws.joinRoomId != undefined && ws.joinRoomId == msg.roomId) {
                    ws.response.msg = 'You are already in the room.';
                    ws.response.mode = msg.command;
                    ws.response.error = 1
                    send(ws);
                    return;
                }
                if ( rooms.hasOwnProperty(ws.joinRoomId) && ws.joinRoomId != msg.roomId) {
                    let idx = rooms[ws.joinRoomId].client.indexOf(ws);
                    if (idx != -1) rooms[ws.joinRoomId].client.splice(idx, 1);

                }
               if (rooms.hasOwnProperty(msg.roomId)) {
                    rooms[msg.roomId].client.push(ws);
                    ws.joinRoomId = msg.roomId;
                    ws.response.msg = 'You have just joined room.' + rooms[msg.roomId].roomName;
                    ws.response.mode = msg.command;
                    ws.response.data = {
                        roomId: msg.roomId,
                        roomName: msg.roomName,
                        players: rooms[msg.roomId].client.length,
                        state: 0
                    }
                    sendRoomUsers(msg.roomId, ws.response);
               }else{
                   ws.response.msg = 'The room does not exist.';
                   ws.response.mode = msg.command;
                   ws.response.error = 1
                   send(ws);
                   return;
               }
                break
            case 'chat':
                ws.response.mode = msg.command;
                ws.response.data = {user: ws.userName, msg: msg.chat};
                sendAll(ws.response)
                break;

            case 'play':
                play(ws, msg);
                break;
            case 'init':
                if (ws.userId == rooms[ws.room].rootId && rooms[ws.room].state == 2) {
                    rooms[ws.room].count = 0;
                    rooms[ws.room].state = 1;
                }
                ws.response.msg = 'Game Start!!!' + rooms[msg.id].name;
                ws.response.data = {
                    roomId: rooms[ws.room].roomId,
                    roomName: rooms[ws.room].roomName,
                    players: rooms[ws.room].client.length,
                    state: 1
                }
                sendAll(ws.response)
                break;
            case 'rooms':
                ws.response.msg = "all rooms";
                let list = [];
                for (let idx in rooms) {
                    let data = rooms[idx];
                    list.push({
                        roomId: data.roomId,
                        roomName: data.roomName,
                        players: data.client.length,
                        state: 0
                    })
                }
                clients.map(function (data) {
                    users.push({userName: data.userName})
                })
                ws.response.data = {};
                ws.response.data.list = list;
                ws.response.data.users = users;
                ws.response.data.userId = ws.userId;
                ws.response.mode = msg.command;
                send(ws)
                break;

        }
        /*  console.log(clients.length + '/' + dices.length)
         if (dices.length == clients.length) {
         gameResult();
         }*/

    });


    ws.on('close', function () {
        if( rooms.hasOwnProperty(ws.userId)) delete rooms[ws.userId];
        if( rooms.hasOwnProperty(ws.joinRoomId)) rooms[ws.joinRoomId].client.splice(rooms[ws.joinRoomId].client.indexOf(ws),1);
        clients.splice(clients.indexOf(ws), 1);
        //rooms.splice(rooms.indexOf(ws.userId),1);
        notice();
    })

});
function notice() {
    let list = [];
    let response = {
        error: 0,
        msg: "ok",
        mode: '',
        data: {}
    };

    let users = [];
    for (let idx in rooms) {
        let data = rooms[idx];
        list.push({
            roomId: data.roomId,
            roomName: data.roomName,
            players: data.client.length,
            state: 0
        })
    }
    clients.map(function (data) {
        users.push({userName: data.userName})
    })
    response.data.list = list;
    response.data.users = users;
    response.mode = 'rooms';

    sendAll(response);
}
function send(client) {
    client.send(JSON.stringify(client.response))
}
function dice() {
    let num = [1, 2, 3, 4, 5, 6];
    return num[Math.floor(Math.random() * 5)]
}
function sendAll(response) {
    clients.map(function (client) {
        //client.readyState === WebSocket.OPEN
        //response.data = {user: user, msg: msg};
        client.send(JSON.stringify(response))
    })
}
function sendRoomUsers(roomId, response) {

    rooms[roomId].client.map(function (client) {
        client.send(JSON.stringify(response))
    })
}
function play(client, msg) {
    client.rps = msg.rps;
    rooms[client.room].count++;

    if (rooms[client.room].count == clients.length) {
        rooms[client.room].state = 2;

        clients.map(function (client) {
            //client.readyState === WebSocket.OPEN
            //response.data = {user: user, msg: msg};
            client.send(JSON.stringify(response))
        })
    }
}
function gameResult() {
    if (dices.length == clients.length) {
        dices.sort(function (a, b) {
            return a - b;
        });
        let max = dices.pop();
        let draw = 0;
        clients.map(function (client) {//client.readyState === WebSocket.OPEN
            if (client.dice == max) draw++;
            client.send(JSON.stringify({msg: "OK", dice: client.dice, max: max, draw: draw == clients.length ? 1 : 0}))
        })
        dices = [];
    }
}
/*
 let server =Net.createServer((c)=>{
 c.on('error',function () {
 console.log("error")
 })
 c.write("hello\n")
 c.pipe(c)
 });
 let clientlist=[];
 console.log('start');
 //server.setEncoding('utf-8');
 server.on('connection',function (client) {
 client.name = client.remoteAddress +':'+ client.remotePort;
 client.write("Hi! ");
 clientlist.push(client);
 console.log(client)
 client.on('data',function (data) {
 // broadcast("what's up");
 console.log(data)
 })
 client.end();
 });

 function broadcast(msg) {
 clientlist.map(function (client) {
 client.write(msg);
 })
 }
 server.listen(9000);
 console.log('listen');*/
