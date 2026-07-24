package com.example.demo.repository;

import com.example.demo.dto.response.ConversationListResponse;
import com.example.demo.dto.response.IConversationListResponse;
import com.example.demo.entity.ConversationMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface ConversationMemberRepository extends JpaRepository<ConversationMember, Long> {

    // Tìm kiếm nguời dùng khác đã nhắn tin với mình bao giờ chưa
    @Query("SELECT cm.conversation.id FROM ConversationMember cm " +
            "WHERE cm.user.id IN (:currentUserId, :targetUserId) " +
            "AND cm.conversation.isGroup = false " +
            "GROUP BY cm.conversation.id " +
            "HAVING COUNT(DISTINCT cm.user.id) = 2")
    Optional<Long> findPrivateConversationId(@Param("currentUserId") long currentUserId, @Param("targetUserId") long targetUserId);

    @Query(value = "SELECT cm.conversation_id AS conversationId, " +
            "       u.fullname AS name, " +
            "       (SELECT m.content FROM message m WHERE m.conversation_id = cm.conversation_id ORDER BY m.created_at DESC LIMIT 1) AS lastMsg " +
            "FROM conversationmember cm " +
            "JOIN conversationmember partner ON cm.conversation_id = partner.conversation_id AND partner.user_id <> :userId " +
            "JOIN user u ON partner.user_id = u.user_id " +
            "WHERE cm.user_id = :userId", nativeQuery = true)
    List<IConversationListResponse> findConversationsListByUserId(@Param("userId") Long userId);
}
