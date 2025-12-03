import { useState } from "react";
import { X, UserPlus, LogOut, Trash2 } from "lucide-react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const GroupSettingsModal = ({ isOpen, onClose, group }) => {
    const [showAddMembers, setShowAddMembers] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);

    const { authUser } = useAuthStore();
    const { users } = useChatStore();
    const { addMembers, leaveGroup, deleteGroup } = useGroupStore();

    const isAdmin = group?.admin._id === authUser._id;

    // Get users not in group
    const availableUsers = users.filter(
        user => !group?.members.some(member => member._id === user._id)
    );

    const handleAddMembers = async () => {
        if (selectedUsers.length > 0) {
            await addMembers(group._id, selectedUsers);
            setSelectedUsers([]);
            setShowAddMembers(false);
        }
    };

    const handleLeaveGroup = async () => {
        if (confirm("Are you sure you want to leave this group?")) {
            await leaveGroup(group._id);
            onClose();
        }
    };

    const handleDeleteGroup = async () => {
        if (confirm("Are you sure you want to delete this group? This cannot be undone.")) {
            await deleteGroup(group._id);
            onClose();
        }
    };

    if (!isOpen || !group) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-base-100 rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Group Settings</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
                        <X className="size-5" />
                    </button>
                </div>

                {/* Group Info */}
                <div className="mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <img
                            src={group.groupPic || "/avatar.png"}
                            alt={group.name}
                            className="size-16 rounded-full"
                        />
                        <div>
                            <h3 className="font-bold text-lg">{group.name}</h3>
                            <p className="text-sm text-base-content/70">{group.members.length} members</p>
                        </div>
                    </div>
                    {group.description && (
                        <p className="text-sm text-base-content/70">{group.description}</p>
                    )}
                </div>

                {/* Members List */}
                <div className="mb-4">
                    <h3 className="font-semibold mb-2">Members</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {group.members.map((member) => (
                            <div key={member._id} className="flex items-center justify-between p-2 hover:bg-base-200 rounded">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={member.profilePic || "/avatar.png"}
                                        alt={member.fullName}
                                        className="size-10 rounded-full"
                                    />
                                    <div>
                                        <p className="font-medium">{member.fullName}</p>
                                        {member._id === group.admin._id && (
                                            <span className="text-xs text-primary">Admin</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                    {isAdmin && (
                        <>
                            <button
                                onClick={() => setShowAddMembers(!showAddMembers)}
                                className="btn btn-outline btn-block"
                            >
                                <UserPlus className="size-4" />
                                Add Members
                            </button>

                            {showAddMembers && (
                                <div className="border border-base-300 rounded-lg p-3">
                                    <div className="max-h-32 overflow-y-auto mb-2">
                                        {availableUsers.map((user) => (
                                            <label key={user._id} className="flex items-center gap-2 p-2 hover:bg-base-200 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-sm"
                                                    checked={selectedUsers.includes(user._id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedUsers([...selectedUsers, user._id]);
                                                        } else {
                                                            setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                                                        }
                                                    }}
                                                />
                                                <img src={user.profilePic || "/avatar.png"} alt={user.fullName} className="size-8 rounded-full" />
                                                <span className="text-sm">{user.fullName}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleAddMembers}
                                        className="btn btn-primary btn-sm btn-block"
                                        disabled={selectedUsers.length === 0}
                                    >
                                        Add Selected
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={handleDeleteGroup}
                                className="btn btn-error btn-outline btn-block"
                            >
                                <Trash2 className="size-4" />
                                Delete Group
                            </button>
                        </>
                    )}

                    {!isAdmin && (
                        <button
                            onClick={handleLeaveGroup}
                            className="btn btn-warning btn-outline btn-block"
                        >
                            <LogOut className="size-4" />
                            Leave Group
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GroupSettingsModal;
