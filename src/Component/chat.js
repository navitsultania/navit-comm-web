import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { HubConnectionBuilder, HttpTransportType, LogLevel } from '@microsoft/signalr';
import Peer from 'simple-peer';
import CallModal from '../Component/CallModal.js';
import '../Css/ChatPage.css';
import { apiUrl } from '../Environment/Environment';
import moment from 'moment-timezone';

const Chat = ({ selectedUser, token }) => {
    // Core state
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    
    // Call states
    const [isCalling, setIsCalling] = useState(false);
    const [isVideoCalling, setIsVideoCalling] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(false);
    const [isCallModalOpen, setIsCallModalOpen] = useState(false);
    const [isCallActive, setIsCallActive] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const [hubConnection, setHubConnection] = useState(null);
    const [signalData, setSignalData] = useState(null);
    
    // Refs
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerRef = useRef(null);
    const intervalRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Initialize SignalR connection for real-time communication
    useEffect(() => {
        const createHubConnection = async () => {
            const connection = new HubConnectionBuilder()
                .withUrl(`${apiUrl}/chathub`,{
                    accessTokenFactory: () => token,
                    skipNegotiation: false, // Add this
                    transport: HttpTransportType.WebSockets
                }).configureLogging(LogLevel.Debug)
                .withAutomaticReconnect([0, 2000, 5000, 10000, null])
                .build();
    
            try {
                connection.onreconnecting((error) => {
                    console.log('Reconnecting due to error:', error);
                });
        
                connection.onreconnected((connectionId) => {
                    console.log('Reconnected with ID:', connectionId);
                });
                await connection.start();
                console.log("SignalR connected.");
                const userId = getUserIdFromToken(token);
                // Register user
                await connection.invoke("RegisterUser", userId); // Update with actual user ID
    
                // Handle incoming signals
                connection.on("ReceiveSignal", async (signal) => {
                    if (signal.type === "offer") {
                        // Handle incoming call
                        setIsVideoCalling(signal.isVideo);
                        setIsCalling(!signal.isVideo);
                        setSignalData(signal.signal);
                    } else if (peerRef.current) {
                        // Handle ongoing call signals
                        peerRef.current.signal(signal);
                    }
                });
    
                setHubConnection(connection);
            } catch (err) {
                console.error("Error establishing SignalR connection:", err);
            }
        };
    
        createHubConnection();
    
        return () => {
            if (hubConnection) {
                hubConnection.stop();
            }
        };
    }, []);
    const getUserIdFromToken = (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            const payload = JSON.parse(jsonPayload);
            return payload.nameid || payload.sub;
        } catch (e) {
            console.error("Error parsing token:", e);
            return "1"; // Fallback ID
        }
    };
    // Handle media stream acquisition
    const getMediaStream = async (isVideo) => {
        try {
            // Close any existing stream first
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: true, 
                video: isVideo 
            });
            
            // Set the stream to the local video element
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            
            setLocalStream(stream);
            return stream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            setError('Failed to access camera/microphone. Please check your permissions.');
            throw error;
        }
    };

    // Fetch messages
    useEffect(() => {
        if (!selectedUser) return;

        const fetchMessages = async () => {
            try {
                const response = await axios.get(`${apiUrl}/ChatMessage/receive/${selectedUser.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                
                const newMessages = response.data.userMessages;
                setMessages(prevMessages => {
                    // Only update if there are new messages or changes
                    if (newMessages.length > prevMessages.length || 
                        newMessages.some((msg, idx) => idx < prevMessages.length && msg.content !== prevMessages[idx].content)) {
                        return newMessages;
                    }
                    return prevMessages;
                });
                
                // Update status flags
                setIsTyping(response.data.isTyping);
                setIsCalling(response.data.isAudioCalling);
                setIsVideoCalling(response.data.isVideoCalling);
            } catch (error) {
                console.error('Error fetching messages:', error);
                setError('Failed to load messages. Please try again.');
            }
        };

        fetchMessages();
        intervalRef.current = setInterval(fetchMessages, 50000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [selectedUser, token]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Call initialization for outgoing calls
    const initializeCall = async (isVideo) => {
        try {
            const stream = await getMediaStream(isVideo);
            
            const newPeer = new Peer({
                initiator: true,
                trickle: false,
                stream: stream
            });

            // Handle connection events
            newPeer.on('connect', () => {
                console.log('Peer connection established');
                setIsCallActive(true);
            });

            newPeer.on('signal', async (signal) => {
                if (hubConnection) {
                    console.log("Sending signal:", {
                        userId: selectedUser.id,
                        signal,
                        isVideo
                    });
                    const signalData = {
                        TargetUserId : selectedUser.id,
                        Type: "offer",
                        Signal: signal, // Ensure signal is serializable
                        IsVideo : isVideo
                    };
                    try {
                        await hubConnection.invoke("SendSignal", selectedUser.id.toString(), JSON.stringify(signal));
                    } catch (error) {
                        console.error("Error invoking SendSignal:", error);
                    }
                }
            });

            newPeer.on('stream', remoteStream => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;
                }
            });

            newPeer.on('error', (err) => {
                console.error('Peer error:', err);
                cleanupCall();
            });

            peerRef.current = newPeer;
            setIsCallActive(true);
            return newPeer;
        } catch (error) {
            console.error('Error initializing call:', error);
            setError('Failed to start call. Please check your device permissions.');
            throw error;
        }
    };

    // Handle incoming call
    const handleIncomingCall = async (incomingSignalData, isVideo) => {
        try {
            const stream = await getMediaStream(isVideo);
            
            const newPeer = new Peer({
                initiator: false,
                trickle: false,
                stream: stream
            });

            // Set up peer connection handlers
            newPeer.on('connect', () => {
                console.log('Peer connection established for incoming call');
                setIsCallActive(true);
            });
            
            newPeer.on('stream', (remoteStream) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;
                }
            });

            newPeer.on('signal', async (signal) => {
                if (hubConnection) {
                    await hubConnection.invoke("SendSignal", selectedUser.id, signal);
                }
            });

            newPeer.on('error', (err) => {
                console.error('Peer error in incoming call:', err);
                cleanupCall();
            });

            // Signal the peer with the incoming data
            newPeer.signal(incomingSignalData);
            peerRef.current = newPeer;
            setIsCallActive(true);
            return newPeer;
        } catch (error) {
            cleanupCall();
            console.error('Error handling incoming call:', error);
            setError('Failed to answer call. Please check your device permissions.');
            throw error;
        }
    };

    // Clean up call resources
    const cleanupCall = async () => {
        try {           

            // Clear video elements
            if (localVideoRef.current) {
                localVideoRef.current = null;
            }
            if (remoteVideoRef.current) {
                remoteVideoRef.current = null;
            }

            // Destroy peer connection
            if (peerRef.current) {
                peerRef.current.destroy();
                peerRef.current = null;
            }

            // Reset call states
            setIsCalling(false);
            setIsCallActive(false);
            setIsVideoCalling(false);
            setSignalData(null);
            setIsCallModalOpen(false);
            
            if (localStream) {
                try {
                    const tracks = localStream.getTracks();
                    console.log('Tracks to clean up:', tracks.length);
                    
                    // Stop each track individually with error handling
                    for (let i = 0; i < tracks.length; i++) {
                        try {
                            const track = tracks[i];
                            if (track && typeof track.stop === 'function') {
                                track.stop();
                                console.log(`Stopped track ${i} of type ${track.kind}`);
                            }
                        } catch (trackError) {
                            console.error(`Error stopping track ${i}:`, trackError);
                        }
                    }
                } catch (streamError) {
                    console.error('Error accessing stream tracks:', streamError);
                }
                
                // Set localStream to null after cleanup
                setLocalStream(null);
            }
            
            // Notify server that call has ended
            await axios.post(`${apiUrl}/ChatMessage/setCallingStatus/${selectedUser.id}`, null, {
                params: {
                    IsAudio: false,
                    IsVideo: false
                },
                headers: {
                    Authorization: `Bearer ${token}`
                },
            });
        } catch (error) {
            console.error('Error cleaning up call:', error);
        }
    };

    // Start outgoing call
    const startCall = async (isAudio, isVideo) => {
        try {
            // Update calling status on server
            await axios.post(`${apiUrl}/ChatMessage/setCallingStatus/${selectedUser.id}`, null, {
                params: {
                    IsAudio: isAudio,
                    IsVideo: isVideo
                },
                headers: {
                    Authorization: `Bearer ${token}`
                },
            });
            
            if (isAudio || isVideo) {
                setIsVideoEnabled(isVideo);
                setIsCallModalOpen(true);
                await initializeCall(isVideo);
            }
        } catch (error) {
            console.error('Error starting call:', error);
            setError('Failed to initiate call. Please try again.');
        }
    };

    // Answer incoming call
    const callPickup = async (isVideo) => {
        if (!signalData) {
            setError('Call information missing. Please try again.');
            return;
        }
        
        try {
            setIsVideoEnabled(isVideo);
            await handleIncomingCall(signalData, isVideo);
            setIsCallModalOpen(true);
        } catch (error) {
            console.error('Error answering call:', error);
            setError('Failed to connect call. Please try again.');
        }
    };

    const handleEndCall = () => {
        try {
            debugger;
            // 1. First detach from DOM
            if (localVideoRef.current) {
                localVideoRef.current = null;
            }
            if (remoteVideoRef.current) {
                remoteVideoRef.current = null;
            }
            
            // 2. Wait a moment to ensure stream detachment takes effect
            setTimeout(() => {
                // 3. Now properly terminate the peer connection
                if (peerRef.current) {
                    try {
                        // Keep only destroy, don't call removeAllListeners
                        peerRef.current.destroy();
                        peerRef.current = null;
                    } catch (e) {
                        console.error("Error destroying peer:", e);
                    }
                }
                
                // 4. Then stop tracks and clean up
                if (localStream) {
                    try {
                        localStream.getTracks().forEach(track => {
                            if (track && track.readyState === 'live') {
                                track.stop();
                            }
                        });
                    } catch (e) {
                        console.error("Error stopping tracks:", e);
                    }
                    setLocalStream(null);
                }
                
                // 5. Reset all state
                setIsCallActive(false);
                setIsCalling(false);
                setIsVideoCalling(false);
                setSignalData(null);
                setIsCallModalOpen(false);
                
                // 6. Notify server last
                axios.post(`${apiUrl}/ChatMessage/setCallingStatus/${selectedUser.id}`, null, {
                    params: {
                        IsAudio: false,
                        IsVideo: false
                    },
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                }).catch(e => console.error("Error notifying server:", e));
                
            }, 100); // Small delay to ensure DOM updates take effect
        } catch (error) {
            console.error('Error handling call end:', error);
            // Ensure modal still closes even if there's an error
            setIsCallModalOpen(false);
        }
    };
    // Handle media track toggles
    const toggleAudio = (mute) => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !mute;
            });
        }
    };

    const toggleVideo = (turnOff) => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !turnOff;
            });
        }
    };

    // Switch between audio and video modes
    const handleSwitchToVideo = async () => {
        if (!isVideoEnabled) {
            setIsVideoEnabled(true);
            try {
                if (localStream.getVideoTracks().length) {
                    // We need to get a new stream with video
                    const videoStream = await getMediaStream(true);
                    
                    // If we have an active peer connection, we need to replace tracks
                    if (peerRef.current) {
                        const videoTrack = videoStream.getVideoTracks()[0];
                        const audioTrack = videoStream.getAudioTracks()[0];
                        
                        const senders = peerRef.current.getSenders?.();
                        if (senders) {
                            for (const sender of senders) {
                                if (sender.track.kind === 'video') {
                                    sender.replaceTrack(videoTrack);
                                } else if (sender.track.kind === 'audio') {
                                    sender.replaceTrack(audioTrack);
                                }
                            }
                        }
                    }
                } else {
                    // Just enable existing video tracks
                    toggleVideo(false);
                }
            } catch (error) {
                console.error('Error switching to video:', error);
                setError('Failed to enable camera. Please check permissions.');
            }
        }
    };

    const handleSwitchToAudio = () => {
        if (isVideoEnabled) {
            setIsVideoEnabled(false);
            toggleVideo(true);
        }
    };

    // File handling functions
    const handleFileSelect = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleFileUpload = async () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            await axios.post(`${apiUrl}/ChatMessage/upload/${selectedUser.id}`, formData, {
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

    // Update typing status
    const setIsType = (value) => {
        axios.post(`${apiUrl}/ChatMessage/typingStatus/${selectedUser.id}/${value}`, null, {
            headers: {
                Authorization: `Bearer ${token}`
            },
        });
    };

    // Send message
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

    // Render message content based on type
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
                                            <span className={`badge ${selectedUser.isOnline ? 'bg-success' : 'bg-secondary'} rounded-circle p-1`}
                                                style={{ width: '12px', height: '12px' }}>
                                            </span>
                                        </span>
                                    </div>
                                    <div className="ms-3">
                                        <h6 className="mb-0">{selectedUser.name}</h6>
                                        <small className="text-muted">
                                            {selectedUser.isOnline ? 'Online' : 'Offline'}
                                            {!selectedUser.isOnline && selectedUser.lastOnline && (
                                                <> • Last seen {new Date(selectedUser.lastOnline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                                            )}
                                        </small>
                                    </div>
                                </div>
                                <div>
                                    <button
                                        className={`btn btn-light btn-sm rounded-circle me-2 ${isCalling ? 'calling wave-animation' : ''}`}
                                        onClick={() => isCalling ? callPickup(false) : startCall(true, false)}
                                        disabled={isCallActive || (isVideoCalling && !isCalling)}
                                    >
                                        {isCalling && <span className="wave-animation"></span>}
                                        <i className="bi bi-telephone"></i>
                                    </button>
                                    <button
                                        className={`btn btn-light btn-sm rounded-circle me-2 ${isVideoCalling ? 'video-calling wave-animation' : ''}`}
                                        onClick={() => isVideoCalling ? callPickup(true) : startCall(false, true)}
                                        disabled={isCallActive || (isCalling && !isVideoCalling)}
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
                                        {(msg.content || msg.documnetKey) && (
                                            <div className={`${msg.receiverId === selectedUser.id ? 'bg-primary text-white' : 'bg-white'} rounded-3 p-3 shadow-sm`}
                                                style={{ maxWidth: '75%', position: 'relative' }}>
                                                {renderMessageContent(msg)}
                                                <small className={`${msg.receiverId === selectedUser.id ? 'text-white-50' : 'text-muted'} d-block mt-1`} style={{ fontSize: '0.7rem' }}>
                                                    {moment.utc(msg.dateTime).tz("Asia/Kolkata").format("hh:mm A")}
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
                            {error && <div className="alert alert-danger">{error}</div>}
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
                isVideoCall={isVideoEnabled}
                onEndCall={handleEndCall}
                onSwitchToVideo={handleSwitchToVideo}
                onSwitchToAudio={handleSwitchToAudio}
                localVideoRef={localVideoRef}
                remoteVideoRef={remoteVideoRef}
                onToggleMute={toggleAudio}
                onToggleCamera={toggleVideo}
            />
        </div>
    );
};

export default Chat;