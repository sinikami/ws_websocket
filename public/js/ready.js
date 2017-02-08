/**
 * Created by lineplus on 2/7/17.
 */
var url = 'ws://127.0.0.1:9000';
//var url = 'ws://10.70.24.221:9000';
$(document).ready(function () {
    var client = new WS(url);
    var fun = {
        open: function (obj, message) {
            console.log(message)
            obj.getRooms()
        }
        ,
        message: function (obj, message) {
            console.log(message);
            obj.showMessage(message.data);
        }
    }
    client.connect(fun);


    $('#userId').val('User@' + Math.floor(Math.random() * 10000));
    $('#roomName').val('Room@' + Math.floor(Math.random() * 10000));
    $('#login').click(function () {
        var userName = $('#userId').val();
        var msg = $('#message').val();
        if (userId.length == 0) {
            alert("이름을 입력하세요!")
            return;
        }
        client.login(userName, msg)
    })
    $('#logout').click(function () {
        client.logout();
    })

    $('#create').click(function () {
        var roomName = $('#roomName').val();

        if (roomName.length == 0) {
            alert("roomName 을 입력하세요!")
            return;
        }
        client.createRoom(roomName);
    })
    $('#sendMsg').click(function () {
        var msg = $('#chatMsg').val();
        if (msg.length == 0) {
            alert("메시지를 입력하세요.");
            $('#chatMsg').focus()
            return
        }
        client.chat(msg);
    })
    $('#chatMsg').on('keyup', function (event) {
        if (event.which == 13) {
            $('#sendMsg').click()
        }

    })
    $('.play').click(function () {
        if ($('div.rps').is('.disable')) {
            alert(1)
        } else {
            client.play($(this).attr('rps'));
            $('div.rps').addClass('disable')
        }
    })
    $('.restart').click(function () {

        if ($.trim($('.num_' + client.roomId).text()) < 2) {
            alert('아직 게임을 실행할 수 없습니다.');
            return
        }
        if (client.playState != 1) {
            client.init()
        } else {
            alert('게임진행중입니다.');
        }


    });
})