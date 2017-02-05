/**
 * Created by ikocos on 05/02/2017.
 */
function WS(url) {
    this.url = url;
    this.ws = null;
    this.userId = null;
    this.roomId = null;
    this.userName = null;

}
WS.prototype.connect = function (callback) {
    if (this.ws == null) {
        this.ws = new WebSocket(url);
        var _this = this;
        this.ws.onopen = function (message) {
            callback.open(_this, message);
        };
        this.ws.onclose = function (message) {
            // ws.send('close')
            console.log('you leaved game.')
        };
        this.ws.onmessage = function (message) {
            //showMessage(message.data);
            callback.message(_this, message)
        };
    }
}
WS.prototype.login = function (userName, msg, callback) {
    var request = {};
    request.command = 'login';
    request.userName = userName;
    request.message = msg;
    this.send(request);
    callback(this);
}
WS.prototype.send = function (request) {
    this.ws.send(JSON.stringify(request))
}
WS.prototype.logout = function () {
    if (this.ws != null) this.ws.close();
}
WS.prototype.join = function (roomId) {
    var request = {};
    request.command = 'join';
    request.roomId = roomId;
    this.send(request)

}
WS.prototype.createRoom = function (roomName) {
    var request = {};
    request.command = 'createRoom';
    request.roomName = roomName;
    this.roomName = roomName;
    this.send(request)

}
WS.prototype.chat = function (msg) {
    var request = {};
    request.command = 'chat';
    request.chat = msg;
    this.send(request)
}
WS.prototype.getRooms = function () {
    var request = {};
    request.command = "rooms";
    this.send(request)
}
WS.prototype.printRooms=function (rooms) {
    var _this =this;
    $('#room_list').html('');
    $.each(rooms, function (idx, data) {
        _this.printRoom(data)
    })
}
WS.prototype.printRoom=function (data) {
    var _this=this;
    var stateTxt = data.state == 0 ? '대기중' : '게임중';
    var button = data.state == 0 ? 'Join' : 'Waiting'
    var html = "<div class='panel panel-primary'>";
    html += "<div class='panel-heading'>" + data.roomName + "</div>";
    html += "<ul  class='panel-body'>";
    // html += "<li ><span>Name:" + data.roomName + "</span></li>"
    html += "<li><span>Players : </span><span class='num_"+data.roomId+"'>" + data.players + "</span>/3</li>"
    html += "<li><span >State : </span>" + stateTxt + "</li>"
    html += "</ul>";
    //html += "<div class='join' ><button  class='btn btn-default joinGame'>" + button + "</button></div>"
    html += "<div class='join' >";
    if (this.roomName != data.roomName) {
        html += "<button roomId='" + data.roomId + "'   class='btn btn-default joinGame'>" + button + "</button> "
    } else {
        this.roomId = data.roomId;
        html += "<button  class='btn btn-default start' >Start</button>"
    }
    html += "</div>";
    html += "</div>";

    var obj = $(html);
    obj.find('.start').click(function () {
        $('#play').modal('show')
    });
    obj.find('.joinGame').click(function () {
        var roomId = $(this).attr('roomId');
        _this.join(roomId);
    });
    $('#room_list').append(obj);
}
WS.prototype.printUsers=function (data) {
    $('#user_list ul').html('');
    $.each(data, function (idx, data) {
        $('#user_list ul').append("<li>" + data.userName + "</li>");
    })
}
WS.prototype.showMessage = function (message) {

    try {
        var json = JSON.parse(message);
        if (json.error == 1) {
            alert(json.msg)
            return
        }
        switch (json.mode) {
            case 'createRoom':
                this.printRoom(json.data.list);
                break;
            case 'chat':
                $('#chat ul').append("<li><span class='user'>" + json.data.user + ":</span> <span>" + json.data.msg + "</span></li>");
                break;
            case 'rooms':
                this.printRooms(json.data.list);
                this.printUsers(json.data.users)
                break;
            case 'connection':
                this.userName = json.data.userName;
                this.userId = json.data.userId;
                console.log(message)
                break;
            case 'login':
                this.printUsers(json.data)
                break;
            case 'join':
                $('.num_'+json.data.roomId).text(json.data.players);
                $('#play').modal('show');
                break;
        }
        console.log(this)
    } catch (e) {

        console.log(e.message);
    }
}