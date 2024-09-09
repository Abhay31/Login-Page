import React, { useState } from "react";
import "./Login.css";
import { FiRefreshCcw } from "react-icons/fi";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import { GoogleLogin } from "@react-oauth/google"; // Google Login

const Login = ({ setUserState }) => {
  const [loginMode, setLoginMode] = useState("password");
  const [captchaCode, setCaptchaCode] = useState(generateCaptcha());
  const [inputCaptcha, setInputCaptcha] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [otpArray, setOtpArray] = useState(new Array(6).fill(""));

  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    if (/^[0-9]$/.test(value)) {
      let newOtpArray = [...otpArray];
      newOtpArray[index] = value;
      setOtpArray(newOtpArray);

      // Combine the array into a single OTP string and update state
      const newOtpString = newOtpArray.join("");
      setOtp(newOtpString);

      // Automatically move focus to the next input box if a digit is entered
      if (e.target.nextSibling) {
        e.target.nextSibling.focus();
      }
    }
  };

  const handleBackspace = (e, index) => {
    if (e.key === "Backspace" && !otpArray[index] && e.target.previousSibling) {
      e.target.previousSibling.focus();
    }
  };

  function generateCaptcha() {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let captcha = "";
    for (let i = 0; i < 5; i++) {
      captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return captcha;
  }

  const refreshCaptcha = () => {
    setCaptchaCode(generateCaptcha());
    setInputCaptcha("");
  };

  //Google

  const handleGoogleSuccess = async (response) => {
    try {
      const { credential } = response;
      const res = await axios.post("http://localhost:9002/google-login", {
        token: credential,
      });
      setUserState(res.data.user);
      navigate("/home", { replace: true });
    } catch (error) {
      console.error("Google Sign-In failed", error);
    }
  };

  const handleGoogleFailure = (error) => {
    console.error("Google Sign-In failed", error);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (loginMode === "password") {
      // CAPTCHA validation only for password mode
      if (inputCaptcha === captchaCode) {
        // Password login logic
        try {
          // Send username and password to the backend
          const response = await axios.post("http://localhost:9002/api/login", {
            username,
            password,  // Send plain-text password (server will handle bcrypt)
          });
    
          if (response.data.success) {
            Swal.fire({
              icon: "success",
              title: "Login Successful",
              text: "You have successfully logged in!",
              timer: 3000,
              showConfirmButton: false,
            });
            setUserState(response.data.user); // Set the user state from response
            setTimeout(() => {
              navigate("/home");
            }, 3000);
          } else {
            setError("Invalid username or password");
          }
        } catch (error) {
          console.error("Error during login", error);
          setError("An error occurred. Please try again.");
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Incorrect CAPTCHA",
          text: "CAPTCHA code is incorrect. Please try again.",
          confirmButtonText: "OK",
        });
      }
    } else if (loginMode === "otp") {
      if (otpSent) {
        try {
          const response = await axios.post(
            "http://localhost:9002/verify-otp",
            { phoneNumber, otp }
          );
          if (response.status === 200) {
            Swal.fire({
              icon: "success",
              title: "Login Successful",
              text: "You have successfully logged in with OTP!",
              timer: 3000,
              showConfirmButton: false,
            });
            setTimeout(() => {
              navigate("/home");
            }, 3000);
          } else {
            setError("Invalid OTP. Please try again.");
          }
        } catch (error) {
          console.error("Error verifying OTP", error);
          setError("An error occurred. Please try again.");
        }
      } else {
        // Check if the mobile number exists in the database
        try {
          const userExists = await axios.post(
            "http://localhost:9002/api/check-user",
            { phoneNumber }
          );

          if (userExists.data.exists) {
            // If user exists, send OTP
            try {
              const response = await axios.post(
                "http://localhost:9002/send-otp",
                { phoneNumber }
              );

              if (response.status === 200) {
                // OTP sent successfully, update the state
                setOtpSent(true);
                setUserState(userExists.data.user);
                Swal.fire({
                  icon: "info",
                  title: "OTP Sent",
                  text: "An OTP has been sent to your mobile number.",
                  timer: 3000,
                  showConfirmButton: false,
                });
              } else {
                setError("Failed to send OTP. Please try again.");
              }
            } catch (error) {
              console.error("Error sending OTP", error);
              setError("An error occurred. Please try again.");
            }
          } else {
            Swal.fire({
              icon: "error",
              title: "User Not Registered",
              text: "The mobile number you entered is not registered. Please sign up first.",
              confirmButtonText: "OK",
            });
          }
        } catch (error) {
          console.error("Error checking user existence", error);
          setError("An error occurred. Please try again.");
        }
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_UW4BIkX-QRU7WtU-tLSMSgGFBfts2e0PSw&s"
            alt="Emblem of India"
            className="emblem"
          />
          <h2>Department of Women and Child Development</h2>
        </div>
        <div className="toggle-login mb-5 d-flex justify-content-center align-items-center gap-3">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setLoginMode("password")}
          >
            Login with Password
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setLoginMode("otp")}
          >
            Login with OTP
          </button>
        </div>
        <form onSubmit={handleLogin}>
          {loginMode === "password" && (
            <>
              <div className="form-group">
                <label htmlFor="username">
                  Username <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">
                  Password <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-group captcha-group">
                <label htmlFor="captcha">
                  Enter the code below <span className="text-danger">*</span>
                </label>
                <div className="input-group captcha-input-group">
                  <input
                    type="text"
                    className="form-control fw-bold"
                    id="captcha"
                    value={captchaCode}
                    required
                    readOnly
                    style={{ backgroundColor: "rgb(225, 225, 133)" }}
                  />
                  <span
                    className="input-group-text border-0"
                    style={{ backgroundColor: "white" }}
                    onClick={refreshCaptcha}
                  >
                    <FiRefreshCcw size={20} style={{ color: "blue" }} />
                  </span>
                </div>
                <input
                  type="text"
                  className="form-control mt-2"
                  id="captcha-input"
                  value={inputCaptcha}
                  onChange={(e) => setInputCaptcha(e.target.value)}
                  required
                />
                <small className="form-text text-muted">
                  Enter the characters shown above.
                </small>
              </div>
              <button type="submit" className="btn btn-primary btn-block">
                Log in
              </button>
              <div className="or-separator">
                <span>or</span>
              </div>
              <div className="d-flex justify-content-center align-items-center mt-3">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleFailure}
                />
              </div>
            </>
          )}

          {loginMode === "otp" && (
            <>
              <div className="form-group">
                <label htmlFor="mobile">
                  Mobile Number <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="phoneNumber"
                  placeholder="Enter Mobile Number (Eg. +911234567890)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
              {otpSent && (
                <div className="form-group otp-container">
                  <label htmlFor="otp">
                    Enter OTP <span className="text-danger">*</span>
                  </label>
                  <div className="otp-input-container">
                    {[...Array(6)].map((_, index) => (
                      <input
                        key={index}
                        type="text"
                        className="otp-input-box"
                        maxLength={1}
                        onChange={(e) => handleOtpChange(e, index)}
                        onKeyDown={(e) => handleBackspace(e, index)}
                      />
                    ))}
                  </div>
                </div>
              )}
              <button type="submit" className="btn btn-primary btn-block">
                {otpSent ? "Log in" : "Send OTP"}
              </button>
            </>
          )}
        </form>
        <div className="register-link mt-4 text-center">
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="text-primary">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;