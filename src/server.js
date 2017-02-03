//import Net from "net";
let WebSocketServer = require("ws").Server;
let wss = new WebSocketServer({port: 9000});
let clients = [];
let dices = [];
wss.on('connection', function (ws) {
    console.log('client connected');

    clients.push(ws);
    ws.on('message', function (message) {
        //console.log(message);
        switch (message) {
            case 'throw':
                //console.log("")
                ws.dice=dice();
                dices.push(ws.dice);
                ws.send(JSON.stringify({msg: "OK", dice: dice()}))
                break;

        }
        console.log(clients.length +'/'+ dices.length)
        if (dices.length == clients.length) {
            gameResult();
        }

    });

    ws.send("welcome");
    ws.on('close',function () {
          clients.splice(clients.indexOf(ws),1);
    })

});

function dice() {
    let num = [1, 2, 3, 4, 5, 6];
    return num[Math.floor(Math.random() * 5)]
}
function gameResult() {
    if (dices.length == clients.length) {
        dices.sort(function (a,b) {
            return a-b;
        });
        let max=dices.pop();
        let draw=0;
        clients.map(function (client) {//client.readyState === WebSocket.OPEN
            if(client.dice==max) draw++;
            client.send(JSON.stringify({msg: "OK", dice: client.dice,max: max ,draw:draw==clients.length?1:0}))
        })
        dices=[];
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
