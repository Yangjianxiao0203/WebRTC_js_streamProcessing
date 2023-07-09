// Client 2: Receive offer and send answer, candidate

const socket = io.connect("http://localhost:5003");
console.log("socket", socket);

const iceServers = {
    iceServers: [
        {urls: "stun:stun.services.mozilla.com"},
        {urls:"stun:stun1.l.google.com:19302"}
    ],
}
const constraints = {
    audio: false,
    video: { width: 1280, height: 720 },
}

var roomName='a';
var peerStream;
var returnRoomName='b';

let rtcPeerConnection;
let userStream;

socket.emit('joinRoom', roomName);

const userVideo=document.getElementById('user-video');
const peerVideo=document.getElementById('peer-video');
const processedVideo=document.getElementById('processed-video');

navigator.mediaDevices
    .getUserMedia(constraints)
    .then((mediaStream) => {
        userStream = mediaStream;
        const video = document.querySelector("video");
        video.srcObject = mediaStream;
        video.onloadedmetadata = () => {
            video.play();
        };
    })
    .catch((err) => {
        console.error(`${err.name}: ${err.message}`);
    });

socket.on('offer', (offer) => {
    console.log('client 2 received offer: '+offer);
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidateFunction;
    rtcPeerConnection.ontrack = onAddStreamFunction;

    // Add local tracks
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
    // rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);

    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => {
            return rtcPeerConnection.createAnswer();
        })
        .then((answer) => {
            rtcPeerConnection.setLocalDescription(answer);
            // send answer to another peer (client1)
            socket.emit('answer', answer, roomName);
        })
        .catch((error) => {
            console.log(error);
        });
});
socket.on('candidate',(candidate)=>{
    console.log('client 2 received candidate: ');
    console.log(candidate);
    rtcPeerConnection.addIceCandidate(new RTCIceCandidate(candidate));
})

function onIceCandidateFunction(event){
    if(event.candidate){
        socket.emit('candidate',event.candidate,roomName);
    }
}

function onAddStreamFunction(event) {
    peerVideo.srcObject = event.streams[0];
    peerVideo.onloadedmetadata = () => {
      peerVideo.play();
    };
    // return processed stream to client 1
    console.log("original stream: ",event.streams[0])
    peerStream = processStream(event.streams[0]);
    console.log("peerStream: ",peerStream)
    // processedVideo.srcObject = peerStream;
    processedVideo.srcObject = event.streams[0];
    processedVideo.onloadedmetadata = () => {
        processedVideo.play();
    }
}

function processStream(stream) {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    const [track] = stream.getVideoTracks();
    const {width, height} = track.getSettings();
    canvas.width = width;
    canvas.height = height;

    const outputStream = canvas.captureStream();
    
    const updateCanvas = () => {
        context.clearRect(0, 0, width, height);
        context.save();
        context.scale(-1, 1);
        context.translate(-width, 0);
        context.drawImage(video, 0, 0, width, height);
        context.restore();
        requestAnimationFrame(updateCanvas);
    };

    video.onplaying = () => {
        requestAnimationFrame(updateCanvas);
    };
    
    return outputStream;
}


// return the stream to the client 1
