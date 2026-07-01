package com.example.demo.service;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
public class RegisterService {
    @Autowired
    private JavaMailSender  mailSender;

    @Autowired
    private BCryptPasswordEncoder encoder;

    @Autowired
    private UserRepository userRepository;


    public String registerRequest(String email, String password, String fullname) {
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isPresent()) {
            if (user.get().isActive()) {
                return "Người dùng này đã đăng kí, hãy quay lại để đăng nhập";
            }
            return "Tài khoản của bạn đang chờ kích hoạt. Vui lòng kiểm tra email để nhập mã OTP hoặc bấm gửi lại mã.";
        }
        String otpCode = String.format("%06d", new Random().nextInt(999999));
        LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(5);

        User newUser = new User();
        newUser.setEmail(email);
        newUser.setPassword(encoder.encode(password));
        newUser.setFullname(fullname);
        newUser.setOtp(otpCode);
        newUser.setCreatedAt(LocalDateTime.now());
        newUser.setOtpExpiredAt(expiryTime);
        newUser.setActive(false);

        userRepository.save(newUser);
        sendOtp(email, otpCode);

        return "Mã OTP đã được gửi, hạn sử dụng là 5 phút";
    }

    public String verifyOtp(String email, String otpInput) {
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isEmpty()) {
            return "Không tìm thấy email đăng kí, hãy đăng kí lại";
        }
        User currentUser = user.get();
        if (LocalDateTime.now().isAfter(currentUser.getOtpExpiredAt())) {
            return "Mã OTP đã hết hạn, hãy yêu cầu gửi lại";
        }
        if (!currentUser.getOtp().equals(otpInput)) {
            return "Mã OTP không chính xác";
        }
        currentUser.setActive(true);
        currentUser.setOtp(null);
        currentUser.setOtpExpiredAt(null);
        userRepository.save(currentUser);

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

        String newOtp = String.format("%06d", new Random().nextInt(999999));
        user.setOtp(newOtp);
        user.setOtpExpiredAt(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        // Gửi mail lại
        sendOtp(email, newOtp);
        return "Mã OTP mới đã được gửi vào hòm thư của bạn!";
    }
}
