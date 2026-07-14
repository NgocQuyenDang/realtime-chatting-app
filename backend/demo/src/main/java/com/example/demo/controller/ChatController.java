package com.example.demo.controller;

import com.example.demo.dto.ChatMessageRequest;
import com.example.demo.dto.ChatMessageResponse;
import com.example.demo.dto.MessageHistoryResponse;
import com.example.demo.entity.Message;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final MessageService messageService;

    private final UserRepository userRepository;

    @MessageMapping("/chat/{roomId}")
    @SendTo("/topic/room/{roomId}")
    public ChatMessageResponse sendMessage(
            @DestinationVariable Long roomId,
            @Valid ChatMessageRequest request,
            Principal principal) {

        String email = principal.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Message savedMessage = messageService.saveMessage(
                roomId,
                user.getId(),
                request.getContent()
        );

        return new ChatMessageResponse(
                savedMessage.getId(),
                user.getId(),
                savedMessage.getContent(),
                savedMessage.getCreatedAt()
                        .format(DateTimeFormatter.ofPattern("HH:mm"))
        );
    }

    @GetMapping("/chat-history")
    public ResponseEntity<List<MessageHistoryResponse>> getMessageHistory(@RequestParam Long conversationId) {
        return ResponseEntity.ok(
                messageService.getMessageHistory(conversationId)
        );
    }
}