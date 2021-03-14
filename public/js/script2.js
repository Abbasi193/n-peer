$(document).ready(function () {
  loadPeople()
  loadInfo()
  loadPeopleForGroup()
  loadGroups()

});
function loadInfo() {
  $.get("/myinfo",
    function (data, status) {
      MY_INFO = JSON.parse(data.user)
    }
  );
}

async function loadPeer(peer) {
  var result = await fetch(`/getPeerId?peer=${peer}`)
  var json = await result.json()
  return JSON.parse(json.user);
}

function loadPeople() {
  $.get("/users",
    function (data, status) {
      var people = JSON.parse(data.groupMembers)
      USERS = people
      var ul = $('<ul class="w3-ul"></ul>')
      people.forEach(person => {
        var li = $(`<li>${person.name}<br>${person.phoneNo}</li><button onclick='makeCall("${person.userId}")'>Call</button>`)
        li.appendTo(ul)
      });
      ul.appendTo($('#people'))

      ul = $('<ul class="w3-ul"></ul>')
      people.forEach(person => {
        var li = $(`<li>${person.name}<br>${person.phoneNo}</li><button onclick='loadMessage("${person.userId}")'>Message</button>`)
        li.appendTo(ul)
      });
      ul.appendTo($('#people-chat'))

      ul = $('<ul class="w3-ul"></ul>')
      people.forEach(person => {
        var li = $(`<li>${person.name}<br>${person.phoneNo}</li><button onclick='loadFile("${person.userId}")'>File</button>`)
        li.appendTo(ul)
      });
      ul.appendTo($('#people-file'))
    }
  );
}

function loadGroups() {
  $.get("/usergroups",
    function (data, status) {
      var groups = JSON.parse(data.groups)
      var ul = $('<ul></ul>')
      groups.forEach(group => {
        var li = $(`<li>${group.groupName}<br>${group.groupId}</li><button onclick='loadGroupsMembers("${group.groupId}")'>Members</button><button onclick='makeGroupCall("${group.groupId}")'>Invite all</button><button onclick='joinRoom("${group.groupId}")'>Join Room</button><button onclick='loadGroupMessage("${group.groupId}")'>Message</button><button onclick='loadGroupFile("${group.groupId}")'>File</button>`)
        li.appendTo(ul)
      });
      ul.appendTo($('#group-box'))
    }
  );
}

function loadGroupsMembers(id) {
  $.get(`/groupmembers?groupId=${id}`,
    function (data, status) {
      var groupMembers = JSON.parse(data.groupMembers)
      var ul = $('<ul class="w3-ul"></ul>')
      groupMembers.forEach(groupMember => {
        var li = $(`<li>${getUserName(groupMember.userId)}</li>`)
        li.appendTo(ul)
      })
      $('#group-member-box').empty()
      ul.appendTo($('#group-member-box'))
      $('#group-member-box').removeClass("hidden")
      $('#group-message-box-outer').addClass("hidden")
      $('#group-file-box-outer').addClass("hidden")
    }
  );
}

function loadMessage(recipient) {
  CURRENT_CHAT = recipient
  $.get("/message",
    { recipient: recipient },
    function (data, status) {
      var messages = JSON.parse(data.messages)
      var ul = $('<ul class="w3-ul"></ul>')
      messages.forEach(message => {
        if (message.sender === MY_INFO.id) {
          var li = $(`<li>ME: ${message.message}</li>`)
        } else {
          var li = $(`<li>${getUserName(message.sender)}: ${message.message}</li>`)
        }
        li.appendTo(ul)
      });
      $('#message-box').empty()
      ul.appendTo($('#message-box'))//.html(JSON.parse(data.groupMembers))
       $('#chat-box-container').removeClass("hidden")
    }
  );
}

function loadGroupMessage(recipient) {
  CURRENT_GROUP_CHAT = recipient
  $.get("/message",
    { recipient: recipient, group: true },
    function (data, status) {
      var messages = JSON.parse(data.messages)
      var ul = $('<ul class="w3-ul"></ul>')
      messages.forEach(message => {
        if (message.sender === MY_INFO.id) {
          var li = $(`<li>ME: ${message.message}</li>`)
        } else {
          var li = $(`<li>${getUserName(message.sender)}: ${message.message}</li>`)
        }
        li.appendTo(ul)
      });
      $('#group-message-box').empty()
      ul.appendTo($('#group-message-box'))//.html(JSON.parse(data.groupMembers))
      $('#group-member-box').addClass("hidden")
      $('#group-message-box-outer').removeClass("hidden")
      $('#group-file-box-outer').addClass("hidden")
    }
  );
}

function getUserName(id) {
  var user = USERS.filter(user => {
    return user.userId === id
  })[0];
  if (id === MY_INFO.id) {
    return MY_INFO.name;
  }

  return user.name
}

