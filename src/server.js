const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const Filter = require("bad-words");
const filter = new Filter();
const {generateMessage, generateURL} = require("./utils/messages");
const {addUser, removeUser, getUser, getUsersInRoom} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;

const publicDirectoryPath = path.join(__dirname,"../public");

app.use(express.static(publicDirectoryPath));


io.on("connection", (socket) =>{

    socket.on("join", ({username, room}, callback)=> {
        const {error, user} = addUser({id: socket.id, username, room});
        if(error){
            return callback(error);
        }
        socket.join(user.room)
        socket.emit("message", generateMessage("Admin",`Welcome ${user.username}`));
        socket.broadcast.to(user.room).emit("message", generateMessage("Admin", `${user.username} has joined`));
        io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
    })

    socket.on("sendMessage", (message, callback)=>{
        user = getUser(socket.id);
        if(filter.isProfane(message)){
            return callback("Profanity is not allowed");
        }
        io.to(user.room).emit("message", generateMessage(user.username, message));
        callback("Message was delivered!");
    })

    socket.on("sendLocation", (location, callback)=>{
        const user = getUser(socket.id);
        io.to(user.room).emit("locationMessage", generateURL(user.username,`https://google.com/maps?q=${location.latitude},${location.longitude}&output=embed&z=15`));
        callback("Location shared!");
    })
    
    socket.on("disconnect", ()=>{
        const user = removeUser(socket.id);
        if(user){
            io.to(user.room).emit("userDisconnected", generateMessage("Admin" ,`${user.username} has left the chat`));
            io.to(user.room).emit("roomData", {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, ()=>{
    console.log(`Server is listening on port ${port}`);
})