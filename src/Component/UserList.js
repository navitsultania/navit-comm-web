import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../Environment/Environment';

const UserList = ({ token, onSelectUser }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [onlineUsers] = useState(new Set([1, 3, 5])); // Simulated online users - replace with real data
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await axios.get(`${apiUrl}/Account/UserFriendList`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setUsers(response.data);
            } catch (error) {
                console.error('Error fetching user list:', error);
                setError('Failed to fetch user list. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [token]);

    const openChat = (user, event) => {
        event.stopPropagation(); // Prevent double triggering
        onSelectUser(user);
        navigate('/chat');
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="container mt-5 pt-5">
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                    <div className="spinner-grow text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-5 pt-5">
                <div className="alert alert-danger d-flex align-items-center" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <div>{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-5 pt-5">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white">
                            <div className="d-flex justify-content-between align-items-center">
                                <h4 className="mb-0">Friend List</h4>
                                <div className="input-group" style={{ maxWidth: '250px' }}>
                                    <span className="input-group-text bg-light border-end-0">
                                        <i className="bi bi-search"></i>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control border-start-0"
                                        placeholder="Search your friend..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="card-body p-0">
                            {filteredUsers.length === 0 ? (
                                <div className="text-center py-5">
                                    <i className="bi bi-people" style={{ fontSize: '2rem' }}></i>
                                    <p className="mt-2">No Chat found</p>
                                </div>
                            ) : (
                                <ul className="list-group list-group-flush">
                                    {filteredUsers.map((user) => (
                                        <li
                                            key={user.id}
                                            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-3 hover-bg-light"
                                            onClick={(e) => openChat(user, e)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="d-flex align-items-center">
                                                <div className="position-relative">
                                                    <div className="rounded-circle bg-secondary d-flex justify-content-center align-items-center"
                                                        style={{ width: '45px', height: '45px', backgroundColor: '#e9ecef' }}>
                                                        <span className="text-dark" style={{ fontSize: '1.2rem' }}>
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    {onlineUsers.has(user.id) && (
                                                        <span className="position-absolute bottom-0 end-0 p-1">
                                                            <span className="badge bg-success rounded-circle p-1"
                                                                style={{ width: '12px', height: '12px' }}>
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="ms-3">
                                                    <h6 className="mb-0">{user.name}</h6>
                                                    <small className="text-muted">
                                                        {user.isOnline ? 'Online' : 'Offline'}
                                                    </small>
                                                    {!user.isOnline && (
                                                        <small className="text-muted">
                                                            { ` • Last seen ${new Date(user.lastOnline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` }
                                                        </small>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                className="btn btn-primary btn-sm rounded-pill px-3"
                                                onClick={(e) => openChat(user, e)}
                                            >
                                                <i className="bi bi-chat-dots me-1"></i>
                                                Chat
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserList;