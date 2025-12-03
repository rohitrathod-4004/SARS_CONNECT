import { X, Settings } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { useState } from "react";
import GroupSettingsModal from "./GroupSettingsModal";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, chatType } = useChatStore();
  const { selectedGroup, setSelectedGroup } = useGroupStore();
  const { onlineUsers } = useAuthStore();
  const [showGroupSettings, setShowGroupSettings] = useState(false);

  const isGroup = chatType === "group";
  const chatData = isGroup ? selectedGroup : selectedUser;

  if (!chatData) return null;

  return (
    <>
      <div className="p-2.5 border-b border-base-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="avatar">
              <div className="size-10 rounded-full relative">
                <img
                  src={isGroup ? chatData.groupPic || "/avatar.png" : chatData.profilePic || "/avatar.png"}
                  alt={isGroup ? chatData.name : chatData.fullName}
                />
                {!isGroup && onlineUsers.includes(selectedUser._id) && (
                  <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
                )}
              </div>
            </div>

            {/* Name and Status */}
            <div>
              <h3 className="font-medium">{isGroup ? chatData.name : chatData.fullName}</h3>
              <p className="text-sm text-base-content/70">
                {isGroup
                  ? `${chatData.members.length} members`
                  : onlineUsers.includes(selectedUser._id)
                    ? "Online"
                    : "Offline"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {isGroup && (
              <button
                onClick={() => setShowGroupSettings(true)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <Settings className="size-5" />
              </button>
            )}
            <button
              onClick={() => {
                if (isGroup) {
                  setSelectedGroup(null);
                } else {
                  setSelectedUser(null);
                }
              }}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      </div>

      {isGroup && (
        <GroupSettingsModal
          isOpen={showGroupSettings}
          onClose={() => setShowGroupSettings(false)}
          group={selectedGroup}
        />
      )}
    </>
  );
};

export default ChatHeader;
