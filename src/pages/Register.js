import React, { useEffect, useState } from 'react';
import '../css/Login.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import countryList from 'country-list'

export const Register = () => {
    const navigate = useNavigate();
    const [passwordVisible1, setPasswordVisible1] = useState(false);
    const [passwordVisible2, setPasswordVisible2] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        terms: false,
        country: '',
        gender: ''
    });
    const [usernameValid, setUserNameValid] = useState(true)
    const [emailValid, setEmailValid] = useState(true);
    const [passwordValid, setPasswordValid] = useState(true);
    const [passwordMatch, setPasswordMatch] = useState(true);


    const [ip, setIp] = useState('');

    useEffect(() => {
        const fetchIp = async () => {
            try {
                const response = await axios.get('https://api.ipify.org?format=json');
                console.log("response ip", response);
                setIp(response.data.ip);
            } catch (error) {
                console.error('Error fetching the IP address', error);
            }
        };

        fetchIp();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'name') {
            setUserNameValid(validateUserName(value))
        }

        if (name === 'email') {
            setEmailValid(validateEmail(value));
        }

        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });

        if (name === 'password') {
            validatePassword(value);
        }
    };

    const validateUserName = (username) => {
        if (username.trim() === '' || username.length < 3) {
            return false;
        }
        return true;
    }

    const validateEmail = (email) => {
        return String(email)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
    };

    const validatePassword = (password) => {
        const re = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
        setPasswordValid(re.test(password));
    };

    const handleChange1 = (e) => {
        const { name, value } = e.target;

        setFormData((prevFormData) => {
            const updatedFormData = {
                ...prevFormData,
                [name]: value
            };

            if (name === 'confirmPassword' || name === 'password') {
                setPasswordMatch(updatedFormData.password === updatedFormData.confirmPassword);
            }

            return updatedFormData;
        });
    };



    const handleSubmit = (event) => {
        event.preventDefault();

        if (!passwordValid || !passwordMatch || !emailValid) {
            toast("Please fix the errors before submitting.");
            return;
        }

        const data = {
            username: formData.name.trim(),
            email: formData.email,
            password: formData.password,
            country: formData.country,
            gender: formData.gender,
            roll: "user",
            ip:ip,
        };

        const usernameRegex = /^\S+$/;

        if (!data.username || !usernameRegex.test(data.username)) {
            toast.error("Username cannot be empty or contain spaces.");
            return;
        }

        fetch("http://localhost:8080/form/register", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(async (response) => {
                if (response.ok) {
                    toast.success("Signup successful, Please Login!", { autoClose: 2000 });
                    navigate("/login");
                } else {
                    const errorData = await response.json();
                    console.log("error data", errorData);
                    if (response.status === 400) {
                        throw new Error(errorData.message || 'Bad Request');
                    } else {
                        throw new Error(errorData.message || 'Something went wrong');
                    }

                }
            })
            .catch(error => {
                toast.error(error.message);
            });
    };

    const togglePasswordVisibility1 = () => {
        setPasswordVisible1(!passwordVisible1);
    };
    const togglePasswordVisibility2 = () => {
        setPasswordVisible2(!passwordVisible2);
    };

    return (
        <div className='main'>
            <div className='container1 p-5'>
                <form onSubmit={handleSubmit}>
                    <h1>Register</h1>

                    <input type="text" name='name' placeholder='UserName' value={formData.name} onChange={handleChange} />

                    {!usernameValid && !formData.name === '' && (
                        <div className="error-message">Invalid Username</div>
                    )}

                    <input type="text" name='email' placeholder='EmailId' value={formData.email} onChange={handleChange} className={emailValid ? '' : 'invalid'} />

                    {!emailValid && formData.email !== '' && (
                        <div className="error-message">Invalid email format.</div>
                    )}

                    <div className="password-container">
                        <input
                            type={passwordVisible1 ? "text" : "password"}
                            placeholder="Password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={passwordValid ? '' : 'invalid'}
                        />
                        <span onClick={togglePasswordVisibility1} className="eye-icon">
                            {!passwordVisible1 ? <FaEyeSlash /> : <FaEye />}
                        </span>
                    </div>
                    {!passwordValid && formData.password !== '' && (<div className="error-message">Invalid Password</div>)}

                    <div className="password-container">
                        <input
                            type={passwordVisible2 ? "text" : "password"}
                            placeholder="Confirm Password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange1}
                            className={passwordMatch ? '' : 'invalid'}
                        />
                        <span onClick={togglePasswordVisibility2} className="eye-icon">
                            {!passwordVisible2 ? <FaEyeSlash /> : <FaEye />}
                        </span>
                    </div>
                    {!passwordMatch && <div className="error-message">Passwords do not match.</div>}

                    <select name='country' value={formData.country} onChange={handleChange}>
                        <option value=''>Select Country</option>
                        {countryList.getData().map((country) => (
                                <option key={country.code} value={country.name}>{country.name}</option>
                            ))}
                    </select>
                    <br />
                    <label> <b>Gender</b> &nbsp;
                        <input type="radio" name='gender' value='male' checked={formData.gender === 'male'} onChange={handleChange} />
                        Male
                        &nbsp;  &nbsp;  &nbsp;
                        <input type="radio" name='gender' value='female' checked={formData.gender === 'female'} onChange={handleChange} />
                        Female
                    </label>
                    <br />

                    <label>
                        <input type="checkbox" name='terms' checked={formData.terms} onChange={handleChange} />
                        I agree to the Terms and Conditions
                    </label>
                    <br />

                    <p>Already have an account? <Link className="text-decoration-none" to="/login">Login now!</Link></p>

                    <input type="submit" value="Register" />
                </form>
            </div>
        </div>
    );
};

export default Register;
