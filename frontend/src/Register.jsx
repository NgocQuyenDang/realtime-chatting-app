import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";
import axios from "axios";

function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullname, setFullname] = useState("");
    const [otp, setOtp] = useState("");
    const [isOtpSent, setIsOtpSent] = useState(false);

    useEffect(() => {
        if (isOtpSent) {
            document.title = "Xác Thực OTP | GoChat";
        } else {
            document.title = "Đăng Ký Tài Khoản | GoChat";
        }
    }, [isOtpSent]);

    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!fullname || !email || !password) {
            alert("Hãy điền đủ thông tin đăng kí");
            return; // Dừng hàm lại nếu thiếu thông tin
        }
        try {
            const response = await axios.post("http://localhost:8080/register", {
                email: email,
                password: password,
                fullname: fullname,
            });
            alert(response.data);
            setIsOtpSent(true);
        } catch (error) {
            console.error(error);
            alert("Không thể gửi mail, hãy kiểm tra lại email của bạn");
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!otp) {
            alert("Hãy nhập mã OTP trước khi xác nhận");
            return; // Dừng hàm lại nếu thiếu OTP
        }
        try {
            const response = await axios.post("http://localhost:8080/verify-otp", {
                email: email,
                otp: otp
            });
            alert(response.data);
            navigate("/home");
        } catch (error) {
            console.error(error);
            alert("Mã OTP không hợp lệ");
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">

                {isOtpSent ? (
                    <div className="login-form">
                        <h2 className="form-title">Xác Thực Mã OTP</h2>
                        <p className="form-subtitle">
                            Vui lòng kiểm tra hộp thư đến của email <strong style={{ color: '#2196F3' }}>{email}</strong> để lấy mã xác nhận.
                        </p>
                        <input
                            className="login-input"
                            placeholder="Nhập 6 số OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                        />
                        <button className="login-button" onClick={handleVerify}>Xác nhận</button>
                    </div>
                ) : (
                    <div className="login-form">
                        <h2 className="form-title">Đăng Ký Tài Khoản</h2>
                        <p className="form-subtitle">Vui lòng điền đầy đủ các thông tin phía dưới để tham gia GoChat</p>

                        <input
                            className="login-input"
                            placeholder="Full Name"
                            value={fullname}
                            onChange={(e) => setFullname(e.target.value)}
                        />
                        <input
                            className="login-input"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            className="login-input"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        <button className="login-button" onClick={handleRegister}>Sign Up</button>
                    </div>
                )}

            </div>
        </div>
    );
}

export default Register;