import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./login.css";

axios.defaults.withCredentials = true;

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [isOtpPending, setIsOtpPending] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Đăng Nhập | GoChat";
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("http://localhost:8080/login", {
                email: email,
                password: password
            });
            if (response.data === "Đăng nhập thành công") navigate("/home");
            else if (response.data === "Tài khoản chưa được kích hoạt, hãy nhập lại mã OTP") {
                setIsOtpPending(true);
            } else {
                alert(response.data);
            }
        } catch (error) {
            console.error(error);
            alert("Có lỗi xảy ra, vui lòng thử lại!");
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otp) {
            alert("Hãy nhập mã OTP trước khi ấn xác nhận");
            return;
        }
        try {
            const response = await axios.post("http://localhost:8080/verify-otp", {
                email: email,
                otp: otp
            });
            alert(response.data);
            if (response.data === "Đăng kí thành công") {
                setIsOtpPending(false);
                setPassword("");
                setOtp(""); // 🌟 Thêm xóa OTP cũ để tránh lưu cache
            }
        } catch (error) {
            console.log(error);
            alert("Mã OTP không hợp lệ hoặc đã hết hạn!");
        }
    };

    const handleResendOtp = async (e) => {
        e.preventDefault(); // 🌟 Ngăn submit form ngoài ý muốn
        try {
            const response = await axios.post("http://localhost:8080/resend-otp", { email: email });
            alert(response.data);
        } catch (error) {
            console.log(error);
            alert("Không thể gửi lại mã, vui lòng thử lại sau!");
        }
    };

    const goToRegister = (e) => {
        e.preventDefault();
        navigate("/register");
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>GoChat</h1>
                    <p>Connect with every people</p>
                </div>

                {isOtpPending ? (
                    /* GIAO DIỆN NHẬP OTP */
                    <form className="login-form" onSubmit={handleVerifyOtp}>
                        <h2>Tài Khoản Chưa Kích Hoạt</h2>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                            Hệ thống nhận thấy tài khoản của bạn chưa xác thực. Vui lòng nhập mã OTP hoặc bấm gửi lại mã.
                        </p>
                        <input
                            className="login-input"
                            type="text"
                            name="one-time-code"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength="6"
                            autoComplete="one-time-code"
                            placeholder="Nhập 6 số OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                        />
                        <button type="submit" className="login-button">
                            Xác Nhận Kích Hoạt
                        </button>
                        <button
                            type="button"
                            className="login-button"
                            style={{ backgroundColor: '#6c757d', marginTop: '10px' }}
                            onClick={handleResendOtp}
                        >
                            Gửi Lại Mã OTP
                        </button>
                    </form>
                ) : (
                    /* GIAO DIỆN ĐĂNG NHẬP BÌNH THƯỜNG */
                    <form className="login-form" onSubmit={handleLogin}>
                        <label htmlFor="login-email">Email</label>
                        <input
                            id="login-email"
                            className="login-input"
                            type="email"
                            name="email" /* 🌟 Xác định rõ tên trường */
                            autoComplete="username" /* 🌟 Trình duyệt sẽ điền chính xác Email đã lưu */
                            placeholder="name@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <label htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
                            className="login-input"
                            type="password"
                            name="password" /* 🌟 Xác định rõ tên trường */
                            autoComplete="current-password" /* 🌟 Trình duyệt hiểu đây là mật khẩu HIỆN TẠI, không phải tạo mới */
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <button type="submit" className="login-button">
                            Sign In
                        </button>

                        <div className="login-redirect">
                            <span>Don't have an account? </span>
                            <a href="/register" onClick={goToRegister}>Sign up</a>
                        </div>
                    </form>
                )}

                <div className="login-footer">2026</div>
            </div>
        </div>
    );
}

export default Login;