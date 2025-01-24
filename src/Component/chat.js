import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CallModal from '../Component/CallModal.js'
import '../Css/ChatPage.css';
import { apiUrl } from '../Environment/Environment';

const Chat = ({ selectedUser, token }) => {
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isCalling, setIsCalling] = useState(false);
    const [isVideoCalling, setIsVideoCalling] = useState(false);
    const [isCallModalOpen, setIsCallModalOpen] = useState(false);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const connectionRef = useRef(null);
    const peerRef = useRef(null);
    const intervalRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const [incomingCall, setIncomingCall] = useState(null);
    const [isCallActive, setIsCallActive] = useState(false);
    const [localStream, setLocalStream] = useState(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!selectedUser) {
            return;
        }

        const fetchMessages = async () => {
            try {
                const response = await axios.get(`${apiUrl}/ChatMessage/receive/${selectedUser.id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const newMessages = response.data.userMessages;
                setMessages(prevMessages => {
                    if (newMessages.length > prevMessages.length || newMessages.some((msg, index) => msg.content !== prevMessages[index].content)) {
                        return newMessages;
                    }
                    return prevMessages;
                });
                setIsTyping(response.data.isTyping);
                setIsCalling(response.data.isAudioCalling)
                setIsVideoCalling(response.data.isVideoCalling);
                setIncomingCall(isCalling ? true : isVideoCalling)
            } catch (error) {
                console.error('Error fetching messages:', error);
                setError('Failed to fetch messages. Please try again.');
            }
        };

        fetchMessages();
        intervalRef.current = setInterval(fetchMessages, 2000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            cleanupCall();
        };
    }, [selectedUser, token]); 

    const cleanupCall = () => {
        // Stop local stream tracks
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }

        // Clear video elements
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
        
        // Close peer connection
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
        
        // Reset states
        setIsCalling(false);
        setIsCallActive(false);
        setIsVideoCalling(false);
        setIncomingCall(null);
        startCall(false,false);
    };

    // Message handling functions
    const handleFileSelect = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleFileUpload = async () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await axios.post(`${apiUrl}/ChatMessage/upload/${selectedUser.id}`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            setMessages(prevMessages => [...prevMessages, {
                receiverId: selectedUser.id,
                keyName: selectedFile.name,
                content: null,
                dateTime: new Date().toISOString()
            }]);

            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            setError('Failed to upload file. Please try again.');
        }
    };

    const handleFileDownload = async (msg) => {
        try {
            const response = await axios.get(`${apiUrl}/ChatMessage/download/${msg.documnetKey}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', msg.fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading file:', error);
            setError('Failed to download file. Please try again.');
        }
    };

    const setIsType = (value) => {
        axios.post(`${apiUrl}/ChatMessage/typingStatus/${selectedUser.id}/${value}`, null, {
            headers: {
                Authorization: `Bearer ${token}`
            },
        });
    };

    const handleSendMessage = async () => {
        if (!message.trim() && !selectedFile) return;

        if (selectedFile) {
            await handleFileUpload();
        }

        if (message.trim()) {
            try {
                await axios.post(`${apiUrl}/ChatMessage/send`, {
                    reciver: selectedUser.id,
                    messageContent: message,
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setMessage('');
                setError('');
            } catch (error) {
                console.error('Error sending message:', error);
                setError('Failed to send message. Please try again.');
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    const startCall = (isAudio,isVideo) => {
        axios.post(`${apiUrl}/ChatMessage/setCallingStatus/${selectedUser.id}`, null, {
            params: {
                IsAudio: isAudio,
                IsVideo: isVideo
            },
            headers: {
                Authorization: `Bearer ${token}`
            },
        });
        setIsCallModalOpen(true);
    }
    const callPickup = (isVideo) => {
        setIsCallActive(true);
        setIsCallModalOpen(true);
    }

    const handleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
        }
    };

    const handleStopCamera = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
        }
    };

    const handleEndCall = () => {
        cleanupCall();
        setIsCallModalOpen(false);
    };

    const handleSwitchToVideo = async () => {
        if (localStream) {
            const videoTrack = await navigator.mediaDevices.getUserMedia({ video: true });
            const sender = connectionRef.current.getSenders().find(s => s.track.kind === 'video');
            sender.replaceTrack(videoTrack.getVideoTracks()[0]);
            setIsVideoCalling(true);
        }
    };

    const handleSwitchToAudio = async () => {
        if (localStream) {
            const audioTrack = await navigator.mediaDevices.getUserMedia({ audio: true });
            const sender = connectionRef.current.getSenders().find(s => s.track.kind === 'video');
            sender.replaceTrack(audioTrack.getAudioTracks()[0]);
            setIsVideoCalling(false);
        }
    };

    const renderMessageContent = (msg) => {
        if (msg.documnetKey && (!msg.content || msg.content.trim() === '' || msg.content === null)) {
            return (
                <div className="file-message d-flex align-items-center">
                    <i className="bi bi-file-earmark me-2"></i>
                    <span
                        className="file-link"
                        onClick={() => handleFileDownload(msg)}
                        style={{
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            color: msg.receiverId === selectedUser.id ? 'white' : '#0d6efd'
                        }}
                    >
                        {msg.fileName}
                    </span>
                </div>
            );
        }
        return msg.content ? <div className="message-content">{msg.content}</div> : null;
    };

    return (
        <div className="container-fluid mt-5 pt-3">
            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-6">
                    <div className="card shadow" style={{ height: 'calc(100vh - 100px)' }}>
                        {/* Chat Header */}
                        <div className="card-header bg-white p-3 border-bottom">
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center">
                                    <div className="position-relative">
                                        <div className="rounded-circle bg-secondary d-flex justify-content-center align-items-center"
                                            style={{ width: '40px', height: '40px', backgroundColor: '#e9ecef' }}>
                                            <span className="text-dark" style={{ fontSize: '1.2rem' }}>
                                                {selectedUser.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <span className="position-absolute bottom-0 end-0">
                                            <span className="badge bg-success rounded-circle p-1"
                                                style={{ width: '12px', height: '12px' }}>
                                            </span>
                                        </span>
                                    </div>
                                    <div className="ms-3">
                                        <h6 className="mb-0">{selectedUser.name}</h6>
                                        <small className="text-muted">
                                            {selectedUser.isOnline ? 'Online' : 'Offline'}
                                        </small>
                                        {!selectedUser.isOnline && (
                                            <small className="text-muted">
                                                {` • Last seen ${new Date(selectedUser.lastOnline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                            </small>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <button
                                        className={`btn btn-light btn-sm rounded-circle me-2 ${isCalling ? 'calling wave-animation' : ''}`}
                                        onClick={() => { if (!isCalling) { startCall(true, false); } else { callPickup(false); } }}
                                        disabled={(isCallActive || isVideoCalling) && !isCalling}
                                    >
                                        {isCalling && <span className="wave-animation"></span>}
                                        <i className="bi bi-telephone"></i>
                                    </button>
                                    <button
                                        className={`btn btn-light btn-sm rounded-circle me-2 ${isVideoCalling && !isCalling ? 'video-calling wave-animation' : ''}`}
                                        onClick={() => { if (!isVideoCalling) { startCall(false, true); } else { callPickup(true); } }}
                                        disabled={(isCalling || isCallActive) && !isVideoCalling}
                                    >
                                        {isVideoCalling && <span className="wave-animation"></span>}
                                        <i className="bi bi-camera-video"></i>
                                    </button>
                                    <button className="btn btn-light btn-sm rounded-circle">
                                        <i className="bi bi-three-dots-vertical"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="card-body p-4" style={{
                            overflowY: 'auto',
                            height: 'calc(100% - 140px)',
                            backgroundColor: '#f8f9fa'
                        }}>
                            {error && <div className="alert alert-danger">{error}</div>}
                            <div className="chat-messages">
                                {messages.map((msg, index) => (
                                    <div key={index} className={`d-flex ${msg.receiverId === selectedUser.id ? 'justify-content-end' : 'justify-content-start'} mb-3`}>
                                        {msg.receiverId !== selectedUser.id && (
                                            <div className="me-2">
                                                <div className="rounded-circle bg-secondary d-flex justify-content-center align-items-center"
                                                    style={{ width: '32px', height: '32px', backgroundColor: '#e9ecef' }}>
                                                    <span className="text-dark" style={{ fontSize: '0.8rem' }}>
                                                        {selectedUser.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        {/* Only render message bubble if there's content or keyName */}
                                        {(msg.content || msg.documnetKey) && (
                                            <div className={`${msg.receiverId === selectedUser.id ? 'bg-primary text-white' : 'bg-white'} rounded-3 p-3 shadow-sm`}
                                                style={{ maxWidth: '75%', position: 'relative' }}>
                                                {renderMessageContent(msg)}
                                                <small className={`${msg.receiverId === selectedUser.id ? 'text-white-50' : 'text-muted'} d-block mt-1`} style={{ fontSize: '0.7rem' }}>
                                                    {new Date(msg.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </small>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="d-flex justify-content-start mb-3">
                                        <div className="bg-white rounded-3 p-3 shadow-sm">
                                            <div className="typing-indicator">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Message Input */}
                        <div className="card-footer bg-white border-top-0 p-3">
                            <div className="input-group">
                                <button className="btn btn-light border rounded-circle me-2" type="button">
                                    <i className="bi bi-emoji-smile"></i>
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />
                                <button
                                    className="btn btn-light border rounded-circle me-2"
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <i className="bi bi-paperclip"></i>
                                </button>
                                <textarea
                                    className="form-control rounded-pill bg-light border-0"
                                    placeholder={selectedFile ? `Selected file: ${selectedFile.name}` : "Type a message..."}
                                    value={message}
                                    onChange={(e) => {
                                        setMessage(e.target.value);
                                        setIsType(true);
                                    }}
                                    onBlur={() => setIsType(false)}
                                    onKeyDown={handleKeyPress}
                                    onKeyUp={() => setIsType(false)}
                                    rows="1"
                                    style={{ resize: 'none' }}
                                />
                                <button
                                    className="btn btn-primary rounded-circle ms-2"
                                    onClick={handleSendMessage}
                                    disabled={!message.trim() && !selectedFile}
                                >
                                    <i className="bi bi-send"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <CallModal
                isOpen={isCallModalOpen}
                isVideoCall={isVideoCalling}
                onClose={() => setIsCallModalOpen(false)}
                onMute={handleMute}
                onStopCamera={handleStopCamera}
                onEndCall={handleEndCall}
                onSwitchToVideo={handleSwitchToVideo}
                onSwitchToAudio={handleSwitchToAudio}
                localVideoRef={localVideoRef}
                remoteVideoRef={remoteVideoRef}
            />
        </div>
    );
};

export default Chat;