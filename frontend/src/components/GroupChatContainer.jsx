import { useEffect, useRef } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/utils";

const GroupChatContainer = () => {
    const {
        groupMessages,
        getGroupMessages,
        isGroupMessagesLoading,
        selectedGroup,
        subscribeToGroupMessages,
        unsubscribeFromGroupMessages,
    } = useGroupStore();
    const { authUser } = useAuthStore();
    const messageEndRef = useRef(null);

    useEffect(() => {
        if (selectedGroup) {
            getGroupMessages(selectedGroup._id);
            subscribeToGroupMessages();
        }

        return () => unsubscribeFromGroupMessages();
    }, [selectedGroup, getGroupMessages, subscribeToGroupMessages, unsubscribeFromGroupMessages]);

    useEffect(() => {
        if (messageEndRef.current && groupMessages) {
            messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [groupMessages]);

    if (isGroupMessagesLoading) {
        return (
            <div className="flex-1 flex flex-col overflow-auto">
                <ChatHeader />
                <MessageSkeleton />
                <MessageInput />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-auto">
            <ChatHeader />

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {groupMessages.map((message) => (
                    <div
                        key={message._id}
                        className={`chat ${message.senderId._id === authUser._id ? "chat-end" : "chat-start"}`}
                        ref={messageEndRef}
                    >
                        <div className="chat-image avatar">
                            <div className="size-10 rounded-full border">
                                <img
                                    src={message.senderId.profilePic || "/avatar.png"}
                                    alt={message.senderId.fullName}
                                />
                            </div>
                        </div>
                        <div className="chat-header mb-1">
                            <span className="font-semibold">{message.senderId.fullName}</span>
                            <time className="text-xs opacity-50 ml-1">
                                {formatMessageTime(message.createdAt)}
                            </time>
                        </div>
                        <div className="chat-bubble flex flex-col">
                            {message.image && (
                                <img
                                    src={message.image}
                                    alt="Attachment"
                                    className="sm:max-w-[200px] rounded-md mb-2"
                                />
                            )}
                            {message.video && (
                                <video
                                    src={message.video}
                                    controls
                                    className="sm:max-w-[300px] rounded-md mb-2"
                                />
                            )}
                            {message.text && <p>{message.text}</p>}
                        </div>
                    </div>
                ))}
            </div>

            <MessageInput />
        </div>
    );
};

export default GroupChatContainer;
