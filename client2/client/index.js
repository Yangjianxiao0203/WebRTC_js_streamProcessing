// Client 2: Receive offer and send answer, candidate

const socket = io.connect("http://localhost:5003");
const returnSocket = io.connect("http://localhost:5003");

const iceServers = {
    iceServers: [
        {urls: "stun:stun.services.mozilla.com"},
        {urls:"stun:stun1.l.google.com:19302"}
    ],
}
const constraints = {
    audio: false,
    video: { width: 510, height: 200 },
}

var roomName='a';
var peerStream;
var returnRoomName='b';

let rtcPeerConnection;
let rtcPeerConnection2;
let userStream;

socket.emit('joinRoom', roomName);

const userVideo=document.getElementById('user-video');
const peerVideo=document.getElementById('peer-video');
const processedVideo=document.getElementById('processed-video');
const processedReturnVideo=document.getElementById('processed-return-video');

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
    // console.log('client 2 received offer: '+offer);
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
    // console.log('client 2 received candidate: ');
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
    processedVideo.srcObject = peerStream;
    processedVideo.onloadedmetadata = () => {
        processedVideo.play();
    }
    returnSocket.emit('joinRoom', returnRoomName);
    startReturnCall();
}


// return the stream to the client 1, use returnRoomName to rebuild a new peer connection
function onIceCandidateFunction2(event){
    if(event.candidate){
        returnSocket.emit('candidate',event.candidate,returnRoomName);
    }
}

function onAddStreamFunction2(event) {
    processedReturnVideo.srcObject = event.streams[0];
    processedReturnVideo.onloadedmetadata = () => {
        processedReturnVideo.play();
    };
}

returnSocket.on('answer',(answer)=>{
    rtcPeerConnection2.setRemoteDescription(new RTCSessionDescription(answer));
    console.log("return answer received: ",answer);
})

returnSocket.on('candidate',(candidate)=>{
    rtcPeerConnection2.addIceCandidate(new RTCIceCandidate(candidate));
})

function startReturnCall() {
    rtcPeerConnection2 = new RTCPeerConnection(iceServers);
    rtcPeerConnection2.onicecandidate = onIceCandidateFunction2;
    rtcPeerConnection2.ontrack = onAddStreamFunction2;
    // Add local processed stream
    console.log("userStream.getTracks: ",userStream.getTracks()[0])
    console.log("peerStream.getTracks: ",peerStream.getTracks()[0])
    rtcPeerConnection2.addTrack(peerStream.getTracks()[0], peerStream);
    // Create offer
    rtcPeerConnection2.createOffer()
        .then((offer) => {
            rtcPeerConnection2.setLocalDescription(offer);
            // send offer to another peer (client1)
            returnSocket.emit('offer', offer, returnRoomName);
            // console.log("return offer sent: ",offer);
        })
        .catch((error) => {
            console.log(error);
        });
}


function processStream(stream) {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    // Assuming video is 510x200
    canvas.width = 510;
    canvas.height = 200;

    video.addEventListener('play', function() {
        function draw() {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            let imageData = context.getImageData(0, 0, canvas.width, canvas.height);

            // Set left half of the image to black
            for(let y = 0; y < canvas.height; y++) {
                for(let x = 0; x < canvas.width / 2; x++) {
                    const index = (y * canvas.width + x) * 4;
                    imageData.data[index + 0] = 0; // R value
                    imageData.data[index + 1] = 0; // G value
                    imageData.data[index + 2] = 0; // B value
                    imageData.data[index + 3] = 255; // A value
                }
            }

            context.putImageData(imageData, 0, 0);
            requestAnimationFrame(draw);
        }

        draw();
    });

    return canvas.captureStream();
}




