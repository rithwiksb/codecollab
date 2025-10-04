import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import mediaStreamManager from "../utils/mediaManager";

const VideoCall = ({ roomId }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  
  // State for media controls
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    initializeVideoCall();
    
    // Add beforeunload listener to cleanup on browser close/navigation
    const handleBeforeUnload = () => {
      cleanup();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Cleanup when component unmounts or roomId changes
    return () => {
      cleanup();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roomId]);

  // Synchronous cleanup function for component unmount
  const cleanup = () => {
    console.log("VideoCall component unmounting - cleaning up resources...");
    
    // Use global media stream manager to stop ALL active streams
    mediaStreamManager.stopAllStreams();
    
    // Clear local references
    localStreamRef.current = null;

    // Force clear video elements immediately
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
      localVideoRef.current.load(); // Force reload to clear any cached media
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
      remoteVideoRef.current.load();
    }

    // Close WebRTC connection
    if (peerConnectionRef.current) {
      // Close all transceivers
      peerConnectionRef.current.getTransceivers().forEach(transceiver => {
        if (transceiver.stop) {
          transceiver.stop();
        }
      });
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Disconnect Socket.IO
    if (socketRef.current) {
      socketRef.current.emit("leave", { roomId });
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    console.log("VideoCall cleanup completed using global media manager.");
  };

  const initializeVideoCall = async () => {
    try {
      // Initialize Socket.IO
      socketRef.current = io("http://localhost:5000", {
        query: { token: localStorage.getItem("token") },
      });

      // Join the room
      socketRef.current.emit("join", { roomId });

      // Initialize WebRTC
      const config = {
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302",
          },
        ],
      };

      peerConnectionRef.current = new RTCPeerConnection(config);

      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit("ice-candidate", {
            roomId,
            candidate: event.candidate,
          });
        }
      };

      // Handle remote stream
      peerConnectionRef.current.ontrack = (event) => {
        remoteVideoRef.current.srcObject = event.streams[0];
      };

      // Get local media - this will be automatically tracked by mediaStreamManager
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      localStreamRef.current = stream;
      localVideoRef.current.srcObject = stream;
      setIsConnected(true);
      
      console.log('Media stream created, active count:', mediaStreamManager.getActiveCount());

      // Add tracks to peer connection
      stream.getTracks().forEach((track) => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      // Setup socket event listeners
      setupSocketListeners();

    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  const setupSocketListeners = () => {
    // Handle incoming offers
    socketRef.current.on("video-offer", (data) => {
      peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(data.offer)
      );

      peerConnectionRef.current
        .createAnswer()
        .then((answer) => {
          peerConnectionRef.current.setLocalDescription(answer);

          socketRef.current.emit("video-answer", {
            roomId,
            targetUserId: data.userId,
            answer,
          });
        })
        .catch((error) => {
          console.error("Error creating answer:", error);
        });
    });

    // Handle incoming ICE candidates
    socketRef.current.on("ice-candidate", (data) => {
      peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
    });
  };

  // Toggle audio mute/unmute
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle video on/off - Use enable/disable instead of stop/start
  const toggleVideo = () => {
    if (!localStreamRef.current) return;

    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      // Toggle the video track enabled state
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
      
      console.log(videoTrack.enabled ? "Video turned on" : "Video turned off");
    }
  };

  const endCall = () => {
    console.log("Manually ending call...");
    
    // Use the same cleanup function
    cleanup();
    
    // Reset state (only needed for manual end call)
    setIsConnected(false);
    setIsAudioMuted(false);
    setIsVideoOff(false);

    console.log("Call ended manually.");
  };

  return (
    <div className="video-call">
      <div className="video-header">
        <h3>Video Call</h3>
        <div className="connection-status">
          {isConnected ? (
            <span style={{ color: 'green' }}>● Connected</span>
          ) : (
            <span style={{ color: 'orange' }}>● Connecting...</span>
          )}
        </div>
      </div>
      <div className="video-streams">
        <div className="local-video-container">
          <video 
            ref={localVideoRef} 
            autoPlay 
            muted 
            playsInline 
            style={{ display: isVideoOff ? 'none' : 'block' }}
          ></video>
          {isVideoOff && (
            <div className="video-off-placeholder">
              <i className="fas fa-video-slash" style={{ fontSize: '2rem', color: '#666' }}></i>
              <div>Video Off</div>
            </div>
          )}
          <div className="user-label">You</div>
        </div>
        <div className="remote-video-container">
          <video ref={remoteVideoRef} autoPlay playsInline></video>
          <div className="user-label">Remote</div>
        </div>
      </div>
      <div className="video-controls">
        <button
          className={`video-btn ${isAudioMuted ? 'muted' : ''}`}
          onClick={toggleAudio}
          title={isAudioMuted ? 'Unmute' : 'Mute'}
        >
          <i className={`fas ${isAudioMuted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
          {isAudioMuted ? ' Unmute' : ' Mute'}
        </button>
        <button
          className={`video-btn ${isVideoOff ? 'video-off' : ''}`}
          onClick={toggleVideo}
          title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
        >
          <i className={`fas ${isVideoOff ? 'fa-video-slash' : 'fa-video'}`}></i>
          {isVideoOff ? ' Video On' : ' Video Off'}
        </button>
        <button
          className="video-btn end-call"
          onClick={endCall}
          title="End Call"
          style={{ backgroundColor: '#dc3545', color: 'white' }}
        >
          <i className="fas fa-phone-slash"></i> End Call
        </button>
      </div>
    </div>
  );
};

export default VideoCall;