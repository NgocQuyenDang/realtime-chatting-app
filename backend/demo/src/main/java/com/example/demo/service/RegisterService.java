package com.example.demo.service;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class RegisterService {
    private final JavaMailSender mailSender;
    private final BCryptPasswordEncoder encoder;
    private final UserRepository userRepository;

    private final SecureRandom secureRandom = new SecureRandom();

    public String registerRequest(String email, String password, String fullname) {
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isPresent()) {
            if (user.get().isActive()) {
                throw new RuntimeException("Người dùng đã tồn tại, quay lại để đăng nhập");
            }
            throw new RuntimeException("\"Tài khoản của bạn đang chờ kích hoạt. Vui lòng kiểm tra email để nhập mã OTP hoặc bấm gửi lại mã.\"");
        }
        String otpCode = generateOtp();
        User newUser = createInactiveUser(email, password, fullname, otpCode);

        userRepository.save(newUser);
        sendOtp(email, otpCode);

        return "Mã OTP đã được gửi, hạn sử dụng là 5 phút";
    }

    public String verifyOtp(String email, String otpInput) {
        User user = getUserByEmail(email);

        if (user.getOtpExpiredAt() == null || LocalDateTime.now().isAfter(user.getOtpExpiredAt())) {
            throw new RuntimeException("Mã OTP đã hết hạn, hãy yêu cầu gửi lại");
        }

        if (!user.getOtp().equals(otpInput)) {
            throw new RuntimeException("Mã OTP không chính xác");
        }

        user.setActive(true);
        user.setOtp(null);
        user.setOtpExpiredAt(null);
        userRepository.save(user);

        return "Đăng kí thành công";
    }

    public void sendOtp(String email, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Mã xác thực OTP Đăng ký tài khoản - WorkSpace");
        message.setText("Chào bạn,\n\nMã OTP của bạn là: " + otp +
                "\nMã này có hiệu lực trong vòng 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.");

        mailSender.send(message);
    }

    public String resendOtp(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return "Email không tồn tại!";
        }

        User user = userOpt.get();

        if (user.getOtpExpiredAt() != null &&
                LocalDateTime.now().isBefore(user.getOtpExpiredAt().minusMinutes(4))) {
            return "Vui lòng đợi 1 phút trước khi yêu cầu gửi lại mã mới!";
        }

        String newOtp = generateOtp();
        user.setOtp(newOtp);
        user.setOtpExpiredAt(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        // Gửi mail lại
        sendOtp(email, newOtp);
        return "Mã OTP mới đã được gửi vào hòm thư của bạn!";
    }

    private String generateOtp() {
        return String.format("%06d", secureRandom.nextInt(1_000_000));
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy email"));
    }

    private User createInactiveUser(
            String email,
            String password,
            String fullname,
            String otp) {

        User user = new User();

        user.setEmail(email);
        user.setPassword(encoder.encode(password));
        user.setFullname(fullname);
        user.setOtp(otp);
        user.setCreatedAt(LocalDateTime.now());
        user.setOtpExpiredAt(LocalDateTime.now().plusMinutes(5));
        user.setActive(false);

        return user;
    }
}
