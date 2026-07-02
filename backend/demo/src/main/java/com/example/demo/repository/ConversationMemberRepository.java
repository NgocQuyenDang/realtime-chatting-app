package com.example.demo.repository;

import com.example.demo.entity.ConversationMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConversationMemberRepository extends JpaRepository<ConversationMember, Long> {
    // Lấy các cuộc hội thoại thuộc về User hiện tại
    List<ConversationMember> findByUserId(long userId);

    // Tìm kiếm nguời dùng khác đã nhắn tin với mình bao giờ chưa
    @Query("SELECT cm1.conversation.id FROM ConversationMember cm1 " +
            "JOIN ConversationMember cm2 ON cm1.conversation.id = cm2.conversation.id " +
            "WHERE cm1.user.id = :currentUserId AND cm2.user.id = :targetUserId " +
            "AND cm1.conversation.isGroup = false")
    Long findPrivateConversationId(@Param("currentUserId") long currentUserId, @Param("targetUserId") long targetUserId);
}
