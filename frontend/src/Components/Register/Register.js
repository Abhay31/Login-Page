import React, { useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import "./Register.css"; 
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import ReCAPTCHA from "react-google-recaptcha";
import { GoogleLogin } from "@react-oauth/google"; // Google Login

const Register = ({ setUserState }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const [govtIdType, setGovtIdType] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);
  const navigate = useNavigate();

  const onSubmit = (data) => {
    if (captchaToken) {
      console.log(captchaToken);
      axios
        .post("http://localhost:9002/api/register", { ...data, captchaToken })
        .then((response) => {
          Swal.fire({
            title: "Register Successful!",
            text: "You have successfully registered!",
            icon: "success",
            timer: 3000,
            showConfirmButton: false,
          });
          setTimeout(() => {
            navigate("/home");
          }, 3000);
        })
        .catch((error) => {
          Swal.fire({
            title: "Error!",
            text: error.response.data.message,
            icon: "error",
          });
        });
    } else {
      Swal.fire({
        title: "Captcha Verification",
        text: "Please complete the CAPTCHA",
        icon: "warning",
      });
    }
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

const handleCaptchaChange = (token) => {
  setCaptchaToken(token); 
};

  return (
    <div className="container mt-5 mb-5">
      <div className="login-header mb-4">
        <img
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_UW4BIkX-QRU7WtU-tLSMSgGFBfts2e0PSw&s"
          alt="Emblem of India"
          className="emblem"
        />
        <h2>Department of Women and Child Development</h2>
        <h1>Register User</h1>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group text-start">
          <label>
            First Name <span className="text-danger">*</span>
          </label>
          <input
            className="form-control mt-2"
            {...register("first_name", { required: true })}
          />
          {errors.first_name && <span>This field is required</span>}
        </div>

        <div className="form-group text-start">
          <label>Middle Name</label>
          <input className="form-control mt-2" {...register("middle_name")} />
        </div>

        <div className="form-group text-start">
          <label>
            Last Name <span style={{ color: "red" }}>*</span>
          </label>
          <input
            className="form-control mt-2"
            {...register("last_name", { required: true })}
          />
          {errors.last_name && <span>This field is required</span>}
        </div>

        <div className="form-group text-start">
          <label>
            Email <span className="text-danger">*</span>
          </label>
          <input
            className="form-control mt-2"
            type="email"
            {...register("email", { required: true })}
          />
          {errors.email && <span>This field is required</span>}
        </div>

        <div className="form-group text-start">
          <label>
            Mobile Number <span className="text-danger">*</span>
          </label>
          <input
            className="form-control mt-2"
            {...register("mobile_number", { required: true })}
          />
          {errors.mobile_number && <span>This field is required</span>}
        </div>

        <div className="form-group text-start">
          <label>
            Govt. ID Proof <span className="text-danger">*</span>
          </label>
          <select
            className="form-control mt-2"
            {...register("govt_id_proof", { required: true })}
            onChange={(e) => setGovtIdType(e.target.value)}
          >
            <option value="">Select ID Proof</option>
            <option value="Aadhar Card">Aadhar Card</option>
            <option value="Voter Id">Voter Id</option>
            <option value="Pan Card">Pan Card</option>
          </select>
          {errors.govt_id_proof && <span>This field is required</span>}
        </div>

        {govtIdType && (
          <div className="form-group text-start">
            <label>
              Enter your{" "}
              {govtIdType === "Aadhar Card"
                ? "Aadhar Card"
                : govtIdType === "Voter Id"
                ? "Voter Id"
                : "Pan Card"}{" "}
              Number <span className="text-danger">*</span>
            </label>
            <input
              className="form-control mt-2"
              {...register("govt_id_number", { required: true })}
            />
            {errors.govt_id_number && <span>This field is required</span>}
          </div>
        )}

        <div className="form-group text-start">
          <label>
            Create New Password <span className="text-danger">*</span>
          </label>
          <input
            className="form-control mt-2"
            type="password"
            {...register("password", {
              required: true,
              pattern: {
                value: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/,
                message:
                  "Password must contain at least 8 characters, including uppercase, lowercase, numbers, and special characters",
              },
            })}
          />
          {errors.password && <span>{errors.password.message}</span>}
        </div>

        <div className="form-group text-start">
          <label>
            Confirm Password <span className="text-danger">*</span>
          </label>
          <input
            className="form-control mt-2"
            type="password"
            {...register("confirm_password", {
              required: true,
              validate: (value) =>
                value === watch("password") || "Passwords do not match",
            })}
          />
          {errors.confirm_password && (
            <span>{errors.confirm_password.message}</span>
          )}
        </div>

        <div className="form-group text-start mt-4">
          {/* <label className="mb-2">Captcha Verification</label> */}
          <ReCAPTCHA
            sitekey="6Lf-UjcqAAAAAOu3hRY52RUP4NqEJFcde834gluh" 
            onChange={handleCaptchaChange}
            className="d-flex justify-content-center align-items-center"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary mt-3"
          disabled={!captchaToken}
        >
          Register
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
      </form>
      <div className="login-link mt-4 text-center">
          <p>
            Already a User?{" "}
            <Link to="/login" className="text-primary">
              Login here
            </Link>
          </p>
        </div>
    </div>  
  );
};

export default Register;