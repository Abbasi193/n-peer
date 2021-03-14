const socket = io('/')
var ROOM_ID;
var MY_INFO;
var CURRENT_CHAT;
var CURRENT_GROUP_CHAT;
var USERS;
var GROUP_LIST = [];
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
  host: '/',
  port: process.env.PORT,
  path: '/peerjs'
});

const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}

class MyClass extends EventTarget {
  stopVideo() {
    this.dispatchEvent(new Event('stop-video'));
  }
  stopAudio() {
    this.dispatchEvent(new Event('stop-audio'));
  }
  stopScreen() {
    this.dispatchEvent(new Event('stop-screen'));
  }
}

const videoEventInstance = new MyClass();


socket.on('user-disconnected', (userId) => {
  console.log('i got ')
  var userVideos = Array.from(document.getElementsByClassName(userId))

  for (var x of userVideos) {
    x.remove()
  }

  if (peers[userId])
    peers[userId].close()
})

myPeer.on('open', id => {
  socket.emit('sendid', id)
})

// myPeer.on("disconnected", function () {
//   console.log("I am disconnected");
//   peer.destroy();
// });

myPeer.on("error", function (err) {
  console.log("Error: ", err);
});

socket.on('meeting', (roomId, callerId) => {
  alert('meet')
  joinRoom(roomId)
})

socket.on('new-message', (userId, message, group) => {

  if (CURRENT_GROUP_CHAT === group) {
    var li = $(`<li>${getUserName(userId)}: ${message}</li>`)
    li.appendTo($('#group-message-box ul'))
  }
  else if (CURRENT_CHAT === userId) {
    var li = $(`<li>${getUserName(userId)}: ${message}</li>`)
    li.appendTo($('#message-box ul'))
  } else {
    document.getElementById('new-message-box').innerHTML = getUserName(userId) + ':' + message
  }
})

function makeCall(callee) {
  var roomId = 'room' + (new Date()).getTime().toString()
  joinRoom(roomId)
  socket.emit('create-meeting', roomId, callee, 'individual')
}
function makeGroupCall(roomId) {
  joinRoom(roomId)
  socket.emit('create-meeting', roomId, '', 'group')
}
function shareScreen() {
  navigator.mediaDevices.getDisplayMedia({
    audio: false,
    video: true
  }).then(stream => {

    socket.emit('get-members', ROOM_ID)

    socket.once('members', members => {
      var members = JSON.parse(members)
      console.log(members)
      members.forEach(member => {
        myPeer.call(member, stream, { metadata: 'screen' })
      })
    })

    socket.on('user-connected', (userId) => {
      console.log('i will call')
      myPeer.call(userId, stream, { metadata: 'screen' })
    })
    videoEventInstance.addEventListener('stop-screen', (e) => {
      stream.getVideoTracks()[0].enabled =
        !(stream.getVideoTracks()[0].enabled);
    });
    changeToStopScreen()
  })
}

function joinRoom(roomId) {
  //console.log(myPeer.id)
  showModel()
  ROOM_ID = roomId
  navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true
  }).then(stream => {
    myPeer.on('call', call => {
      const video = document.createElement('video')
      video.className = call.peer
      // console.log('i will be called')
      // console.log(call.metadata)
      if (call.metadata === 'screen') {
        console.log('screen share')
        call.answer()
        
      } else {
        call.answer(stream)
      }

      call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream, call.peer)
      })
      call.on('close', () => {
        console.log('caledsd')
        video.remove()
      })
    })

    videoEventInstance.addEventListener('stop-video', (e) => {
      stream.getVideoTracks()[0].enabled =
        !(stream.getVideoTracks()[0].enabled);
    });
    videoEventInstance.addEventListener('stop-audio', (e) => {
      stream.getAudioTracks()[0].enabled =
        !(stream.getAudioTracks()[0].enabled);
    });

    socket.on('user-connected', (userId) => {
      console.log('i will call')
      connectToNewUser(userId, stream)
    })
    addVideoStream(myVideo, stream, myPeer.id)
    socket.emit('join-room', roomId, myPeer.id)
  })

}

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream, userId)
  })
  call.on('close', () => {
    console.log('i remove')
    video.remove()
  })

  peers[userId] = call
}

function addVideoStream(video, stream, id) {

  video.srcObject = stream
  video.onclick = fullSizeVideo
  stream.oninactive = () => {
    console.log('inner remove')
    video.remove()
  }
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  const div = document.createElement('div')
  div.className = 'container'
  const span = document.createElement('span')
  span.className = 'ovelay'

  loadPeer(id).then(res => {

    span.appendChild(document.createTextNode(getUserName(res.userId)))
    div.appendChild(video)
    div.appendChild(span)
    

    videoGrid.append(div)
  })
  //var loadPeer(id)

}

function sendMessage() {
  var message = document.getElementById('message-input').value

  var li = $(`<li>ME: ${message}</li>`)
  li.appendTo($('#message-box ul'))

  socket.emit('message', CURRENT_CHAT, message, 'individual')
}

function sendGroupMessage() {
  var message = document.getElementById('group-message-input').value

  var li = $(`<li>ME: ${message}</li>`)
  li.appendTo($('#group-message-box ul'))
  socket.emit('message', CURRENT_GROUP_CHAT, message, 'group')
}

function stopVideo() {
  videoEventInstance.stopVideo();
}

function stopAudio() {
  videoEventInstance.stopAudio();
}
function stopScreen() {
  videoEventInstance.stopScreen();
  changeToShareScreen()
}