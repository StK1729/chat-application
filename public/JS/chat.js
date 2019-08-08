// @ts-ignore
const socket = io();

//Elements
const $sendMessage = document.getElementById("send-message");
const $sendLocation = document.getElementById("send-location");
const $formButton = document.getElementById("submit");
const $messageFormInput = document.getElementById("chat");
const $messages = document.getElementById("messages-container");
const sidebar = document.getElementById("sidebar");

// Templates
const messageTemplate = document.getElementById("message-template").innerHTML;
const iframeTemplate = document.getElementById("iframe-template").innerHTML;
const sidebarTemplate = document.getElementById("sidebar-template").innerHTML;

//Options

const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true});

const autoscroll = () => {
    // New message Element
    const $newMessage = $messages.lastElementChild;
    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // Visible height
    const visibleHeight = $messages.offsetHeight;

    // Height of messages container
    const containerHeight = $messages.scrollHeight;

    // How far have I scrolled
    
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight;
    }

}

$sendMessage.addEventListener("submit", function(event){
    event.preventDefault();
    if(!$messageFormInput.value){
        return
    }
    $formButton.setAttribute("disabled", "disabled");
    const message = $messageFormInput.value;
    socket.emit("sendMessage", message, (responseFromServer)=>{
        $formButton.removeAttribute("disabled");
        console.log(responseFromServer);
    });
    $messageFormInput.value = "";
    $messageFormInput.focus();
})

$sendLocation.addEventListener("click", ()=>{
    if(!navigator.geolocation){
        return alert("Geolocation isn't supported by your browser");
    }
    $sendLocation.setAttribute("disabled", true);
    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit("sendLocation",{
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (responseFromServer)=>{
            $sendLocation.removeAttribute("disabled");
            console.log(responseFromServer);
        })
    })
})

socket.on("message", (message)=>{
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        time: moment(message.timestamp).format("hh:mm a")
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
})

socket.on("locationMessage", (location)=>{
    const html = Mustache.render(iframeTemplate, {
        username: location.username,
        locationUrl: location.url,
        time: moment(location.timestamp).format("hh:mm a")
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
})

socket.on("roomData", ({room, users})=> {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    sidebar.innerHTML = html;
})

socket.on("userDisconnected", (message)=>{
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        time: moment(message.timestamp).format("hh:mm a")
    });
    $messages.insertAdjacentHTML("beforeend", html);
})

socket.emit("join", {
    username,
    room
}, (error) => {
    alert(error);
    location.href = "/";
})