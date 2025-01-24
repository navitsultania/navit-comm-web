import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { apiUrl } from '../Environment/Environment';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isOtpVerification, setIsOtpVerification] = useState(false);
    const [otp, setOtp] = useState(new Array(6).fill(""));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const response = await axios.post(`${apiUrl}/Account/login`, {
                email,
                userName: "",
                password,
            });

            if(!response){
                 throw new Error('User not found');
            }
            setIsOtpVerification(true);
        } catch (error) {
            console.error('Login failed:', error);
            setError(error.response?.data?.message || 'Login failed. Please check your credentials and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const paste = e.clipboardData.getData('text');
        if (paste.length === otp.length) {
            setOtp(paste.split(''));
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        const otpCode = otp.join('');
        
        try {
            const response = await axios.post(`${apiUrl}/Account/twoFactorAuth`, null, {
                params: {
                    otp: otpCode,
                    email: email
                }}
            );

            onLogin(response.data);
            window.location.href = '/userlist';
        } catch (error) {
            setError(error.response?.data?.message || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (element, index) => {
        if (isNaN(element.value)) return;

        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);

        // Auto focus next input
        if (element.nextSibling && element.value) {
            element.nextSibling.focus();
        }
    };

    const handleOtpKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
            const inputs = e.target.closest('div').querySelectorAll('input');
            inputs[index - 1].focus();
        }
    };

    if (isOtpVerification) {
        return (
            <div className="container-fluid bg-light min-vh-100 d-flex align-items-center justify-content-center">
                <div className="col-md-6 col-lg-4">
                    <div className="card shadow-lg border-0 rounded-4">
                        <div className="card-body p-5 text-center">
                            <div className="mb-4">
                                <i className="bi bi-shield-lock text-primary" style={{ fontSize: '3rem' }}></i>
                                <h2 className="mt-3 mb-2 fw-bold">Verify Your Identity</h2>
                                <p className="text-muted">Enter the 6-digit code sent to {email}</p>
                            </div>

                            {error && (
                                <div className="alert alert-danger d-flex align-items-center" role="alert">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    <div>{error}</div>
                                </div>
                            )}

                            <form onSubmit={handleOtpSubmit}>
                                <div className="d-flex justify-content-center gap-2 mb-4" onPaste={handleOtpPaste}>
                                    {otp.map((data, index) => (
                                        <input
                                            type="text"
                                            name="otp"
                                            key={index}
                                            className="form-control form-control-lg text-center"
                                            style={{ width: '3rem' }}
                                            maxLength="1"
                                            value={data}
                                            onChange={e => handleOtpChange(e.target, index)}
                                            onKeyDown={e => handleOtpKeyDown(e, index)}
                                            required
                                        />
                                    ))}
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100 btn-lg"
                                    disabled={loading || otp.some(digit => digit === "")}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-shield-check me-2"></i>
                                            Verify
                                        </>
                                    )}
                                </button>

                                <div className="mt-3">
                                    <button 
                                        type="button" 
                                        className="btn btn-link text-muted"
                                        onClick={() => {
                                            setIsOtpVerification(false);
                                            setOtp(new Array(6).fill(""));
                                        }}
                                    >
                                        Go back to login
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid bg-light min-vh-100">
            <div className="row justify-content-center align-items-center min-vh-100">
                <div className="col-md-4 col-sm-6">
                    <div className="card shadow-lg border-0">
                        <div className="card-body p-5">
                            <div className="text-center mb-4">
                                <h1 className="h3 mb-3 fw-bold">Welcome Back!</h1>
                                <p className="text-muted">Please sign in to continue</p>
                            </div>

                            {error && (
                                <div className="alert alert-danger d-flex align-items-center" role="alert">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    <div>{error}</div>
                                </div>
                            )}

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

                                <div className="mb-4">
                                    <label htmlFor="password" className="form-label">
                                        <i className="bi bi-lock me-2"></i>Password
                                    </label>
                                    <div className="input-group">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="form-control form-control-lg bg-light"
                                            id="password"
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        <button
                                            className="btn btn-light border"
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                                        </button>
                                    </div>
                                </div>

                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <div className="form-check">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="remember"
                                        />
                                        <label className="form-check-label" htmlFor="remember">
                                            Remember me
                                        </label>
                                    </div>
                                    <Link to="/forgot-password" className="text-primary text-decoration-none">
                                        Forgot Password?
                                    </Link>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100 btn-lg mb-4"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Signing in...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-box-arrow-in-right me-2"></i>
                                            Sign in
                                        </>
                                    )}
                                </button>

                                <div className="text-center">
                                    <p className="text-muted">
                                        Don't have an account?{' '}
                                        <Link to="/register" className="text-primary text-decoration-none">
                                            Create one
                                        </Link>
                                    </p>
                                </div>

                                <div className="text-center mt-4">
                                    <p className="text-muted mb-4">Or continue with</p>
                                    <div className="d-flex justify-content-center gap-2">
                                        <button type="button" className="btn btn-outline-dark btn-lg px-4">
                                            <i className="bi bi-google"></i>
                                        </button>
                                        <button type="button" className="btn btn-outline-dark btn-lg px-4">
                                            <i className="bi bi-facebook"></i>
                                        </button>
                                        <button type="button" className="btn btn-outline-dark btn-lg px-4">
                                            <i className="bi bi-github"></i>
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;