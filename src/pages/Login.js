import React, { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import 'react-toastify/dist/ReactToastify.css';
import { toast } from "react-toastify";
import '../css/Login.css'
import { Button } from "react-bootstrap";
import UseFetchIp from "../Components/IP_Address";

export const Login = () => {
    const navigate = useNavigate();

    const [ip, setIp] = useState('');

    const [passwordVisible, setPasswordVisible] = useState(false)
    const [passwordValid, setPasswordValid] = useState(true);
    const [emailValid, setEmailValid] = useState(true);

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    })

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData({ ...formData, [name]: value })

        if (name === 'password') {
            const password = value
            const re = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
            setPasswordValid(re.test(password));
        }

        if (name === 'email') {
            const email = value;
            setEmailValid(
                String(email)
                    .toLowerCase()
                    .match(
                        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                    )
            );
        }

    }
    useEffect(() => {
        fetchIp();

    }, [ip]);

    const fetchIp = async () => {
        const fetchedIp = await UseFetchIp();
        setIp(fetchedIp);
    };


    const handleSubmit = (event) => {
        event.preventDefault();

        const { email, password } = formData;

        fetch("http://localhost:8080/form/login", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, roll: "user", ip })
        })
            .then(async (response) => {
                console.log("res", response);
                if (response.ok) {
                    return response.json();
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
            .then((data) => {
                // console.log("Login successful:", data);
                toast.success("Login Successfully", { autoClose: 2000 });
                // const token = data.token;
                console.log('token', data.token);
                localStorage.setItem('token', data.token);
                navigate('/');

            })
            .catch(error => {
                console.log("error ", error);

                toast.error(error.message, {
                    autoClose: 3000,
                });
            });
    }

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };


    return (
        <div className="main">
            <Button href="/">Back to Home</Button>
            <div className="container1 p-5">
                <form onSubmit={handleSubmit}>
                    <h1>Login</h1>
                    <br />

                    <input type="text" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className={emailValid ? '' : 'invalid'} />

                    {!emailValid && formData.email !== '' && (
                        <div className="error-message">Invalid email format.</div>
                    )}

                    <div className="password-container">
                        <input
                            type={passwordVisible ? "text" : "password"}
                            placeholder="Password :"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={passwordValid ? '' : "invalid"}
                        />
                        <span onClick={togglePasswordVisibility} className="eye-icon">
                            {!passwordVisible ? <FaEyeSlash /> : <FaEye />}
                        </span>
                    </div>
                    {!passwordValid && formData.password !== '' && (<div className="error-message">Invalid Password</div>)}

                    <div className="remember-forgot">

                        <label className="checkbox-container">
                            <input type="checkbox" />
                            Remember me
                        </label>


                        <Link
                            className="forgot-password-link"
                            to={`/forgot-password?email=${encodeURIComponent(formData.email)}`}
                        >
                            Forgot password?
                        </Link>
                    </div>

                    <input type="submit" className="button" value="Login" />

                    <p>Don't have an account? <Link className="text-decoration-none " to="/register">register </Link>for free!</p><br />

                </form>

            </div>
        </div>
    )
}






