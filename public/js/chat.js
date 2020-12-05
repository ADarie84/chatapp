const messageform = document.querySelector('#message-form');
const messageInput = messageform.elements.message;
const messageButton = messageform.querySelector('button');
const locationButton = document.querySelector('#send-location');
const messages = document.querySelector('#messages');

const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebarTemplate').innerHTML;

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const socket = io();

const autoscroll = () => {
    //get new message
    const newMessage = messages.lastElementChild;

    //get hight of new message
    const newMessageStyles = getComputedStyle(newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

    const visibleHeight = messages.offsetHeight;
    //height of messages container
    const conentHeight = messages.scrollHeight;
    //how far have I scrolled
    const scrollOffset = messages.scrollTop + visibleHeight;

    if (conentHeight - newMessageHeight <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight;
    }
};

socket.on('message', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('HH:mm:ss')
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('locationMessage', (url) => {
    console.log(url);    
    const html = Mustache.render(locationTemplate, {
        username: url.username,
        url: url.url,
        createdAt: moment(url.createdAt).format('HH:mm:ss')
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });

    document.querySelector('#sidebar').innerHTML = html;
});

messageform.addEventListener('submit', (e) => {
    e.preventDefault();
    messageButton.setAttribute('disabled', 'disabled');
    const message = messageInput.value;
    socket.emit('sendMessage', message, (error) => {
        messageButton.removeAttribute('disabled');
        messageInput.value = '';
        messageInput.focus();

        if (error) {
            return console.log(error);
        }

        console.log('The message was delivered')
    });
});

locationButton.addEventListener('click', (e) => {
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser');
    }

    locationButton.setAttribute('disabled', 'disabled');
    navigator.geolocation.getCurrentPosition((position) => {         
        socket.emit('sendLocation', { 
            latitude: position.coords.latitude, 
            longitude: position.coords.longitude 
        }, () => {
            locationButton.removeAttribute('disabled');
            console.log('Location Shared')
        });
    });
});

socket.emit('join', {
    username,
    room
}, (error) => {
    if (error) {
        alert(error);
        location.href = '/'
    }
});