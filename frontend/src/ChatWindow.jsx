import {useEffect, useState} from "react";
import "./ChatWindow.css";
import axios from "axios";

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
    const [messages, setMessages] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [messageInput, setMessageInput] = useState("");
    const [chatHistory, setChatHistory] = useState({});
    const [conversations, setConversations] = useState([]);

    //State để quản lý từ khóa tìm kiếm và kết quả tìm kiếm
    const [searchKeyword, setSearchKeyword] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    // --- CÁC HÀM XỬ LÝ SỰ KIỆN ---
    // Haàm hiện thông tin nguời dùng hiện tại
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get("http://localhost:8080/user-profile");
                setCurrentUser({
                    fullname: response.data.fullname,
                    email: response.data.email,
                })
            } catch (error) {
                console.log(error);
                alert("Vui lòng đăng nhập lại");
                window.location.href = "/login";
            }
        };
        fetchUserData();
    }, [])

    // Hàm xử lý gõ chữ tìm kiếm user
    const handleSearch = (text) => {
        setSearchKeyword(text);

        if (!text.trim()) {
            setSearchResults([]);
            return;
        }
        triggerApiSearch(text);
    };

    // Hàm này mới là hàm async chịu trách nhiệm gọi API chạy ngầm
    const triggerApiSearch = async (text) => {
        try {
            const response = await axios.get(`http://localhost:8080/home/search?keyword=${text}`);
            setSearchResults(response.data);
        } catch (error) {
            console.error("Lỗi khi kết nối API tìm kiếm:", error);
        }
    };

    // Hàm đổi giao diện hộp chat khi bấm chọn người dùng
    const handleSelectUser = async (user) => {
        const response = await axios.post("http://localhost:8080/access", {
            targetUserId : user.id
        })

        const conversationId = response.data.id;

        const roomInfo = {
            id: conversationId,
            targetUserId: user.id,
            name: user.name
        };

        setSelectedRoom(roomInfo);
        setMessages(chatHistory[conversationId] || []);
        setMessageInput("");
        setSearchKeyword(""); // Bấm xong thì xóa thanh tìm kiếm đi cho gọn
        setSearchResults([]);
    };

    const handleSendMessage = () => {
        if (!messageInput.trim()) return;

        const newMsg = {
            id: messages.length + 1,
            senderId: 1,
            text: messageInput,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const updatedMessages = [...messages, newMsg]
        setMessages([...messages, newMsg]);
        setChatHistory({
            ...chatHistory,
            [selectedRoom.id]: updatedMessages});

        const isExist = conversations.some(chat => chat.id === selectedRoom.id);

        if (!isExist) {
            // Nếu là người mới từ ô Tìm Kiếm, tạo phòng chat đưa lên ĐẦU danh sách trái
            const newRoom = {
                id: selectedRoom.id,
                name: selectedRoom.name,
                lastMsg: messageInput // Lấy tin nhắn vừa gõ làm tin nhắn cuối cùng
            };
            setConversations([newRoom, ...conversations]);
        } else {
            // Nếu đã có sẵn, cập nhật lại nội dung tin nhắn mới nhất
            const updatedConversations = conversations.map(chat => {
                if (chat.id === selectedRoom.id) {
                    return { ...chat, lastMsg: messageInput };
                }
                return chat;
            });
            setConversations(updatedConversations);
        }

        setMessageInput("");
    };

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
                                    const isMe = msg.senderId === 1;
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