//client1: create room send offer, candidate

const socket = io.connect("http://localhost:5003");
console.log("socket",socket);
const iceServers = {
    iceServers: [
        {urls: "stun:stun.services.mozilla.com"},
        {urls:"stun:stun1.l.google.com:19302"}
      ],
}
const constraints={
    audio: false,
    video: { width: 1280, height: 720 },
}

let rtcPeerConnection;
let userStream;
const userVideo=document.getElementById('user-video');
const peerVideo=document.getElementById('peer-video');
const mediaButton=document.getElementById('media-button');
var roomName = 'a'

socket.emit('joinRoom', roomName);

mediaButton.addEventListener('click',()=>{
    navigator.mediaDevices
    .getUserMedia(constraints)
    .then((mediaStream) => {
        console.log('client1 media: ', mediaStream);
        userStream = mediaStream;
        const video = document.querySelector("video");
        video.srcObject = mediaStream;
        video.onloadedmetadata = () => {
            video.play();
        };

        startCall();
    })
    .catch((err) => {
        // always check for errors at the end.
        console.error(`${err.name}: ${err.message}`);
    });
})

function startCall() {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidateFunction;
    rtcPeerConnection.ontrack = onAddStreamFunction;
    // Add local tracks
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
    // rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);

    // Create offer
    rtcPeerConnection.createOffer()
        .then((offer) => {
            rtcPeerConnection.setLocalDescription(offer);
            // send offer to another peer (client2)
            socket.emit('offer', offer, roomName);
            console.log('client1 offer: ', offer);
        })
        .catch((error) => {
            console.log(error);
        });
}


function onIceCandidateFunction(event){
    if(event.candidate){
        socket.emit('candidate',event.candidate,roomName);
        console.log("send candidate to client2: "+event.candidate)
    }
}
function onAddStreamFunction(event) {
    peerVideo.srcObject = event.streams[0];
    peerVideo.onloadedmetadata = () => {
      peerVideo.play();
    };
}

socket.on('answer',(ans)=>{
    console.log('client received answer');
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(ans));
})
socket.on('candidate',(candidate,roomName)=>{
    console.log('client received candidate: ');
    console.log(candidate);
    rtcPeerConnection.addIceCandidate(new RTCIceCandidate(candidate));
})