import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { useRequestStore } from "../store/useRequestStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, MessageCircle, Plus, UserPlus, Search } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";
import RequestsPanel from "./RequestsPanel";
import UserSearchModal from "./UserSearchModal";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading, setChatType } = useChatStore();
  const { getGroups, groups, selectedGroup, setSelectedGroup, isGroupsLoading } = useGroupStore();
  const { onlineUsers } = useAuthStore();
  const { incomingRequests } = useRequestStore();

  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [activeTab, setActiveTab] = useState("users"); // 'users' or 'groups'
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showRequestsPanel, setShowRequestsPanel] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);

  useEffect(() => {
    getUsers();
    getGroups();
  }, [getUsers, getGroups]);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSelectedGroup(null);
    setChatType("direct");
  };

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setSelectedUser(null);
    setChatType("group");
  };

  if (isUsersLoading || isGroupsLoading) return <SidebarSkeleton />;

  return (
    <>
      <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
        {/* Tabs */}
        <div className="border-b border-base-300 w-full p-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("users")}
              className={`btn btn-sm flex-1 ${activeTab === "users" ? "btn-primary" : "btn-ghost"}`}
            >
              <MessageCircle className="size-4" />
              <span className="hidden lg:inline">Chats</span>
            </button>
            <button
              onClick={() => setActiveTab("groups")}
              className={`btn btn-sm flex-1 ${activeTab === "groups" ? "btn-primary" : "btn-ghost"}`}
            >
              <Users className="size-4" />
              <span className="hidden lg:inline">Groups</span>
            </button>
          </div>
          {/* Find Users Button */}
          <button
            onClick={() => setShowUserSearch(true)}
            className="btn btn-sm btn-primary w-full mt-2"
          >
            <Search className="size-4" />
            <span className="hidden lg:inline">Find Users</span>
          </button>
          {/* Requests Button */}
          <button
            onClick={() => setShowRequestsPanel(true)}
            className="btn btn-sm btn-ghost w-full mt-2 relative"
          >
            <UserPlus className="size-4" />
            <span className="hidden lg:inline">Requests</span>
            {incomingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 badge badge-primary badge-sm">
                {incomingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <>
            <div className="p-3 border-b border-base-300">
              <div className="hidden lg:flex items-center gap-2">
                <label className="cursor-pointer flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showOnlineOnly}
                    onChange={(e) => setShowOnlineOnly(e.target.checked)}
                    className="checkbox checkbox-sm"
                  />
                  <span className="text-sm">Show online only</span>
                </label>
                <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
              </div>
            </div>

            <div className="overflow-y-auto w-full py-3">
              {filteredUsers.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleSelectUser(user)}
                  className={`
                    w-full p-3 flex items-center gap-3
                    hover:bg-base-300 transition-colors
                    ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
                  `}
                >
                  <div className="relative mx-auto lg:mx-0">
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.fullName}
                      className="size-12 object-cover rounded-full"
                    />
                    {onlineUsers.includes(user._id) && (
                      <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
                    )}
                  </div>
                  <div className="hidden lg:block text-left min-w-0">
                    <div className="font-medium truncate">{user.fullName}</div>
                    <div className="text-sm text-zinc-400">
                      {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                    </div>
                  </div>
                </button>
              ))}

              {filteredUsers.length === 0 && (
                <div className="text-center text-zinc-500 py-4">No users found</div>
              )}
            </div>
          </>
        )}

        {/* Groups Tab */}
        {activeTab === "groups" && (
          <>
            <div className="p-3 border-b border-base-300">
              <button
                onClick={() => setShowCreateGroup(true)}
                className="btn btn-primary btn-sm btn-block"
              >
                <Plus className="size-4" />
                <span className="hidden lg:inline">Create Group</span>
              </button>
            </div>

            <div className="overflow-y-auto w-full py-3">
              {groups.map((group) => (
                <button
                  key={group._id}
                  onClick={() => handleSelectGroup(group)}
                  className={`
                    w-full p-3 flex items-center gap-3
                    hover:bg-base-300 transition-colors
                    ${selectedGroup?._id === group._id ? "bg-base-300 ring-1 ring-base-300" : ""}
                  `}
                >
                  <div className="mx-auto lg:mx-0">
                    <img
                      src={group.groupPic || "/avatar.png"}
                      alt={group.name}
                      className="size-12 object-cover rounded-full"
                    />
                  </div>
                  <div className="hidden lg:block text-left min-w-0 flex-1">
                    <div className="font-medium truncate">{group.name}</div>
                    <div className="text-sm text-zinc-400">
                      {group.members.length} members
                    </div>
                  </div>
                </button>
              ))}

              {groups.length === 0 && (
                <div className="text-center text-zinc-500 py-4">
                  <p className="mb-2">No groups yet</p>
                  <p className="text-xs">Create a group to get started</p>
                </div>
              )}
            </div>
          </>
        )}
      </aside>

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
      />

      {showRequestsPanel && (
        <RequestsPanel onClose={() => setShowRequestsPanel(false)} />
      )}

      {showUserSearch && (
        <UserSearchModal onClose={() => setShowUserSearch(false)} />
      )}
    </>
  );
};

export default Sidebar;
