//import Net from "net";
let WebSocketServer =require("ws").Server;
let wss = new WebSocketServer({port:9000});
let clientlist=[];
wss.on('connection', function (ws) {
    console.log('client connected');
    ws.on('message', function (message) {
        console.log(message);

        clientlist.map(function (client,idx) {
            client.send("OK" +idx)
        })
    });
});
wss.on('connection',function (ws) {
    ws.send("hello");
    clientlist.push(ws)
})
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
