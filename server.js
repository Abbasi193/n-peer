const http = require('http');
const fs = require('fs');
const cors = require('cors');
const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
var cookieParser = require('cookie-parser')
const { ExpressPeerServer } = require('peer');
const app = express()

const server = http.createServer(app)
const io = require('socket.io')(server)
const JWT_SECRET = PROCESS.ENV.SECRET;
const uri = PROCESS.ENV.URL;
const User = require('./model/user');
const Group = require('./model/group');
const Message = require('./model/message');
const Join = require('./model/join');
const File = require('./model/file');
const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/'
});
const upload = require('express-fileupload')
const auth = require('./middleware/auth');


var users = []

app.use(upload());
app.use(cors());
app.use(express.json());
app.use('/peerjs', peerServer);
app.use(express.static('public'))
app.use(cookieParser('yes'));
app.use(express.urlencoded({ extended: false }));

io.use(function (socket, next) {
    auth(socket.request, socket.request.res, next);
});

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/public/register.html')
})

app.get('/upload', (req, res) => {
    res.sendFile(__dirname + '/public/file.html')
})

app.get('/download', (req, res) => {
    res.sendFile(__dirname + '/public/download.html')
})

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html')
})

app.get('/users', auth, async (req, res) => {
    var userId = req.user.id;
    try {
        const users = await User.find();
        var newUsers = []
        for (var user of users) {
            if (user._id != userId)
                newUsers.push({ userId: user._id, phoneNo: user.phoneNo, name: user.name })
        }
        res.status(200).json({ msg: 'Users', groupMembers: JSON.stringify(newUsers), error: false });

    } catch (e) {
        res.status(200).json({ msg: e.message, error: true });
    }
})

app.post('/register', async (req, res) => {
    var name = req.body.name;
    var phoneNo = req.body.phoneNo;
    var password = req.body.password;
    try {
        if (!name) throw Error("Enter Name");
        if (!phoneNo) throw Error("Enter phoneNo");
        if (!password) throw Error("Enter Password");
        const checkPhoneNo = await User.findOne({ phoneNo: phoneNo });
        if (checkPhoneNo) throw Error('PhoneNo already exists');


        if (password.length < 8) throw Error('Password should be atleast 8 char long');
        var salt = await bcrypt.genSalt(10);
        var passHash = await bcrypt.hash(password, salt);
        const savedUser = await User.create({ name, phoneNo, password: passHash });

        const token = jwt.sign({ id: savedUser._id }, JWT_SECRET, { expiresIn: '1h' });
        if (!token) throw Error('Couldnt sign the token');

        res.cookie('x-auth-token', token, {
            maxAge: 1000 * 60 * 60,
            httpOnly: true,
            signed: true,
            //secure:true,
        })
        //res.status(200).json({ msg: 'Account created Succesfull', error: false });
        res.redirect('/')

    } catch (e) {
        res.status(200).json({ msg: e.message, error: true });
    }

})

app.post('/login', async (req, res) => {
    var phoneNo = req.body.phoneNo;
    var password = req.body.password;
    try {
        if (!phoneNo) throw Error("Enter phone No");
        if (!password) throw Error("Enter Password");
        var userInfo = await User.findOne({ phoneNo });
        if (!userInfo) throw Error("Invalid Phone No");

        var success = await bcrypt.compare(password, userInfo.password);
        if (!success) throw Error("Invalid Password");

        const token = jwt.sign({ id: userInfo._id, name: userInfo.name }, JWT_SECRET, { expiresIn: '1h' });
        if (!token) throw Error('Couldnt sign the token');

        res.cookie('x-auth-token', token, {
            maxAge: 1000 * 60 * 60,
            httpOnly: true
            // signed: true,
            //secure:true
        })
        //res.status(200).send({ msg: 'Login successfully', error: false });
        res.redirect('/')

    } catch (e) {
        res.status(200).send({ msg: e.message, error: true });
    }
})

app.post('/newgroup', auth, async (req, res) => {
    var groupName = req.body.groupName;
    var groupMembers = req.body['groupMembers[]'];

    try {
        if (!groupName) throw Error("Enter Group Name");
        var group = await Group.create({ name: groupName });

        for (userId of groupMembers) {
            const checkUser = await User.findOne({ _id: userId });
            if (checkUser) {
                var join = await Join.create({ groupId: group._id, userId });
            } else {
                throw Error('User not exists');
            }

        }

        res.status(200).json({ msg: 'Group created Succesfull', error: false });
    } catch (e) {
        res.status(200).json({ msg: e.message, error: true });
    }

})

app.get('/message', auth, async (req, res) => {
    var recipient = req.query.recipient;
    var sender = req.user.id
    var group = req.query.group;
    var message;
    try {
        if (!recipient) throw Error("Enter Id");

        if (group) {
            var inGroup = await Join.findOne({ userId: sender, groupId: recipient });
            if (!inGroup) throw Error("User is not in group");
            message = await Message.find({ recipient });
        }
        else {
            message = await Message.find({
                $or: [
                    { recipient, sender },
                    { sender: recipient, recipient: sender }
                ]
            });
        }
        res.status(200).json({ msg: 'messages', messages: JSON.stringify(message), error: false });

    } catch (e) {
        res.status(200).json({ msg: e.message, error: true });
    }
})

app.get('/myinfo', auth, async (req, res) => {
    var user = req.user;
    res.status(200).json({ msg: 'Info', user: JSON.stringify(user), error: false });
})

app.get('/groupmembers', auth, async (req, res) => {
    var groupId = req.query.groupId;
    try {
        if (!groupId) throw Error("Enter Group Id");
        const join = await Join.find({ groupId });
        res.status(200).json({ msg: 'Group Members', groupMembers: JSON.stringify(join), error: false });

    } catch (e) {
        res.status(200).json({ msg: e.message, error: true });
    }

})

