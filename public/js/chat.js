const socket = io();

//Elements
const messageForm = document.querySelector("#inputForm");
const sendLocationButton = document.querySelector("#sendLocation");
const formTextbox = document.querySelector("#inputText");
const formButton = messageForm.querySelector("button");
const messages = document.querySelector("#messages");

//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//Options
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
});

const autoScroll = () => {
    const newMessage = messages.lastElementChild;

    const newMessageStyles = getComputedStyle(newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

    const visibleHeight = messages.offsetHeight;

    const containerHeight = messages.scrollHeight;

    const scrollOffset = messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight;
    }
};

socket.on("message", (welcomeMsg) => {
    const html = Mustache.render(messageTemplate, {
        username: welcomeMsg.username,
        message: welcomeMsg.text,
        createdAt: moment(welcomeMsg.createdAt).format("h:mm a"),
    });
    messages.insertAdjacentHTML("beforeend", html);
    autoScroll();
});

socket.on("locationMessage", (locationUrl) => {
    const html = Mustache.render(locationTemplate, {
        username: locationUrl.username,
        location: locationUrl.url,
        createdAt: moment(locationUrl.createdAt).format("h:mm a"),
    });
    messages.insertAdjacentHTML("beforeend", html);
    autoScroll();
});

socket.on("roomData", ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, { room, users });
    document.querySelector("#sidebar").innerHTML = html;
});

messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    formButton.setAttribute("disabled", "disabled");
    socket.emit("sendMessage", formTextbox.value, (error) => {
        formButton.removeAttribute("disabled");
        formTextbox.value = "";
        formTextbox.focus();
        if (error) {
            return console.log(error);
        }
    });
});

sendLocationButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser");
    }
    sendLocationButton.setAttribute("disabled", "disabled");
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit(
            "sendPosition",
            {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            },
            () => {
                sendLocationButton.removeAttribute("disabled");
            }
        );
    });
});

socket.emit("join", { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = "/";
    }
});
