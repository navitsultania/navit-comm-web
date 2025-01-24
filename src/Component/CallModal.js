import React from 'react';
import '../Css/CallModal.css';

const CallModal = ({ 
    isOpen, 
    isVideoCall, 
    onClose, 
    onMute, 
    onStopCamera, 
    onEndCall, 
    onSwitchToVideo, 
    onSwitchToAudio, 
    localVideoRef, 
    remoteVideoRef 
}) => {
    if (!isOpen) return null;

    return (
        <div className="call-modal-overlay">
            <div className="call-modal">
                <div className="call-modal-header">
                    <h5>{isVideoCall ? 'Video Call' : 'Audio Call'}</h5>
                    <button className="btn btn-danger" onClick={onEndCall}>End Call</button>
                </div>
                <div className="call-modal-body">
                    {isVideoCall ? (
                        <div className="video-call-ui">
                            <video ref={localVideoRef} autoPlay muted className="local-video"></video>
                            <video ref={remoteVideoRef} autoPlay className="remote-video"></video>
                        </div>
                    ) : (
                        <div className="audio-call-ui">
                            <p>Audio call in progress...</p>
                        </div>
                    )}
                </div>
                <div className="call-modal-footer">
                    <button className="btn btn-secondary" onClick={onMute}>Mute</button>
                    {isVideoCall && <button className="btn btn-secondary" onClick={onStopCamera}>Stop Camera</button>}
                    {isVideoCall ? (
                        <button className="btn btn-secondary" onClick={onSwitchToAudio}>Switch to Audio</button>
                    ) : (
                        <button className="btn btn-secondary" onClick={onSwitchToVideo}>Switch to Video</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CallModal;