function loadPeopleForGroup() {
  $.get("/users",
    function (data, status) {
      var people = JSON.parse(data.groupMembers)
      var ul = $('<ul class="w3-ul"></ul>')
      people.forEach(person => {
        var li = $(`<li>${person.name}<br>${person.phoneNo}</li><button onclick='addToGroup("${person.userId}")'>Add</button><button onclick='removeFromGroup("${person.userId}")'>Remove</button>`)
        li.appendTo(ul)
      });
      ul.appendTo($('#people-list'))//.html(JSON.parse(data.groupMembers))
    }
  );
}
function addToGroup(id) {
  if (!GROUP_LIST.includes(id))
    GROUP_LIST.push(id)
  var groupNames = GROUP_LIST.map(id => {
    return getUserName(id)
  })
  $('#group-people').html(groupNames)
}

function removeFromGroup(id) {
  GROUP_LIST.pop(id)
  var groupNames = GROUP_LIST.map(id => {
    return getUserName(id)
  })
  $('#group-people').html(groupNames)
}

function createGroup() {
  var groupName = $('#group-name-input').val()
  GROUP_LIST.push(MY_INFO.id)

  $.post("/newgroup",
    { groupName, groupMembers: GROUP_LIST },
    function (data, status) {
      alert(JSON.stringify(data))
      GROUP_LIST = []
    }
  );
}
function loadFile(recipient) {
  $('#file-button').click(() => {
    uploadFile(recipient, "individual")
  })
  $.get("/userfiles",
    { recipient: recipient },
    function (data, status) {
      var files = JSON.parse(data.files)
      var ul = $('<ul class="w3-ul"></ul>')
      files.forEach(file => {
        if (file.sender === MY_INFO.id) {
          var li = $(`<li>ME: ${file.name}</li><button onclick='downloadFile("${file.name}")'>Download</button>`)
        } else {
          var li = $(`<li>${getUserName(file.sender)}: ${file.name}</li><button onclick='downloadFile("${file.name}")'>Download</button>`)
        }
        li.appendTo(ul)
      });
      $('#file-box').empty()
      ul.appendTo($('#file-box'))//.html(JSON.parse(data.groupMembers))
      $('#file-box-container').removeClass("hidden")
    }
  );
}

function loadGroupFile(recipient) {
  $('#group-file-button').click(() => {
    uploadFile(recipient, "group")
  })
  $.get("/userfiles",
    { recipient: recipient, group: true },
    function (data, status) {
      var files = JSON.parse(data.files)
      var ul = $('<ul class="w3-ul"></ul>')
      files.forEach(file => {
        if (file.sender === MY_INFO.id) {
          var li = $(`<li>ME: ${file.name}</li><button onclick='downloadFile("${file.name}")'>Download</button>`)
        } else {
          var li = $(`<li>${getUserName(file.sender)}: ${file.name}</li><button onclick='downloadFile("${file.name}")'>Download</button>`)
        }
        li.appendTo(ul)
      });
      $('#group-file-box').empty()
      ul.appendTo($('#group-file-box'))//.html(JSON.parse(data.groupMembers))
      $('#group-member-box').addClass("hidden")
      $('#group-message-box-outer').addClass("hidden")
      $('#group-file-box-outer').removeClass("hidden")
    }
  );
}

function downloadFile(urlToSend) {
  var req = new XMLHttpRequest();
  req.open("GET", '/uploads/' + urlToSend, true);
  req.responseType = "blob";
  req.onload = function (event) {
    var link = document.createElement('a');
    link.href = window.URL.createObjectURL(req.response);
    link.download = urlToSend;
    link.click();
  };
  req.send();
}

function uploadFile(recipient, type) {
  var fd = new FormData();
  var id;
  if (type === 'group') {
    id = '#group-file'
  } else {
    id = '#file'
  }
  var files = $(id)[0].files[0];
  fd.append('file', files);
  fd.append('recipient', recipient);
  fd.append('type', type);
  $.ajax({
    url: '/upload',
    type: 'post',
    data: fd,
    contentType: false,
    processData: false,
    success: function (response) {
      console.log(response)
    },
  });

}
function changeToStopScreen() {
  $('#screen').val('Stop Screen').attr('onclick','stopScreen()')
}
function changeToShareScreen() {
  $('#screen').val('Share Screen').attr('onclick','shareScreen()')
}
function showModel() {
  $('#video-container').show()
}
function openCity(evt, cityName) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(cityName).style.display = "block";
  evt.currentTarget.className += " active";
}

// Get the element with id="defaultOpen" and click on it
document.getElementById("defaultOpen").click();

var parent;
function fullSizeVideo(){
  $('#fullsize-video-container').show()
  parent = this.parentElement
  this.className = 'fullsizeVideo'
  document.getElementById('fullsize-video-container-content').appendChild(this)
}

function closeFullSizeVideo(){
  $('#fullsize-video-container').hide()
  var element = document.getElementsByClassName('fullsizeVideo')[0]
  element.className = ''
  parent.prepend(element)
  
}