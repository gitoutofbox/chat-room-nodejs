const login = () => {
    let username = $('#login_name').val();
    let password = $('#login_pass').val();
    $.ajax({
        type: "POST",
        url: "http://localhost:8082/login",
        data: JSON.stringify( {"username": username, "password": password} ),
        success: function(resp) {
            if(resp.status) {
                $('#login').hide();
                $('#after-login').show();
                sessionStorage.setItem("user", JSON.stringify(resp.data));
                $('#me').html(`
                        <div class="me">
                            <img src="images/${resp.data.user_image}" />
                            ${resp.data.user_full_name}
                         </div>
                         `);
                socket.emit('loggedin', resp.data);
            }
        },
        dataType: "json",
        contentType: "application/json"
      });
}

const sendMyMessage = (chatWidowId, fromUser, message) => {
    let loggedInUser = JSON.parse(sessionStorage.getItem('user'))
    let meClass = loggedInUser.user_id == fromUser.user_id ? 'me' : '';

    $('#after-login').find(`#${chatWidowId} .body`).append(`
        <div class="chat-text ${meClass}">
            <div class="userPhoto">
                <img src="images/${fromUser.user_image}" />
            </div>
            <div>
                <span class="message">${message}<span>
            </div>
        </div>
    `);
}

const sendMessage = (room) => {
    let loggedInUser = JSON.parse(sessionStorage.getItem('user'))
    let message = $('#'+room).find('.messageText').val();
    $('#'+room).find('.messageText').val('');
    socket.emit('message', {room: room, message:message, from: loggedInUser});
    sendMyMessage(room, loggedInUser, message)
}
const openChatWindow = (room) => {
    if($(`#${room}`).length === 0 ) {
        $('#after-login').append(`
        <div class="chat-window" id="${room}">
            <div class="body"></div>
            <div class="footer">
                <input type="text" class="messageText"/><button onclick="sendMessage('${room}')">GO</button>
            </div>
        </div>
        `)
    }
}
const createRoom = (id) => {
    let loggedInUser = JSON.parse(sessionStorage.getItem('user'));
    let room = Date.now() + Math.random();
    room = room.toString().replace(".","_");
    socket.emit('create', {room: room, userId:loggedInUser.userId, withUserId:id});
    openChatWindow(room);
}
socket.on('updateUserList', function(userList) {
    let loggedInUser = JSON.parse(sessionStorage.getItem('user'));
    $('#user-list').html('<ul></ul>');
    userList.forEach(item => {
        if(loggedInUser.user_id != item.user_id){
            $('#user-list ul').append(`<li data-id="${item.user_id}" onclick="createRoom('${item.user_id}')">${item.user_full_name}</li>`)
        }
    });

});

socket.on('invite', function(data) {
    socket.emit("joinRoom",data)
});
socket.on('message', function(msg) {
    //If chat window not opened with this roomId, open it
    if(!$('#after-login').find(`#${msg.room}`).length) {
        openChatWindow(msg.room)
    }
    sendMyMessage(msg.room, msg.from, msg.message)
});