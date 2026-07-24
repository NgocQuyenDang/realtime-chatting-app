package com.example.demo.dto.response;

public interface IConversationListResponse {
    Long getConversationId();
    String getPartnerName();
    String getLastMsg();
    Boolean getIsGroup();
}