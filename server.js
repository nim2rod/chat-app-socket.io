/// npm init -y
// npm install express@4
// מעתיקים סטרטר מהדוקומנטציה
//npm install socket.io

const exp = require('constants')
const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server)
const port = process.env.PORT || 3030

let connectedUserCount = 0
let connectedUsers = []
const msgs = []

// app.get('/', (req, res) => {
//     // res.sendFile(__dirname + '/index.html')
// })

app.use(express.static(__dirname + '/public'))

io.on('connection', (socket) => {
    // connectedUserCount++
    socket.on('disconnect', () => {
        connectedUsers = connectedUsers.filter(nickname => nickname !== socket.nickname)
        // connectedUserCount--
        console.log('user disconnected', connectedUsers.length, 'active users')
        io.emit('connectedUsers', connectedUsers)
    })

    socket.on('sendMsg', async (msg) => {
        console.log('message: ', msg)
        // msgs.push(msg)
        if (msg.to) {
            const userSocket = await getUserSocket(msg.to)
            userSocket.emit('addMsg', msg)
            socket.emit('addMsg', msg)
        } else {
            msgs.push(msg)
            io.to(socket.myTopic).emit('addMsg', msg)
        }
    })

    socket.on('setUserSocket', (nickname) => {
        connectedUsers.push(nickname)
        socket.nickname = nickname
        console.log('a user connected', connectedUsers.length)

        socket.emit('addMsgs', msgs)
        io.emit('connectedUsers', connectedUsers)
    })

    socket.on('setTopic', (topic) => {
        if (socket.myTopic) {
            socket.leave(socket.myTopic)
        }
        socket.join(topic)
        socket.myTopic = topic
        socket.emit('addMsgs', msgs)
    })
})

async function getUserSocket(nickname) {
    const sockets = await _getAllSockets()
    const socket = sockets.find(socket => socket.nickname === nickname)
    return socket
}

async function _getAllSockets() {
    // return all socket instances
    const sockets = await io.fetchSockets()
    return sockets
}

server.listen(port, () => {
    console.log(`listening on *: http://localhost:${port}/`)
})