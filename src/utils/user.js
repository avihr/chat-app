const users = [];

const addUser = ({ id, username, room }) => {
    username = username.trim().toLowerCase();
    room = room.trim().toLowerCase();
    if (!username || !room) {
        return {
            error: "Username and room required",
        };
    }

    const existingUser = users.find((user) => {
        return user.room && user.username === username;
    });

    if (existingUser)
        return {
            error: "Username is already taken",
        };

    const user = { id, username, room };
    users.push(user);
    return { user };
};

const removeUser = (id) => {
    const index = users.findIndex((user) => {
        return user.id === id;
    });

    if (index !== -1) {
        return users.splice(index, 1)[0];
    } else
        return {
            error: "User not found",
        };
};

const getUser = (id) => {
    return users.find((user) => {
        return user.id === id;
    });
};

const getUsersInRoom = (room) => {
    return users.filter((user) => user.room === room);
};

export { addUser, removeUser, getUser, getUsersInRoom };
