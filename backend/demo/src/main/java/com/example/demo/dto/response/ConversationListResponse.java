package com.example.demo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversationListResponse {
    private Long conversationId;
    private String conversationName;
    private String lastMsg;
    private Boolean isGroup;
}