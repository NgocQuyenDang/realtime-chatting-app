import {useEffect, useRef, useState} from "react";
import "./ChatWindow.css";
import axios from "axios";
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

axios.defaults.withCredentials = true;

function ChatWindow() {
    useEffect(() => {
        document.title = "GoChat";
    }, [])
    // Thông tin của bạn (Người dùng đang đăng nhập)
    const [currentUser, setCurrentUser] = useState({
        fullname: "Đang tải...",
        email: "..."
    });

    // --- CÁC STATE QUẢN LÝ ---
    const [currentUserId, setCurrentUserId] = useState(currentUser.id);
    const [messages, setMessages] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [messageInput, setMessageInput] = useState("");
    const [chatHistory, setChatHistory] = useState({});
    const [conversations, setConversations] = useState([]);

    //State để quản lý từ khóa tìm kiếm và kết quả tìm kiếm
    const [searchKeyword, setSearchKeyword] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    let stompClient = useRef(null);

    useEffect(() => {
        const fetchUserDataAndConversations = async () => {
            try {
                //Lấy profile user
                const profileResponse = await axios.get("http://localhost:8080/user-profile");
                setCurrentUser({
                    fullname: profileResponse.data.fullname,
                    email: profileResponse.data.email,
                });
                setCurrentUserId(Number(profileResponse.data.id));

                // API LẤY DANH SÁCH LỊCH SỬ CHAT
                const convResponse = await axios.get("http://localhost:8080/my-conversations");

                // Map dữ liệu từ Backend trả về sao cho khớp với các trường hiển thị của cột bên trái
                const formattedConversations = convResponse.data.map(conv => ({
                    id: conv.conversationId, // ID của phòng chat
                    name: conv.name,         // Tên người kia (hoặc tên nhóm)
                    lastMsg: conv.lastMsg || "Chưa có tin nhắn nào" // Tin nhắn cuối cùng để xem trước
                }));

                // Cập nhật vào state conversations để ra danh sách bên trái
                setConversations(formattedConversations);

            } catch (error) {
                console.log(error);
                alert("Vui lòng đăng nhập lại");
                window.location.href = "/login";
            }
        };
        fetchUserDataAndConversations();
    }, []);

    // Hàm xử lý gõ chữ tìm kiếm user
    const handleSearch = (text) => {
        setSearchKeyword(text);

        if (!text.trim()) {
            setSearchResults([]);
            return;
        }
        triggerApiSearch(text);
    };

    // Hàm chịu trách nhiệm gọi API chạy ngầm
    const triggerApiSearch = async (text) => {
        try {
            const response = await axios.get(`http://localhost:8080/home/search?keyword=${text}`);
            setSearchResults(response.data);
        } catch (error) {
            console.error("Lỗi khi kết nối API tìm kiếm:", error);
        }
    };

    // Hàm đổi giao diện hộp chat khi bấm chọn người dùng
    // Hàm đổi giao diện hộp chat khi bấm chọn người dùng hoặc phòng chat cũ
    const handleSelectUser = async (user) => {
        try {
            let conversationId = null;
            let targetUserId = null;

            // KIỂM TRA: Nếu object có thuộc tính 'lastMsg' tức là người dùng đang bấm từ danh sách bên trái (phòng đã có sẵn)
            if (Object.prototype.hasOwnProperty.call(user, 'lastMsg')) {
                conversationId = user.id; // Đối với danh sách bên trái, user.id chính là conversationId
                targetUserId = user.targetUserId || null; // Nếu backend chưa trả về targetUserId thì tạm thời để null
            } else {
                // Ngược lại, nếu bấm từ ô Tìm kiếm (chưa có phòng), bắt buộc phải gọi API /access để lấy/tạo phòng
                const response = await axios.post("http://localhost:8080/access", {
                    targetUserId: user.id // user.id từ ô tìm kiếm chính là ID của người nhận
                });
                conversationId = response.data.conversationId;
                targetUserId = user.id;
            }

            // Gọi API lấy lịch sử nhắn tin bằng conversationId đã xác định ở trên
            const msgHistory = await axios.get(`http://localhost:8080/chat-history?conversationId=${conversationId}`);

            const formattedMessages = msgHistory.data.map(msg => ({
                id: msg.id,
                senderId: msg.user?.id,
                text: msg.content,
                time: msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }));

            const roomInfo = {
                id: conversationId,
                targetUserId: targetUserId,
                name: user.name
            };

            setSelectedRoom(roomInfo);
            setMessages(formattedMessages);
            setMessageInput("");
            setSearchKeyword(""); // Bấm xong thì xóa thanh tìm kiếm đi cho gọn
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
        if (!messageInput.trim() || !selectedRoom) return;

        const messagePayload = {
            senderId : currentUserId,
            content : messageInput.trim()
        };
        stompClient.current.send(`/app/chat/${selectedRoom.id}`, {}, JSON.stringify(messagePayload));

        setMessageInput("");
    };

    useEffect(() => {
        if (!selectedRoom) return;

        const socket = new SockJS('http://localhost:8080/ws-chat');
        const client = Stomp.over(socket);

        client.connect({}, () => {
            // 2. Lắng nghe đường truyền riêng của phòng chat này
            client.subscribe(`/topic/room/${selectedRoom.id}`, (response) => {
                const rawMsg = JSON.parse(response.body);

                const newIncomingMsg = {
                    id: rawMsg.id,
                    senderId: rawMsg.senderId,
                    text: rawMsg.text,
                    time: rawMsg.time
                };

                setMessages((prev) => [...prev, newIncomingMsg]);
            });
        });
        stompClient.current = client;
        return () => {
            if (stompClient.current) stompClient.current.disconnect();
        };
    }, [selectedRoom]);

    return (
        <div className="chat-app-wrapper">

            {/* ====== CỘT 1: THANH LỊCH SỬ USER & TÌM KIẾM BÊN TRÁI ====== */}
            <aside className="chat-sidebar">
                {/* 1. Hiển thị User hiện tại trên cùng */}
                <div className="sidebar-current-user">
                    <div className="current-user-info">
                        <h4>{currentUser.fullname}</h4>
                        <span>{currentUser.email}</span>
                    </div>
                </div>

                {/*THANH TÌM KIẾM*/}
                <div className="chat-search-container">
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            id="search-users"
                            name="search-users"
                            placeholder="🔍 Tìm kiếm bạn bè mới..."
                            autoComplete="off"
                            value={searchKeyword}
                            onChange={(e) => {
                                handleSearch(e.target.value);
                            }}
                        />
                    </div>
                    {/* Kết quả tìm kiếm thả xuống (Dropdown) */}
                    {searchKeyword && (
                        <div className="search-dropdown">
                            {searchResults.length > 0 ? (
                                searchResults.map(user => (
                                    <div key={user.id} className="search-user-item" onClick={() => handleSelectUser({ id: user.id, name: user.fullname, lastMsg: "Bắt đầu cuộc trò chuyện mới" })}>
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

                {/* 3. Danh sách các cuộc hội thoại lịch sử */}
                <div className="conversations-list">
                    {conversations.map(chat => (
                        <div
                            key={chat.id}
                            className={`conversation-card ${selectedRoom?.id === chat.id ? "active" : ""}`}
                            onClick={() => handleSelectUser(chat)}
                        >
                            <div className="card-body">
                                <span className="room-name">{chat.name}</span>
                                <span className="room-preview-text">{chat.lastMsg}</span>
                            </div>
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
                                    const isMe = msg.senderId === currentUserId;
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