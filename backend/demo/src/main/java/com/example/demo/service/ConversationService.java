package com.example.demo.service;

import com.example.demo.entity.Conversation;
import com.example.demo.entity.ConversationMember;
import com.example.demo.entity.User;
import com.example.demo.repository.ConversationMemberRepository;
import com.example.demo.repository.ConversationRepository;
import com.example.demo.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class ConversationService {
    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ConversationMemberRepository memberRepository;

    @Transactional
    public Long getOrCreateConversation(long currentUserId, long targetUserId) {
        Optional<Long> existingId = memberRepository.findPrivateConversationId(currentUserId, targetUserId);
        if (existingId.isPresent()) {
            return existingId.get();
        }
        Conversation conversation = new Conversation();
        conversation.setGroup(false);
        conversation.setCreatedAt(LocalDateTime.now());

        Conversation newConversation = conversationRepository.save(conversation);

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng hiện tại"));
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng đã tìm kiếm"));
        conversation.setName(currentUser.getFullname() + targetUser.getFullname());
        ConversationMember firstUser = new ConversationMember();
        ConversationMember secondUser = new ConversationMember();

        firstUser.setConversation(newConversation);
        secondUser.setConversation(newConversation);

        firstUser.setUser(currentUser);
        secondUser.setUser(targetUser);

        memberRepository.save(firstUser);
        memberRepository.save(secondUser);

        return newConversation.getId();
    }
}
