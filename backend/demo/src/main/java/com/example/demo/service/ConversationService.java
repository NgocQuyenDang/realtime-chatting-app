package com.example.demo.service;

import com.example.demo.dto.response.ConversationListResponse;
import com.example.demo.entity.Conversation;
import com.example.demo.entity.ConversationMember;
import com.example.demo.entity.User;
import com.example.demo.repository.ConversationMemberRepository;
import com.example.demo.repository.ConversationRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final ConversationMemberRepository memberRepository;

    @Transactional
    public Long getOrCreateConversation(long currentUserId, long targetUserId) {
        Optional<Long> existingId = memberRepository.findPrivateConversationId(currentUserId, targetUserId);
        if (existingId.isPresent()) {
            return existingId.get();
        }

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng hiện tại"));
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng đã tìm kiếm"));

        Conversation conversation = new Conversation();
        conversation.setGroup(false);
        conversation.setName(currentUser.getFullname() + " - " + targetUser.getFullname());
        conversation.setCreatedAt(LocalDateTime.now());

        Conversation savedConversation = conversationRepository.save(conversation);

        ConversationMember currentMember = createConversationMember(savedConversation, currentUser);
        ConversationMember targetMember = createConversationMember(savedConversation, targetUser);

        memberRepository.save(currentMember);
        memberRepository.save(targetMember);

        return savedConversation.getId();
    }

    @Transactional(readOnly = true)
    public List<ConversationListResponse> getConversationsList(Long userId) {
        // Gọi repo lấy ra danh sách Interface
        List<com.example.demo.dto.response.IConversationListResponse> rawList = memberRepository.findConversationsListByUserId(userId);

        // Map ngược lại Class DTO cũ để trả về cho Controller
        return rawList.stream().map(item -> new ConversationListResponse(
                item.getConversationId(),
                item.getName(),
                item.getLastMsg(),
                false
        )).toList();
    }

    private ConversationMember createConversationMember(Conversation conversation, User user) {
        ConversationMember member = new ConversationMember();
        member.setConversation(conversation);
        member.setUser(user);
        member.setJoinedAt(LocalDateTime.now());
        return member;
    }
}