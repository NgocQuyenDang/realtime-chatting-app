package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Tắt CSRF để React gọi API dạng REST mượt mà
            .csrf(csrf -> csrf.disable())
            
            // Phân quyền đường dẫn công khai
            .authorizeHttpRequests(auth -> auth
                // Cho phép gọi tự do vào các tính năng đăng ký và xác thực
                .requestMatchers("/register", "/verify-otp", "/login", "/resend-otp").permitAll()
                
                // Các tính năng khác sau này làm (như xem data, update) thì phải đăng nhập
                .anyRequest().authenticated()
            );

        return http.build();
    }

    @Bean
    public org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder passwordEncoder() {
        return new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
    }
}