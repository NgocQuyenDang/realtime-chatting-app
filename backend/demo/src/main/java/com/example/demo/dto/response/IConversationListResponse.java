package com.example.demo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

public interface IConversationListResponse {
    Long getConversationId();
    String getName();
    String getLastMsg();
}