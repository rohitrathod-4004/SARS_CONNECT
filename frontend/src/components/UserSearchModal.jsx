import { useState } from "react";
import { Search, X, UserPlus, Loader2 } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import { useRequestStore } from "../store/useRequestStore";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";

const UserSearchModal = ({ onClose }) => {
    const [searchEmail, setSearchEmail] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const { sendRequest, getRequestStatus, requestStatus } = useRequestStore();
    const { setSelectedUser, setChatType } = useChatStore();

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchEmail.trim()) {
            toast.error("Please enter an email to search");
            return;
        }

        setIsSearching(true);
        try {
            const res = await axiosInstance.get(`/messages/search?email=${searchEmail}`);
            setSearchResults(res.data);
            if (res.data.length === 0) {
                toast("No users found with that email");
            }
        } catch (error) {
            console.error("Error searching users:", error);
            toast.error("Failed to search users");
        } finally {
            setIsSearching(false);
        }
    };

    const handleSendRequest = async (user) => {
        try {
            await sendRequest(user._id);
            // Remove from search results after sending request
            setSearchResults(searchResults.filter((u) => u._id !== user._id));
        } catch (error) {
            console.error("Error sending request:", error);
        }
    };

    const handleStartChat = (user) => {
        setSelectedUser(user);
        setChatType("direct");
        onClose();
    };

    const getButtonForUser = (user) => {
        const request = requestStatus[user._id];

        if (request?.status === "accepted") {
            return (
                <button
                    onClick={() => handleStartChat(user)}
                    className="btn btn-sm btn-primary"
                >
                    Chat
                </button>
            );
        }

        if (request?.status === "pending") {
            return (
                <span className="badge badge-warning">Pending</span>
            );
        }

        return (
            <button
                onClick={() => handleSendRequest(user)}
                className="btn btn-sm btn-ghost gap-1"
            >
                <UserPlus className="w-4 h-4" />
                Send Request
            </button>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-base-100 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-base-300">
                    <h2 className="text-xl font-semibold">Search Users</h2>
                    <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Form */}
                <div className="p-4 border-b border-base-300">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
                            <input
                                type="email"
                                value={searchEmail}
                                onChange={(e) => setSearchEmail(e.target.value)}
                                placeholder="Search by email..."
                                className="input input-bordered w-full pl-10"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSearching}
                            className="btn btn-primary"
                        >
                            {isSearching ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Search"
                            )}
                        </button>
                    </form>
                </div>

                {/* Search Results */}
                <div className="flex-1 overflow-y-auto p-4">
                    {searchResults.length === 0 && !isSearching && (
                        <div className="text-center py-12">
                            <Search className="w-12 h-12 mx-auto text-base-content/30 mb-3" />
                            <p className="text-base-content/60">
                                Search for users by email to send chat requests
                            </p>
                        </div>
                    )}

                    {isSearching && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    )}

                    <div className="space-y-3">
                        {searchResults.map((user) => (
                            <div
                                key={user._id}
                                className="flex items-center gap-3 p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors"
                            >
                                <img
                                    src={user.profilePic || "/avatar.png"}
                                    alt={user.fullName}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold truncate">{user.fullName}</h3>
                                    <p className="text-sm text-base-content/60 truncate">{user.email}</p>
                                </div>
                                {getButtonForUser(user)}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserSearchModal;
