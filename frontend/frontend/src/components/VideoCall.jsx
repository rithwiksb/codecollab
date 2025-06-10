import React, { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const VideoCall = ({ roomId }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);

  useEffect(() => {
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

    // Get local media
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;

        stream.getTracks().forEach((track) => {
          peerConnectionRef.current.addTrack(track, stream);
        });
      })
      .catch((error) => {
        console.error("Error accessing media devices:", error);
      });

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

    // Cleanup on unmount
    return () => {
      endCall(); // Ensure cleanup when component unmounts
    };
  }, [roomId]);

  const endCall = async () => {
    // Close WebRTC connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Stop local media tracks
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      localVideoRef.current.srcObject = null;
    }

    // Disconnect Socket.IO
    if (socketRef.current) {
      socketRef.current.emit("leave", { roomId });
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Clear remote video
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Send request to backend to delete the room
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/rooms/${roomId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Failed to delete room:", response.statusText);
      } else {
        console.log("Room deleted successfully.");
      }
    } catch (error) {
      console.error("Error deleting room:", error);
    }

    console.log("Call ended and resources cleaned up.");
  };

  return (
    <div className="video-call">
      <div className="video-header">
        <h3>Video Call</h3>
      </div>
      <div className="video-streams">
        <div className="local-video-container">
          <video ref={localVideoRef} autoPlay muted playsInline></video>
          <div className="user-label">You</div>
        </div>
        <div className="remote-video-container">
          <video ref={remoteVideoRef} autoPlay playsInline></video>
          <div className="user-label">Remote</div>
        </div>
      </div>
      <div className="video-controls">
        <button
          className="video-btn"
          onClick={() =>
            localVideoRef.current.srcObject.getTracks().forEach((track) => (track.enabled = !track.enabled))
          }
        >
          <i className="fas fa-microphone"></i> Mute
        </button>
        <button
          className="video-btn"
          onClick={() =>
            localVideoRef.current.srcObject.getTracks().forEach((track) => track.stop())
          }
        >
          <i className="fas fa-video"></i> Hide Video
        </button>
      </div>
    </div>
  );
};

export default VideoCall;