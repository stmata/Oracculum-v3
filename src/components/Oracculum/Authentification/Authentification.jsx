import React, { useState, useEffect, useRef } from "react";
import styles from "./Authentification.module.css";
import bgImage from "../../../assets/images/Authentification.jpg";
import { RxLapTimer } from "react-icons/rx";
import { requestLoginCode } from "../../../features/authentication";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../../context/AppContext";

const STATIC_CODE = "882282";

const Authentification = () => {
  const [code, setCode] = useState(new Array(6).fill(""));
  const inputsRef = useRef([]);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [error, setError] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [invalidCode, setInvalidCode] = useState(false);
  const [email, setEmail] = useState("");
  const [expired, setExpired] = useState(false);
  const [globalError, setGlobalError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [verificationCode, setVerificationCode] = useState(null);

  const navigate = useNavigate();
  const { user, setUser } = useAppContext();

  const handleSendCode = async () => {
    const pattern =
      /^[a-zA-Zàâçéèêëîïôûùüÿñæœ'.-]+\.[a-zA-Zàâçéèêëîïôûùüÿñæœ'.-]+@skema\.edu$/i;

    if (!pattern.test(email.trim())) {
      setError(true);
      setShowCodeInput(false);
      return;
    }

    setError(false);
    setGlobalError(false);
    setNotFound(false);

    try {
      const { user: backendUser } = await requestLoginCode(email);

      const fullUser = { ...(backendUser || {}), email };
      setUser(fullUser);
      localStorage.setItem("user", JSON.stringify(fullUser));

      setVerificationCode(STATIC_CODE);

      setCode(new Array(6).fill(""));
      setInvalidCode(false);
      setExpired(false);
      setShowCodeInput(true);
      setTimeLeft(120);
    } catch (err) {
      if (err.status === 404) {
        setNotFound(true);
        setShowCodeInput(false);
      } else {
        setGlobalError(true);
        setShowCodeInput(false);
      }
    }
  };

  const handleCodeChange = (e, index) => {
    const value = e.target.value.replace(/\D/, "");
    if (!value) return;

    const updatedCode = [...code];
    updatedCode[index] = value;
    setCode(updatedCode);

    if (index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      const updatedCode = [...code];
      if (code[index]) {
        updatedCode[index] = "";
        setCode(updatedCode);
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputsRef.current[index + 1]?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleVerify();
    }
  };

  const handleVerify = () => {
    const fullCode = code.join("");

    if (fullCode === STATIC_CODE) {
      localStorage.setItem("authToken", "dummy-auth-token");
      localStorage.setItem("userEmail", email);

      const currentUser =
        user || JSON.parse(localStorage.getItem("user") || "{}");
      const fullUser = { ...currentUser, email };
      setUser(fullUser);
      localStorage.setItem("user", JSON.stringify(fullUser));

      setInvalidCode(false);
      navigate("/oraculum");
    } else {
      setInvalidCode(true);
    }
  };

  useEffect(() => {
    if (showCodeInput && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
    if (showCodeInput && timeLeft === 0) {
      setShowCodeInput(false);
      setCode(new Array(6).fill(""));
      setInvalidCode(false);
      setExpired(true);
    }
  }, [showCodeInput, timeLeft]);

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? "0" + sec : sec}`;
  };

  return (
    <div
      className={styles.container}
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className={styles.leftSection}>
        <h1 className={styles.bigTitle}>OraculumHR Platform</h1>
        <br />
        <h2 className={styles.smallTitle}>
          Your Unified Workforce &amp; Operations Ecosystem
        </h2>
        <p className={styles.description1}>
          A single intelligent gateway to all your HR, payroll, matching and
          operational systems. Skip the complexity — access everything from one
          login.
        </p>
        <p className={styles.description2}>
          Designed to unify workflows across Minerva, Fidelex, CompositusHR and
          all OraculumHR services.
        </p>
      </div>

      <div className={styles.rightSection}>
        <div className={styles.authBox}>
          <h2 className={styles.authTitle}>Let’s Get You Started</h2>
          <p className={styles.authSubtitle}>
            Enter your email to receive your confirmation code and access your
            dashboard.
          </p>

          <input
            type="email"
            placeholder="you@skema.edu"
            className={`${styles.input} ${error ? styles.inputError : ""}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSendCode();
              }
            }}
          />

          {globalError && (
            <p className={styles.errorText}>
              An error occurred. Please try again later.
            </p>
          )}
          {expired && (
            <p className={styles.errorText}>Time expired. Try again.</p>
          )}
          {error && (
            <p className={styles.errorText}>
              Please enter a valid SKEMA email (firstname.lastname@skema.edu)
            </p>
          )}
          {notFound && (
            <p className={styles.errorText}>
              Hmm... we couldn&apos;t find this email. Reach out to your admin
              to confirm your access.
            </p>
          )}

          {!showCodeInput && (
            <button className={styles.signInBtn} onClick={handleSendCode}>
              Send Code
            </button>
          )}

          {showCodeInput && (
            <>
              <div className={styles.codeContainer}>
                {code.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleCodeChange(e, idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    ref={(el) => (inputsRef.current[idx] = el)}
                    className={styles.codeInput}
                  />
                ))}
              </div>

              {invalidCode && (
                <p className={styles.errorText}>
                  Invalid code. Please try again.
                </p>
              )}

              <p className={styles.timerText}>
                <RxLapTimer className={styles.timerIcon} />
                Expires in: {formatTime(timeLeft)}
              </p>

              <button className={styles.signInBtn} onClick={handleVerify}>
                Verify Code
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Authentification;
