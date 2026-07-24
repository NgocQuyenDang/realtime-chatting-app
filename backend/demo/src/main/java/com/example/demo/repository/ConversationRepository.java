package com.example.demo.repository;

import com.example.demo.dto.response.IConversationListResponse;
import com.example.demo.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation,Long> {
    @Query(value = """
        SELECT
            cm.conversation_id AS conversationId,
            u.fullname AS partnerName,
            (
                SELECT m.content
                FROM message m
                WHERE m.conversation_id = cm.conversation_id
                ORDER BY m.created_at DESC
                LIMIT 1
            ) AS lastMsg,
            c.is_group AS isGroup
        FROM conversationmember cm
        JOIN conversation c
            ON c.conversation_id = cm.conversation_id
        JOIN conversationmember partner
            ON partner.conversation_id = cm.conversation_id
            AND partner.user_id <> :userId
        JOIN user u
            ON u.user_id = partner.user_id
        WHERE cm.user_id = :userId
        """, nativeQuery = true)
    List<IConversationListResponse> findConversationsListByUserId(@Param("userId") Long userId);
}
