package com.example.demo.service;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class LoginService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder encoder;

    public String verifyAccount(String email,String password){
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isEmpty()) return "Email bạn nhập không chính xác";

        if (!user.get().isActive()) {
            return "Tài khoản chưa được kích hoạt, hãy nhập lại mã OTP";
        }
        if (!encoder.matches(password,user.get().getPassword())) {
            return "Sai mật khẩu";
        }
        return "Đăng nhập thành công";
    }
}
