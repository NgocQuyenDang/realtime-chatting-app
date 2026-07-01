package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "user")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private long id;

    private String fullname;
    private String email;
    private String password;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "otp", length = 6)
    private String otp;

    @Column(name = "otp_expired_at")
    private LocalDateTime otpExpiredAt;

    @Column(name = "is_active")
    private boolean isActive = false;


}