app.get('/usergroups', auth, async (req, res) => {
    var userId = req.user.id;
    try {
        if (!userId) throw Error("Enter user Id");
        const join = await Join.find({ userId });

        Promise.all(join.map(async obj => {
            var groupName = await Group.findOne({ _id: obj.groupId })
            return { groupName: groupName.name, groupId: obj.groupId, userId: obj.userId }
        })).then((values) => {

            res.status(200).json({ msg: 'Groups', groups: JSON.stringify(values), error: false });
        })

    } catch (e) {
        res.status(200).json({ msg: e.message, error: true });
    }
    // io.in(obj.groupId).allSockets().then((sockets) => {
    //     var group = Array.from(sockets)
    //     console.table(group)
    // })

})

app.get('/userfiles', auth, async (req, res) => {
    var recipient = req.query.recipient;
    var sender = req.user.id
    var group = req.query.group;
    var file;
    try {
        if (!recipient) throw Error("Enter Id");

        if (group) {
            var inGroup = await Join.findOne({ userId: sender, groupId: recipient });
            if (!inGroup) throw Error("User is not in group");
            file = await File.find({ recipient });
        }
        else {
            file = await File.find({
                $or: [
                    { recipient, sender },
                    { sender: recipient, recipient: sender }
                ]
            });
        }
        res.status(200).json({ msg: 'files', files: JSON.stringify(file), error: false });

    } catch (e) {
        res.status(200).json({ msg: e.message, error: true });
    }
})

app.post('/upload', auth, (req, res) => {

    var userId = req.user.id
    var file = req.files.file;
    var filename = file.name;
    var recipient = req.body.recipient;
    var type = req.body.type;
    file.mv('./public/uploads/' + filename, async (err) => {
        if (err)
            res.send('Upload Error');
        else {
            try {
                if (type === 'individual') {
                    await File.create({ name: filename, type, recipient, sender: userId })
                    res.send('Uploaded');
                }
                else if (type === 'group') {
                    var inGroup = await Join.findOne({ userId, groupId: recipient });
                    if (!inGroup) throw Error("User is not in group");
                    await File.create({ name: filename, type, recipient, sender: userId })
                    res.send('Uploaded');
                }
            } catch (e) {
                console.log(e)
                res.status(200).json({ msg: e.message, error: true });
            }
        }
    });
});

app.get('/getPeerId', auth, (req, res) => {
    var peer = req.query.peer
    var user = users.find((x) => {
        return x.peerId === peer
    })
    res.status(200).json({ msg: 'user', user: JSON.stringify(user), error: false });
})

app.get('/', auth, (req, res) => {
    res.sendFile(__dirname + '/public/room.html')
})

io.on('connection', socket => {
    const USER_ID = socket.request.user.id
    socket.on('message', async (recipient, message, type) => {
        var userId = USER_ID
        try {
            if (type === 'individual') {
                var available = users.find((x) => {
                    return x.userId === recipient
                })
                await Message.create({ message, type, recipient, sender: userId })
                if (!available) throw Error("User is offline");
                var recipientSocketId = available.socketId
                socket.to(recipientSocketId).emit('new-message', userId, message, 0)
            }
            else if (type === 'group') {
                var inGroup = await Join.findOne({ userId, groupId: recipient });
                if (!inGroup) throw Error("User is not in group");
                await Message.create({ message, type, recipient, sender: userId })
                socket.to(recipient).emit('new-message', userId, message, recipient)
            }

        } catch (e) {
            console.log(e)
        }

    })
    socket.on('sendid', (peerId) => {
        var userId = USER_ID
        var caller = users.find((x) => {
            return x.userId === userId
        })
        if (caller) {
            users.pop(caller)
        }
        users.push({ userId, peerId, socketId: socket.id })
        socket.on('disconnect', () => {
            users.pop({ userId, peerId, socketId: socket.id })
        })
        console.table(users)
    })

    socket.on('join-room', (roomId, userId) => {

        socket.join(roomId)
        socket.to(roomId).emit('user-connected', userId)

        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', userId)
        })
    })

    socket.on('get-members', (roomId) => {
        var userId = USER_ID
        var peers = []
        io.in(roomId).allSockets().then((sockets) => {
            var group = Array.from(sockets)

            var caller = users.find((x) => {
                return x.userId === userId
            })
            group.forEach(socketId => {

                var callee = users.find((x) => {
                    return x.socketId === socketId
                })
                if (callee.peerId != caller.peerId) {
                    peers.push(callee.peerId)
                }
            });
            socket.emit('members', JSON.stringify(peers))
        })
    })

    socket.on('create-meeting', async (roomId, callId, type) => {
        var callerId = USER_ID
        if (type === "individual") {
            var callee = users.find((x) => {
                return x.userId === callId
            })
            if (callee)
                socket.to(callee.socketId).emit('meeting', roomId, callerId)
        } else if (type === "group") {
            const group = await Join.find({ groupId: roomId }).select('userId');
            group.forEach(callId => {
                if (callId.userId != callerId) {
                    var callee = users.find((x) => {
                        return x.userId === callId.userId
                    })
                    if (callee)
                        socket.to(callee.socketId).emit('meeting', roomId, callerId)
                }
            });
        }
    })
})

server.listen(process.env.PORT, async () => {
    console.log('Server started...');
    try {
        await mongoose.connect(uri, {
            useUnifiedTopology: true,
            useCreateIndex: true,
            useNewUrlParser: true
        });
        console.log('Database Connected...');
    } catch (e) {
        console.log('Database error');
    }
})
