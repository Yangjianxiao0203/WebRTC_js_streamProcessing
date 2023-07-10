//client1: create room send offer, candidate

const socket = io.connect("http://localhost:5003");
const returnSocket = io.connect("http://localhost:5003");
const iceServers = {
    iceServers: [
        {urls: "stun:stun.services.mozilla.com"},
        {urls:"stun:stun1.l.google.com:19302"}
      ],
}
const constraints={
    audio: false,
    video: { width: 510, height: 200 },
}

let rtcPeerConnection;
let rtcPeerConnection2;

let userStream;
let processedStream;

const userVideo=document.getElementById('user-video');
const peerVideo=document.getElementById('peer-video');
const processedPeerVideo=document.getElementById('processed-peer-video');
// const processedUserVideo=document.getElementById('processed-user-video');
const mediaButton=document.getElementById('media-button');
var roomName = 'a'
var returnRoomName = 'b'

socket.emit('joinRoom', roomName);
returnSocket.emit('joinRoom', returnRoomName);

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
    rtcPeerConnection.addIceCandidate(new RTCIceCandidate(candidate));
})


//returnSocket
returnSocket.on('offer', (offer) => {
    console.log('return client received offer: ');
    rtcPeerConnection2 = new RTCPeerConnection(iceServers);
    rtcPeerConnection2.onicecandidate = onIceCandidateFunction2;
    rtcPeerConnection2.ontrack = onAddStreamFunction2;

    // Add local tracks
    rtcPeerConnection2.addTrack(userStream.getTracks()[0], userStream);
    rtcPeerConnection2.setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => {
            return rtcPeerConnection2.createAnswer();
        })
        .then((answer) => {
            rtcPeerConnection2.setLocalDescription(answer);
            // send answer to another peer (client1)
            returnSocket.emit('answer', answer, returnRoomName);
            console.log('client1 sent answer: ', answer);
        })
        .catch((error) => {
            console.log(error);
        });
});

returnSocket.on('candidate',(candidate)=>{
    rtcPeerConnection2.addIceCandidate(new RTCIceCandidate(candidate));
})

function onIceCandidateFunction2(event){
    if(event.candidate){
        returnSocket.emit('candidate',event.candidate,returnRoomName);
        console.log("send candidate to client2: "+event.candidate)
    }
}
function onAddStreamFunction2(event) {
    processedPeerVideo.srcObject = event.streams[0];
    processedPeerVideo.onloadedmetadata = () => {
        processedPeerVideo.play();
    };
    console.log('processedPeerVideo: ', event.streams[0]);
}