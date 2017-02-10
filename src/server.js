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
            case 'setting':
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
                ws.joinRoomId = msg.roomId;
                rooms[ws.userId] = {};
                rooms[ws.userId].roomId = msg.roomId;
                rooms[ws.userId].roomName = msg.roomName;
                rooms[ws.userId].rootId = ws.userId;
                rooms[ws.userId].client = [];
                rooms[ws.userId].state = 0;
                rooms[ws.userId].count = 0;
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
                ws.response.mode = msg.command;
                if (rooms.hasOwnProperty(ws.roomId)) delete rooms[ws.roomId];
                if (msg.roomId == undefined) {
                    ws.response.msg = '방을 선택하세요.';
                    ws.response.error = 1
                    send(ws);
                    return;
                }
                if (rooms.hasOwnProperty(ws.joinRoomId)) {// 다른 방에 있을 경우 삭제
                    let idx = rooms[ws.joinRoomId].client.indexOf(ws);
                    if (idx != -1) {
                        ws.response.mode = 'leave';
                        ws.response.msg = ws.userName + " left room.";
                        rooms[ws.joinRoomId].client.splice(idx, 1);
                        if( rooms[ws.joinRoomId].client.length == 1) rooms[ws.joinRoomId].state = 0;
                        ws.response.data.list = {
                            roomId: ws.joinRoomId,
                            roomName: rooms[ws.joinRoomId].roomName,
                            players: rooms[ws.joinRoomId].client.length,
                            state:  rooms[ws.joinRoomId].state
                        }

                        sendRoomUsers(ws.joinRoomId, ws.response);
                    }

                }
                ws.response.mode = msg.command;
                if (rooms.hasOwnProperty(msg.roomId)) { // 새로운 방에 가입
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
                } else {
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
            case 'init':
                ws.response.mode = msg.command;
                if (rooms[msg.roomId].rootId == ws.userId) {
                    if (rooms[msg.roomId].client.length > 1 && rooms[msg.roomId].state != 1) {
                        rooms[msg.roomId].state = 1;
                        rooms[msg.roomId].count = 0;
                        rooms[msg.roomId].data = {};
                        rooms[msg.roomId].winner = {};

                        ws.response.data = {
                            roomId: msg.roomId,
                            roomName: rooms[msg.roomId].roomName,
                            players: rooms[msg.roomId].client.length,
                            state: 1
                        }
                        ws.response.msg = 'Game Start!!!' + rooms[msg.roomId].roomName;
                        sendRoomUsers(msg.roomId, ws.response);
                    } else {
                        ws.response.error = 1;
                        ws.response.msg = "Game is playing.";
                        send(ws);
                    }
                } else {
                    ws.response.error = 1;
                    ws.response.msg = "You do not have permission.";
                    send(ws);
                }
                break
            case 'leave':
                ws.response.mode = msg.command;
                let roomId=ws.joinRoomId;
                if (rooms[roomId].rootId == ws.userId) {
                    rooms[roomId].client.map(function (cli,idx) {
                        if(cli.userId != ws.userId) {
                            rooms[roomId].client.splice(idx,1) ;
                        }
                    })

                } else {
                    if (rooms.hasOwnProperty(roomId)) {
                        rooms[roomId].client.splice(rooms[roomId].client.indexOf(ws), 1);
                        ws.joinRoomId='';
                    }
                    ws.response.msg = ws.userName + " left room.";
                }
                if( rooms[roomId].client.length == 1) rooms[roomId].state = 0;
                ws.response.data = {
                    roomId: roomId,
                    roomName: rooms[roomId].roomName,
                    players: rooms[roomId].client.length,
                    state:  rooms[roomId].state
                }

                sendRoomUsers(roomId, ws.response);
                break;
        }
        /*  console.log(clients.length + '/' + dices.length)
         if (dices.length == clients.length) {
         gameResult();
         }*/

    });


    ws.on('close', function () {
        if (rooms.hasOwnProperty(ws.userId)) delete rooms[ws.userId];
        if (rooms.hasOwnProperty(ws.joinRoomId)) rooms[ws.joinRoomId].client.splice(rooms[ws.joinRoomId].client.indexOf(ws), 1);
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
    client.response.data = {};
    let rps = {'R': 1, 'P': 2, 'S': 3};
    client.response.mode = msg.command;
    if (rooms[client.joinRoomId].state != 1) {
        client.response.error = 1;
        client.response.msg = "Not available to play. Waiting for owner restart. ";
        client.response.data = {};
        send(client);
    } else {

        if (!rooms[client.joinRoomId].data.hasOwnProperty(client.userId)) {
            rooms[client.joinRoomId].count++;
            rooms[client.joinRoomId].state = 1;
            rooms[client.joinRoomId].data[client.userId] = msg.rps;
            rooms[client.joinRoomId].winner[msg.rps] = client.userId;
        }
        if (rooms[client.joinRoomId].count == rooms[client.joinRoomId].client.length) {
            rooms[client.joinRoomId].state = 2;
            client.response.state = 2;
            client.response.data = rooms[client.joinRoomId].data;
            client.response.msg = "Done.";
            let sum = 0;
            for (let idx in rooms[client.joinRoomId].winner) {
                sum += rps[idx];
            }
            switch (sum) {
                case 3:
                    client.response.winner = rooms[client.joinRoomId].winner['P'];
                    break;
                case 4:
                    client.response.winner = rooms[client.joinRoomId].winner['R'];
                    break;
                case 5:
                    client.response.winner = rooms[client.joinRoomId].winner['S'];
                    break;

            }
            sendRoomUsers(client.joinRoomId, client.response);
        } else {
            client.response.state = 1;
            client.response.msg = "Waiting for result";
            send(client);
        }

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
