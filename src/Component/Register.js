import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { apiUrl } from '../Environment/Environment';

const Register = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        userName: '',
        gender: '',
        confirmPassword: '',
        phoneNo: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            await axios.post(`${apiUrl}/Account/register`, {
                email: formData.email,
                password: formData.password,
                userName: formData.userName,
            });
            window.location.href = '/';
        } catch (error) {
            setError(error.response?.data?.message || 'Registration failed. Please try again.');
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
                                <h1 className="h3 mb-3 fw-bold">Create Account</h1>
                                <p className="text-muted">Join us today!</p>
                            </div>

                            {/* Error Alert */}
                            {error && (
                                <div className="alert alert-danger d-flex align-items-center" role="alert">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    <div>{error}</div>
                                </div>
                            )}

                            {/* Registration Form */}
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label htmlFor="userName" className="form-label">
                                        <i className="bi bi-person me-2"></i>Username
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control form-control-lg bg-light"
                                        id="userName"
                                        name="userName"
                                        placeholder="Choose a username"
                                        value={formData.userName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="email" className="form-label">
                                        <i className="bi bi-envelope me-2"></i>Email address
                                    </label>
                                    <input
                                        type="email"
                                        className="form-control form-control-lg bg-light"
                                        id="email"
                                        name="email"
                                        placeholder="name@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="row mb-4">
                                    <div className="col-md-6">
                                        <label className="form-label">
                                            <i className="bi bi-gender-ambiguous me-2"></i>Gender
                                        </label>
                                        <div className="d-flex gap-4">
                                            <div className="form-check">
                                                <input
                                                    type="radio"
                                                    className="form-check-input"
                                                    id="male"
                                                    name="gender"
                                                    value="male"
                                                    checked={formData.gender === 'male'}
                                                    onChange={handleChange}
                                                    required
                                                />
                                                <label className="form-check-label" htmlFor="male">
                                                    Male
                                                </label>
                                            </div>
                                            <div className="form-check">
                                                <input
                                                    type="radio"
                                                    className="form-check-input"
                                                    id="female"
                                                    name="gender"
                                                    value="female"
                                                    checked={formData.gender === 'female'}
                                                    onChange={handleChange}
                                                    required
                                                />
                                                <label className="form-check-label" htmlFor="female">
                                                    Female
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="phoneNo" className="form-label">
                                            <i className="bi bi-phone me-2"></i>Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            className="form-control form-control-lg bg-light"
                                            id="phoneNo"
                                            name="phoneNo"
                                            placeholder="(123) 456-7890"
                                            maxLength="13"
                                            value={formData.phoneNo}
                                            onChange={handleChange}
                                        />
                                    </div>
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
                                            name="password"
                                            placeholder="Create a password"
                                            value={formData.password}
                                            onChange={handleChange}
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

                                <div className="mb-4">
                                    <label htmlFor="confirmPassword" className="form-label">
                                        <i className="bi bi-lock-fill me-2"></i>Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        className="form-control form-control-lg bg-light"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        placeholder="Confirm your password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
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
                                            Creating account...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-person-plus me-2"></i>
                                            Create Account
                                        </>
                                    )}
                                </button>

                                <div className="text-center">
                                    <p className="text-muted">
                                        Already have an account?{' '}
                                        <Link to="/" className="text-primary text-decoration-none">
                                            Sign in
                                        </Link>
                                    </p>
                                </div>

                                {/* Social Registration Buttons */}
                                <div className="text-center mt-4">
                                    <p className="text-muted mb-4">Or register with</p>
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

export default Register;