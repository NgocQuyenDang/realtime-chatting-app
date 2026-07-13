package com.example.demo.controller;

import com.example.demo.entity.Message;
import com.example.demo.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
public class ChatController {
    @Autowired
    MessageService sendMessageService;

    @MessageMapping("/chat/{roomId}") // Lắng nghe tin nhắn từ Frontend gửi lên qua Socket
    @SendTo("/topic/room/{roomId}")   // Tự động phát tán tin nhắn về cho các máy đang mở phòng này
    public Map<String, Object> sendMessageToSocket(@DestinationVariable Long roomId, Map<String, Object> request) {

        // Lấy dữ liệu từ JSON gửi lên
        Long senderId = request.get("senderId") != null ? ((Number) request.get("senderId")).longValue() : null;
        String content = (String) request.get("content");

        Message savedMessage = sendMessageService.saveMessage(roomId, senderId, content);

        return Map.of(
                "id", savedMessage.getId(),
                "senderId", senderId,
                "text", savedMessage.getContent(),
                // Nếu entity Message của bạn có trường createdAt, hãy format nó thành giờ:phút
                "time", new java.text.SimpleDateFormat("HH:mm").format(new java.util.Date())
        );
    }

    @GetMapping("/chat-history")
    public ResponseEntity<List<Message>> getMessageHistory(Long conversationId) {
        List<Message> messages = sendMessageService.getMessageHistory(conversationId);

        return ResponseEntity.ok(messages);
    }
}
