import { useChatStore } from "../store/useChatStore";
import { useRequestStore } from "../store/useRequestStore";
import { useEffect, useRef, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { UserPlus, Clock, Loader2 } from "lucide-react";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const { getRequestStatus, sendRequest, requestStatus } = useRequestStore();
  const messageEndRef = useRef(null);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [isCheckingRequest, setIsCheckingRequest] = useState(true);

  useEffect(() => {
    const checkRequest = async () => {
      setIsCheckingRequest(true);
      const request = await getRequestStatus(selectedUser._id);
      setCurrentRequest(request);
      setIsCheckingRequest(false);
    };

    checkRequest();
    getMessages(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages, getRequestStatus]);

  // Update current request from store cache
  useEffect(() => {
    const cachedRequest = requestStatus[selectedUser._id];
    if (cachedRequest) {
      setCurrentRequest(cachedRequest);
    }
  }, [requestStatus, selectedUser._id]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendRequest = async () => {
    try {
      const request = await sendRequest(selectedUser._id);
      setCurrentRequest(request);
    } catch (error) {
      console.error("Error sending request:", error);
    }
  };

  if (isMessagesLoading || isCheckingRequest) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
      </div>
    );
  }

  // Check if chat is allowed
  const canChat = currentRequest?.status === "accepted" || messages.length > 0;
  const isPending = currentRequest?.status === "pending";
  const isRequester = currentRequest?.requester?._id === authUser._id;

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
            ref={messageEndRef}
          >
            <div className=" chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
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

      {/* Conditional rendering based on request status */}
      {canChat ? (
        <MessageInput />
      ) : isPending ? (
        <div className="p-4 bg-base-200 border-t border-base-300">
          <div className="flex items-center justify-center gap-2 text-base-content/60">
            <Clock className="w-5 h-5" />
            <p>
              {isRequester
                ? `Waiting for ${selectedUser.fullName} to accept your chat request`
                : "You have a pending chat request from this user"}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-base-200 border-t border-base-300">
          <div className="flex flex-col items-center justify-center gap-3">
            <p className="text-base-content/60">
              Send a chat request to start messaging {selectedUser.fullName}
            </p>
            <button onClick={handleSendRequest} className="btn btn-primary gap-2">
              <UserPlus className="w-5 h-5" />
              Send Chat Request
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default ChatContainer;
