import {useEffect, useState} from "react";
import "./ChatWindow.css";
import axios from "axios";

axios.defaults.withCredentials = true;

function ChatWindow() {
    // Thông tin của bạn (Người dùng đang đăng nhập)
    const [currentUser, setCurrentUser] = useState({
        fullname: "Đang tải...",
        email: "..."
    });

    // Dữ liệu mẫu danh sách lịch sử người dùng cũ bên trái
    const mockConversations = [
        { id: 101, name: "Nguyễn Văn A", lastMsg: "Ê tí nữa có đi đá bóng không ông?" },
        { id: 102, name: "Trần Thị B", lastMsg: "Vâng để em check lại file báo cáo..." },
        { id: 103, name: "Sếp Tổng Hoàng", lastMsg: "Dự án GoChat chạy đến đâu rồi em?" },
    ];

    // Dữ liệu mẫu danh sách kết quả khi tìm kiếm user mới
    const mockUsersDatabase = [
        { id: 201, fullname: "Lê Hoàng Long", email: "longlh@gmail.com" },
        { id: 202, fullname: "Phạm Minh Tuấn", email: "tuanpm@gmail.com" },
    ];

    // Dữ liệu mẫu lưu lịch sử tin nhắn riêng biệt cho từng người
    const mockMessagesRepository = {
        101: [
            { id: 1, senderId: 2, text: "Chào ông, API đăng nhập xong chưa?", time: "10:25 AM" },
            { id: 2, senderId: 1, text: "Ngon lành rồi ông ơi.", time: "10:26 AM" },
            { id: 3, senderId: 2, text: "Ê tí nữa có đi đá bóng không ông?", time: "10:30 AM" },
        ],
        102: [
            { id: 1, senderId: 3, text: "Anh ơi xem hộ em cái giao diện này với.", time: "Hôm qua" },
            { id: 2, senderId: 1, text: "Giao diện được rồi đó em.", time: "Hôm qua" },
            { id: 3, senderId: 3, text: "Vâng để em check lại file báo cáo...", time: "Hôm qua" },
        ],
        103: [
            { id: 1, senderId: 4, text: "Tiến độ tuần này thế nào rồi?", time: "28 thg 6" },
            { id: 2, senderId: 1, text: "Dạ em đang hoàn thiện nốt khung chat.", time: "28 thg 6" },
            { id: 3, senderId: 4, text: "Dự án GoChat chạy đến đâu rồi em?", time: "28 thg 6" },
        ]
    };

    // --- CÁC STATE QUẢN LÝ ---
    const [messages, setMessages] = useState(mockMessagesRepository[101]);
    const [selectedRoom, setSelectedRoom] = useState(mockConversations[0]);
    const [messageInput, setMessageInput] = useState("");

    // Thêm lại State để quản lý từ khóa tìm kiếm và kết quả tìm kiếm
    const [searchKeyword, setSearchKeyword] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    // --- CÁC HÀM XỬ LÝ SỰ KIỆN ---
    // Haàm hiện thông tin nguời dùng hiện tại
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get("http://localhost:8080/home");
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
        // Giả lập lọc danh sách user theo tên từ database mẫu
        const filtered = mockUsersDatabase.filter(user =>
            user.fullname.toLowerCase().includes(text.toLowerCase())
        );
        setSearchResults(filtered);
    };

    // Hàm đổi giao diện hộp chat khi bấm chọn người dùng
    const handleSelectUser = (room) => {
        setSelectedRoom(room);
        setMessages(mockMessagesRepository[room.id] || []);
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

        setMessages([...messages, newMsg]);
        if(mockMessagesRepository[selectedRoom.id]) {
            mockMessagesRepository[selectedRoom.id].push(newMsg);
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

                {/* 2. THANH TÌM KIẾM ĐÃ QUAY TRỞ LẠI */}
                <div className="chat-search-container">
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="🔍 Tìm kiếm bạn bè mới..."
                            value={searchKeyword}
                            onChange={(e) => handleSearch(e.target.value)}
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
                    {mockConversations.map(chat => (
                        <div
                            key={chat.id}
                            className={`conversation-card ${selectedRoom.id === chat.id ? "active" : ""}`}
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
                <header className="chat-main-header">
                    <div className="header-user-info">
                        <h3>{selectedRoom.name}</h3>
                    </div>
                </header>

                <div className="chat-messages-container">
                    {messages.map((msg) => {
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
                    })}
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
            </main>

        </div>
    );
}

export default ChatWindow;