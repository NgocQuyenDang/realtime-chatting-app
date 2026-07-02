package com.example.demo.repository;

import com.example.demo.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    // Lấy lịch sử tin nhắn của phòng và sắp xếp theo thời gian tăng dần (Tin cũ trước, tin mới sau)
    List<Message> findByConversationIdOrderByCreatedAtAsc(long conversationId);

    // Lấy ra duy nhất 1 tin nhắn mới nhất của phòng để hiển thị xem trước ở thanh bên trái
    Message findFirstByConversationIdOrderByCreatedAtDesc(long conversationId);
}
