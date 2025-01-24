import React, { useState } from 'react';
import axios from 'axios';
import { apiUrl } from '../Environment/Environment';
import { Link, useParams } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const ForgotPassword = () => {
    const { key } = useParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await axios.post(`${apiUrl}/Account/forgot-password`, null, { params: { email } });
            setSuccess('Password reset instructions have been sent to your email.');
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to process request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${apiUrl}/Account/change-password`, null, { params: { key, password } });
            if(!response.data)
            setSuccess('Your password has been successfully reset.');
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
            setPassword("");
        }
    };

    return (
        <div className="container-fluid bg-light min-vh-100">
            <div className="row justify-content-center align-items-center min-vh-100">
                <div className="col-md-4 col-sm-6">
                    <div className="card shadow-lg border-0">
                        <div className="card-body p-5">
                            {/* Header */}
                            <div className="text-center mb-4">
                                <h1 className="h3 mb-3 fw-bold">{key ? 'Reset Password' : 'Forgot Password?'}</h1>
                                <p className="text-muted">{key ? 'Enter your new password' : 'Enter your email to reset your password'}</p>
                            </div>

                            {/* Error Alert */}
                            {error && (
                                <div className="alert alert-danger d-flex align-items-center" role="alert">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    <div>{error}</div>
                                </div>
                            )}

                            {/* Success Alert */}
                            {success && (
                                <div className="alert alert-success d-flex align-items-center" role="alert">
                                    <i className="bi bi-check-circle-fill me-2"></i>
                                    <div>{success}</div>
                                </div>
                            )}

                            {/* Forgot Password Form */}
                            {!key ? (
                                <form onSubmit={handleEmailSubmit}>
                                    <div className="mb-4">
                                        <label htmlFor="email" className="form-label">
                                            <i className="bi bi-envelope me-2"></i>Email address
                                        </label>
                                        <input
                                            type="email"
                                            className="form-control form-control-lg bg-light"
                                            id="email"
                                            placeholder="name@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary w-100 btn-lg mb-4"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-envelope-paper me-2"></i>
                                                Send Reset Link
                                            </>
                                        )}
                                    </button>

                                    <div className="text-center">
                                        <p className="text-muted">
                                            Remember your password?{' '}
                                            <Link to="/" className="text-primary text-decoration-none">
                                                Back to Login
                                            </Link>
                                        </p>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handlePasswordSubmit}>
                                    <div className="mb-4">
                                        <label htmlFor="password" className="form-label">
                                            <i className="bi bi-lock me-2"></i>New Password
                                        </label>
                                        <input
                                            type="password"
                                            className="form-control form-control-lg bg-light"
                                            id="password"
                                            placeholder="Enter your new password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="confirmPassword" className="form-label">
                                            <i className="bi bi-lock-fill me-2"></i>Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            className="form-control form-control-lg bg-light"
                                            id="confirmPassword"
                                            placeholder="Confirm your new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary w-100 btn-lg mb-4"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Resetting...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-shield-check me-2"></i>
                                                Reset Password
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;