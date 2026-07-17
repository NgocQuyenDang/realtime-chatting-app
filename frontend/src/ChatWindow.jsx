import { useEffect, useRef, useState } from "react";
import "./ChatWindow.css";
import axios from "axios";
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
axios.defaults.withCredentials = true;

function ChatWindow() {
    useEffect(() => {
        document.title = "GoChat";
    }, []);

    // --- CÁC STATE QUẢN LÝ ---
    const [currentUser, setCurrentUser] = useState({
        id: null, // Lưu ID trực tiếp ở đây để quản lý đồng bộ
        fullname: "Đang tải...",
        email: "..."
    });

    const [messages, setMessages] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [messageInput, setMessageInput] = useState("");
    const [conversations, setConversations] = useState([]);

    const [searchKeyword, setSearchKeyword] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    const stompClient = useRef(null);
    const subscriptionRef = useRef(null); // Ref để quản lý lượt subscribe hiện tại

    // 1. Fetch dữ liệu User hiện tại & Danh sách phòng chat khi load trang
    useEffect(() => {
        const fetchUserDataAndConversations = async () => {
            try {
                const profileResponse = await axios.get(`${BACKEND_URL}/user-profile`);
                const userObj = {
                    id: Number(profileResponse.data.id),
                    fullname: profileResponse.data.fullname,
                    email: profileResponse.data.email,
                };
                setCurrentUser(userObj);

                const convResponse = await axios.get(`${BACKEND_URL}/my-conversations`);
                const formattedConversations = convResponse.data.map(conv => ({
                    conversationId: conv.conversationId,
                    targetUserName: conv.conversationName,
                    lastMsg: conv.lastMsg || "Chưa có tin nhắn nào",
                    isUnread: false
                }));

                setConversations(formattedConversations);

            } catch (error) {
                console.error(error);
                alert("Vui lòng đăng nhập lại");
                window.location.href = "/login";
            }
        };
        fetchUserDataAndConversations();
    }, []);

    // 2. Quản lý vòng đời kết nối WebSocket (Chỉ kết nối DUY NHẤT 1 lần khi có currentUser.id)
    useEffect(() => {
        if (!currentUser.id) return;

        const socket = new SockJS(`${BACKEND_URL}/ws-chat`);
        const client = Stomp.over(socket);

        // Tắt log debug chi tiết của Stomp để tránh làm rác màn hình console f12
        client.debug = null;

        client.connect({}, () => {
            console.log("WebSocket connected successfully!");
            stompClient.current = client;

            // Nếu đang chọn sẵn phòng nào thì tự động subscribe vào phòng đó ngay
            if (selectedRoom) {
                subscribeToRoom(selectedRoom.id);
            }
        }, (err) => {
            console.error("WebSocket connection error:", err);
        });

        return () => {
            if (stompClient.current) {
                stompClient.current.disconnect(() => {
                    console.log("WebSocket disconnected.");
                });
            }
        };
    }, [currentUser.id]); // Chạy lại khi thông tin người dùng được lấy thành công

    // 3. Hàm subscribe vào một phòng chat cụ thể (gọi mỗi khi selectedRoom thay đổi)
    const subscribeToRoom = (roomId) => {
        if (!stompClient.current || !stompClient.current.connected) return;

        // Hủy đăng ký phòng cũ trước khi vào phòng mới
        if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe();
        }

        // Đăng ký phòng mới
        subscriptionRef.current = stompClient.current.subscribe(`/topic/room/${roomId}`, (response) => {
            const rawMsg = JSON.parse(response.body);

            const newIncomingMsg = {
                id: rawMsg.id,
                senderId: Number(rawMsg.senderId),
                text: rawMsg.text,
                time: rawMsg.time
            };

            // 1. Cập nhật tin nhắn vào khung chat bên phải
            setMessages((prev) => [...prev, newIncomingMsg]);

            // 2. Cập nhật và đẩy phòng chat lên đầu danh sách bên trái
            setConversations((prevConversations) => {
                const existingIndex = prevConversations.findIndex(c => c.conversationId === roomId);
                let updatedConversations = [...prevConversations];

                // Xác định tin nhắn này có phải của người khác gửi đến không
                const isFromOther = Number(rawMsg.senderId) !== Number(currentUser.id);

                if (existingIndex !== -1) {
                    const targetConv = { ...updatedConversations[existingIndex] };
                    targetConv.lastMsg = rawMsg.text;

                    // Nếu người khác gửi tới, đánh dấu chưa đọc (isUnread = true)
                    if (isFromOther) {
                        targetConv.isUnread = true;
                    }

                    updatedConversations.splice(existingIndex, 1);
                    updatedConversations.unshift(targetConv);
                } else {
                    const newConv = {
                        conversationId: roomId,
                        targetUserName: selectedRoom?.name || "Người dùng",
                        lastMsg: rawMsg.text,
                        isUnread: isFromOther
                    };
                    updatedConversations.unshift(newConv);
                }

                // Sắp xếp: Ưu tiên phòng chưa đọc lên trên, hoặc cứ để phòng mới nhắn lên đầu
                return updatedConversations.sort((a, b) => b.isUnread - a.isUnread);
            });
        });
    };

    // 4. Lắng nghe sự kiện đổi phòng chat để cập nhật Subscribe đường truyền
    useEffect(() => {
        if (selectedRoom && stompClient.current && stompClient.current.connected) {
            subscribeToRoom(selectedRoom.id);
        }
    }, [selectedRoom]);

    // Hàm xử lý gõ chữ tìm kiếm user
    const handleSearch = (text) => {
        setSearchKeyword(text);
        if (!text.trim()) {
            setSearchResults([]);
            return;
        }
        triggerApiSearch(text);
    };

    // Hàm gọi API chạy ngầm
    const triggerApiSearch = async (text) => {
        try {
            const response = await axios.get(`${BACKEND_URL}/home/search?keyword=${text}`);
            setSearchResults(response.data);
        } catch (error) {
            console.error("Lỗi khi kết nối API tìm kiếm:", error);
        }
    };

    // Hàm đổi giao diện hộp chat khi bấm chọn người dùng hoặc phòng chat cũ
    const handleSelectUser = async (user) => {
        try {
            let conversationId = null;
            let targetUserId = null;

            if (user.fullname) {
                const response = await axios.post(`${BACKEND_URL}/start-conversation`, {
                    targetUserId: user.id
                });
                conversationId = response.data.conversationId;
                targetUserId = user.id;
            } else {
                conversationId = user.conversationId;
                targetUserId = user.targetUserId || null;
            }

            // Khi bấm vào phòng, tắt ngay thông báo đỏ (chưa đọc) của phòng đó
            setConversations(prev =>
                prev.map(c => c.conversationId === conversationId ? { ...c, isUnread: false } : c)
            );

            // Gọi API lấy lịch sử nhắn tin
            const msgHistory = await axios.get(`${BACKEND_URL}/chat-history?conversationId=${conversationId}`);
            const formattedMessages = msgHistory.data.map(msg => ({
                id: msg.id,
                senderId: Number(msg.senderId),
                text: msg.content,
                time: msg.time
            }));

            const roomInfo = {
                id: conversationId,
                targetUserId: targetUserId,
                name: user.targetUserName || user.fullname
            };

            setSelectedRoom(roomInfo);
            setMessages(formattedMessages);
            setMessageInput("");
            setSearchKeyword("");
            setSearchResults([]);

        } catch (error) {
            console.error("Lỗi khi kết nối phòng chat:", error);
            if (error.response) {
                alert("Lỗi từ hệ thống: " + error.response.data);
            } else {
                alert("Không thể kết nối đến máy chủ.");
            }
        }
    };

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedRoom || !stompClient.current) return;

        const messagePayload = {
            content: messageInput.trim()
        };
        stompClient.current.send(`/app/chat/${selectedRoom.id}`, {}, JSON.stringify(messagePayload));
        setMessageInput("");
    };

    return (
        <div className="chat-app-wrapper">
            {/* ====== CỘT 1: THANH LỊCH SỬ USER & TÌM KIẾM BÊN TRÁI ====== */}
            <aside className="chat-sidebar">
                <div className="sidebar-current-user">
                    <div className="current-user-info">
                        <h4>{currentUser.fullname}</h4>
                        <span>{currentUser.email}</span>
                    </div>
                </div>

                <div className="chat-search-container">
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            id="search-users"
                            name="search-users"
                            placeholder="🔍 Tìm kiếm bạn bè mới..."
                            autoComplete="off"
                            value={searchKeyword}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                    {searchKeyword && (
                        <div className="search-dropdown">
                            {searchResults.length > 0 ? (
                                searchResults.map(user => (
                                    <div key={user.id} className="search-user-item" onClick={() => handleSelectUser(user)}>
                                        <div className="search-user-info">
                                            <p>{user.fullname}</p>
                                            <span>{user.email}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-result">Không tìm thấy thành viên</div>
                            )}
                        </div>
                    )}
                </div>

                <div className="conversations-list">
                    {conversations.map(chat => (
                        <div
                            key={chat.conversationId}
                            className={`conversation-card ${selectedRoom?.id === chat.conversationId ? "active" : ""}`}
                            onClick={() => handleSelectUser(chat)}
                        >
                            <div className="card-body">
                                <span className="room-name">{chat.targetUserName}</span>
                                <span className="room-preview-text">{chat.lastMsg}</span>
                            </div>
                            {chat.isUnread && <span className="unread-dot"></span>}
                        </div>
                    ))}
                </div>
            </aside>

            {/* ====== CỘT 2: MÀN HÌNH CHAT BÊN PHẢI ====== */}
            <main className="chat-main-content">
                {selectedRoom ? (
                    <>
                        <header className="chat-main-header">
                            <div className="header-user-info">
                                <h3>{selectedRoom.name}</h3>
                            </div>
                        </header>

                        <div className="chat-messages-container">
                            {messages.length > 0 ? (
                                messages.map((msg) => {
                                    const isMe = Number(msg.senderId) === Number(currentUser.id);
                                    return (
                                        <div key={msg.id} className={`message-wrapper ${isMe ? "me" : "other"}`}>
                                            <div className="message-block">
                                                <div className="message-bubble">
                                                    <p>{msg.text}</p>
                                                </div>
                                                <span className="message-time">{msg.time}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="no-messages">Chưa có tin nhắn nào. Hãy gửi tin nhắn để bắt đầu cuộc trò chuyện!</div>
                            )}
                        </div>

                        <footer className="chat-footer-input">
                            <div className="input-box-wrapper">
                                <input
                                    type="text"
                                    placeholder={`Nhắn tin cho ${selectedRoom.name}...`}
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                />
                                <button className="btn-send-message" onClick={handleSendMessage} disabled={!messageInput.trim()}>
                                    <span>Gửi</span> 🚀
                                </button>
                            </div>
                        </footer>
                    </>
                ) : (
                    <div className="welcome-screen">
                        <h3>Chào mừng bạn đến với GoChat! 👋</h3>
                        <p>Hãy chọn một cuộc trò chuyện hoặc tìm kiếm bạn bè mới ở thanh bên trái để bắt đầu nhắn tin.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default ChatWindow;