import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../Environment/Environment';

const Navbar = ({ isLoggedIn, onLogout, token, onSelectUser }) => {
    const [searchKey, setSearchKey] = useState('');
    const [userList, setUserList] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            if (searchKey) {
                try {
                    const response = await axios.get(`${apiUrl}/Account/UserList/${searchKey}`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    setUserList(response.data);
                    setShowDropdown(true);
                } catch (error) {
                    console.error('Error fetching user list:', error);
                }
            } else {
                setUserList([]);
                setShowDropdown(false);
            }
        };

        const debounceFetch = setTimeout(() => {
            fetchUsers();
        }, 300);

        return () => clearTimeout(debounceFetch);
    }, [searchKey, token]);

    const handleUserSelect = (user) => {
        onSelectUser(user);
        navigate('/chat');
        setUserList([]);
        setSearchKey('');
        setShowDropdown(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.search-container')) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    return (
        <nav className="navbar navbar-expand-lg fixed-top shadow-sm" style={{ backgroundColor: '#ffffff' }}>
            <div className="container">
                {/* Brand */}
                <Link to="/" className="navbar-brand d-flex align-items-center">
                    {/*<i className="bi bi-chat-dots-fill text-primary me-2"></i>*/}
                    <span className="fw-bold">Somatus cummunication</span>
                </Link>

                {/* Mobile Toggle */}
                <button 
                    className="navbar-toggler border-0" 
                    type="button" 
                    data-bs-toggle="collapse" 
                    data-bs-target="#navbarContent"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                {/* Navbar Content */}
                <div className="collapse navbar-collapse" id="navbarContent">
                    {/* Search Bar */}
                    {isLoggedIn && (
                        <div className="search-container mx-auto position-relative" style={{ maxWidth: '400px' }}>
                            <div className="input-group">
                                <span className="input-group-text border-end-0 bg-light">
                                    <i className="bi bi-search text-muted"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control border-start-0 bg-light"
                                    placeholder="Search users globally..."
                                    value={searchKey}
                                    onChange={(e) => setSearchKey(e.target.value)}
                                    onFocus={() => setShowDropdown(true)}
                                />
                            </div>
                            
                            {/* Search Results Dropdown */}
                            {showDropdown && userList.length > 0 && (
                                <div className="dropdown-menu show w-100 shadow-sm border-0 p-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {userList.map((user) => (
                                        <button
                                            key={user.id}
                                            className="dropdown-item d-flex align-items-center p-2 rounded"
                                            onClick={() => handleUserSelect(user)}
                                        >
                                            <div className="rounded-circle bg-light d-flex justify-content-center align-items-center me-2"
                                                style={{ width: '35px', height: '35px' }}>
                                                <span className="text-primary fw-bold">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="fw-semibold">{user.name}</div>
                                                <small className="text-muted">Click to start chat</small>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Navigation Links */}
                    <ul className="navbar-nav ms-auto align-items-center">
                        {isLoggedIn ? (
                            <>
                                <li className="nav-item">
                                    <Link to="/userlist" className="nav-link d-flex align-items-center">
                                        <i className="bi bi-people-fill me-1"></i>
                                        People
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <button 
                                        className="btn btn-outline-danger ms-2" 
                                        onClick={onLogout}
                                    >
                                        <i className="bi bi-box-arrow-right me-1"></i>
                                        Logout
                                    </button>
                                </li>
                            </>
                        ):(<></>) }
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;