import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../Css/ChatPage.css';
import { apiUrl } from '../Environment/Environment';

const Chat = ({ selectedUser, token }) => {
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const intervalRef = useRef(null);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

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
                setMessages(response.data);
            } catch (error) {
                console.error('Error fetching messages:', error);
                setError('Failed to fetch messages. Please try again.');
            }
        };

        fetchMessages();
        intervalRef.current = setInterval(fetchMessages, 5000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [selectedUser, token]);

    const handleSendMessage = async () => {
        if (!message.trim()) return;

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
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
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
                                                            { ` • Last seen ${new Date(selectedUser.lastOnline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` }
                                                        </small>
                                                    )}
                                    </div>
                                </div>
                                <div>
                                    <button className="btn btn-light btn-sm rounded-circle me-2">
                                        <i className="bi bi-telephone"></i>
                                    </button>
                                    <button className="btn btn-light btn-sm rounded-circle me-2">
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
                                        <div className={`${msg.receiverId === selectedUser.id ? 'bg-primary text-white' : 'bg-white'} rounded-3 p-3 shadow-sm`}
                                            style={{ maxWidth: '75%', position: 'relative' }}>
                                            <div className="message-content">{msg.content}</div>
                                            <small className={`${msg.receiverId === selectedUser.id ? 'text-white-50' : 'text-muted'} d-block mt-1`} style={{ fontSize: '0.7rem' }}>
                                                {new Date(msg.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </small>
                                        </div>
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
                                <button className="btn btn-light border rounded-circle me-2" type="button">
                                    <i className="bi bi-paperclip"></i>
                                </button>
                                <textarea
                                    className="form-control rounded-pill bg-light border-0"
                                    placeholder="Type a message..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    rows="1"
                                    style={{ resize: 'none' }}
                                />
                                <button 
                                    className="btn btn-primary rounded-circle ms-2"
                                    onClick={handleSendMessage}
                                    disabled={!message.trim()}
                                >
                                    <i className="bi bi-send"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;