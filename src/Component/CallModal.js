import React, { useState } from 'react';
import '../Css/CallModal.css';

const CallModal = ({
    isOpen,
    isVideoCall,
    onEndCall,
    onSwitchToAudio,
    onSwitchToVideo,
    localVideoRef,
    remoteVideoRef,
    onToggleMute,
    onToggleCamera
}) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);

    if (!isOpen) return null;

    const handleEndCall = () => {
        onEndCall && onEndCall();
    };

    const handleSwitchToAudio = () => {
        onSwitchToAudio && onSwitchToAudio();
    };

    const handleSwitchToVideo = () => {
        onSwitchToVideo && onSwitchToVideo();
    };

    const handleMute = () => {
        const newMuteState = !isMuted;
        setIsMuted(newMuteState);
        onToggleMute && onToggleMute(newMuteState);
    };

    const handleToggleCamera = () => {
        const newCameraState = !isCameraOff;
        setIsCameraOff(newCameraState);
        onToggleCamera && onToggleCamera(newCameraState);
    };

    return (
        <div className="call-modal-overlay">
            <div className="call-modal">
                <div className="call-modal-header">
                    <h5>{isVideoCall ? 'Video Call' : 'Audio Call'}</h5>
                    <button 
                        className="btn btn-danger" 
                        onClick={handleEndCall}
                    >
                        End Call
                    </button>
                </div>
                <div className="call-modal-body">
                    {isVideoCall ? (
                        <div className="video-call-ui">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="local-video"
                            />
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="remote-video"
                            />
                        </div>
                    ) : (
                        <div className="audio-call-ui">
                            <div className="audio-indicator">
                                <i className="bi bi-mic-fill"></i>
                                <p>Audio call in progress...</p>
                            </div>
                        </div>
                    )}
                </div>
                <div className="call-modal-footer">
                    <div className="call-controls">
                        <button 
                            className={`btn ${isMuted ? 'btn-danger' : 'btn-outline-secondary'}`}
                            onClick={handleMute}
                            title={isMuted ? "Unmute" : "Mute"}
                        >
                            <i className={`bi ${isMuted ? 'bi-mic-mute-fill' : 'bi-mic-fill'}`}></i>
                        </button>
                        
                        {isVideoCall && (
                            <button 
                                className={`btn ${isCameraOff ? 'btn-danger' : 'btn-outline-secondary'}`}
                                onClick={handleToggleCamera}
                                title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
                            >
                                <i className={`bi ${isCameraOff ? 'bi-camera-video-off-fill' : 'bi-camera-video-fill'}`}></i>
                            </button>
                        )}
                        
                        <button 
                            className="btn btn-secondary" 
                            onClick={handleSwitchToAudio}
                            disabled={!isVideoCall}
                        >
                            Switch to Audio
                        </button>
                        <button 
                            className="btn btn-secondary" 
                            onClick={handleSwitchToVideo}
                            disabled={isVideoCall}
                        >
                            Switch to Video
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CallModal;