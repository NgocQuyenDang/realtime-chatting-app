package com.example.demo.repository;

import com.example.demo.entity.ConversationMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationMemberRepository extends JpaRepository<ConversationMember, Long> {
    // Lấy các cuộc hội thoại thuộc về User hiện tại
    List<ConversationMember> findByUserId(long userId);

    // Tìm kiếm nguời dùng khác đã nhắn tin với mình bao giờ chưa
    @Query("SELECT cm.conversation.id FROM ConversationMember cm " +
            "WHERE cm.user.id IN (:currentUserId, :targetUserId) " +
            "AND cm.conversation.isGroup = false " +
            "GROUP BY cm.conversation.id " +
            "HAVING COUNT(DISTINCT cm.user.id) = 2")
    Optional<Long> findPrivateConversationId(@Param("currentUserId") long currentUserId, @Param("targetUserId") long targetUserId);
}
