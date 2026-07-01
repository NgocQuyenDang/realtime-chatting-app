package com.example.demo.controller;

import com.example.demo.service.RegisterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Random;

@RestController
@CrossOrigin(origins = "*")
public class RegisterController {
    @Autowired
    private RegisterService registerService;

    @PostMapping("/register")
    public String registerRequest(@RequestBody Map<String,String> request){
        String email =  request.get("email");
        String password =  request.get("password");
        String fullname =  request.get("fullname");

        try {
            registerService.registerRequest(email,password,fullname);
            return "Mã OTP đã được gửi về email của bạn";
        } catch (Exception e) {
            e.printStackTrace();
            return "Không thể gửi OTP, hãy kiểm tra lại email";
        }
    }

    @PostMapping("/verify-otp")
    public String verifyRequest(@RequestBody Map<String,String> request) {
        String email =  request.get("email");
        String otp = request.get("otp");

        String result = registerService.verifyOtp(email,otp);

        return result;
    }

    @PostMapping("/resend-otp")
    public String resendOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        return registerService.resendOtp(email);
    }
}
