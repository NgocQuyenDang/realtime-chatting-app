package com.example.demo.service;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LogInService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder encoder;

    public User verifyAccount(String email,String password){
        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("Email bạn nhập không chính xác"));

        if (!user.isActive()) {
            throw new RuntimeException("Tài khoản chưa được kích hoạt");
        }

        if (!encoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Sai mật khẩu");
        }

        return user;
    }
}
