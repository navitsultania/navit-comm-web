import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { apiUrl } from '../Environment/Environment';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        
        try {
            await axios.post(`${apiUrl}/Account/forgot-password`, { email });
            setSuccess('Password reset instructions have been sent to your email.');
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to process request. Please try again.');
        } finally {
            setLoading(false);
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
                                <h1 className="h3 mb-3 fw-bold">Forgot Password?</h1>
                                <p className="text-muted">Enter your email to reset your password</p>
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
                            <form onSubmit={handleSubmit}>
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;