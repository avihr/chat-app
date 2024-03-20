import express from "express";
import { join } from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import BadWordsFilter from "bad-words";
import {
    generateMessage,
    generateLocationMessage,
} from "../src/utils/messages.js";
import { addUser, getUser, getUsersInRoom, removeUser } from "./utils/user.js";

const app = express();
const server = createServer(app);
const io = new Server(server);

const directory = import.meta.dirname;
const publicDir = join(directory, "../public");
app.use(express.static(publicDir));

const port = process.env.PORT || 3000;

io.on("connection", (socket) => {
    console.log("new socket connection");

    socket.on("join", ({ username, room }, callback) => {
        socket.join(room);

        const { error, user } = addUser({ id: socket.id, username, room });

        if (error) {
            return callback(error);
        }

        socket.emit("message", generateMessage("Welcome!", ""));
        socket.broadcast
            .to(user.room)
            .emit(
                "message",
                generateMessage(`${user.username} has joined the chat`, "")
            );

        io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUsersInRoom(user.room),
        });

        callback();
    });

    socket.on("sendMessage", (msg, callbaclk) => {
        const user = getUser(socket.id);
        const filter = new BadWordsFilter();
        if (filter.isProfane(msg)) return callbaclk("Profanity is not allowed");
        io.to(user.room).emit("message", generateMessage(msg, user.username));
        callbaclk();
    });

    socket.on("sendPosition", (position, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit(
            "locationMessage",
            generateLocationMessage(
                user.username,
                `https://google.com/maps?q=${position.latitude},${position.longitude}`
            )
        );
        callback();
    });

    socket.on("disconnect", () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit(
                "message",
                generateMessage(`${user.username} has left the chat`)
            );
            io.to(user.room).emit("roomData", {
                users: getUsersInRoom(user.room),
                room: user.room,
            });
        }
    });
});

server.listen(port, () => {
    console.log("server up on ", port);
});
