import { useState } from "react";
import { X, Users, Image } from "lucide-react";
import { useGroupStore } from "../store/useGroupStore";
import { useChatStore } from "../store/useChatStore";

const CreateGroupModal = ({ isOpen, onClose }) => {
    const [groupName, setGroupName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [groupPic, setGroupPic] = useState(null);

    const { createGroup } = useGroupStore();
    const { users } = useChatStore();

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setGroupPic(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleMember = (userId) => {
        setSelectedMembers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!groupName.trim()) {
            return;
        }

        try {
            await createGroup({
                name: groupName,
                description,
                memberIds: selectedMembers,
                groupPic
            });

            // Reset form
            setGroupName("");
            setDescription("");
            setSelectedMembers([]);
            setGroupPic(null);
            onClose();
        } catch (error) {
            console.error("Failed to create group:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-base-100 rounded-lg w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Create New Group</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
                        <X className="size-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Group Picture */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="size-24 rounded-full border-2 border-base-300 flex items-center justify-center overflow-hidden bg-base-200">
                                {groupPic ? (
                                    <img src={groupPic} alt="Group" className="size-full object-cover" />
                                ) : (
                                    <Users className="size-12 text-base-content/50" />
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 btn btn-circle btn-sm btn-primary">
                                <Image className="size-4" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Group Name */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Group Name *</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Enter group name"
                            className="input input-bordered"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            maxLength={100}
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Description</span>
                        </label>
                        <textarea
                            placeholder="Enter group description (optional)"
                            className="textarea textarea-bordered"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={500}
                            rows={3}
                        />
                    </div>

                    {/* Member Selection */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Add Members</span>
                            <span className="label-text-alt">{selectedMembers.length} selected</span>
                        </label>
                        <div className="border border-base-300 rounded-lg max-h-48 overflow-y-auto">
                            {users.map((user) => (
                                <label
                                    key={user._id}
                                    className="flex items-center gap-3 p-3 hover:bg-base-200 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-sm"
                                        checked={selectedMembers.includes(user._id)}
                                        onChange={() => toggleMember(user._id)}
                                    />
                                    <img
                                        src={user.profilePic || "/avatar.png"}
                                        alt={user.fullName}
                                        className="size-10 rounded-full"
                                    />
                                    <span className="flex-1">{user.fullName}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={onClose} className="btn btn-ghost">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Create Group
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateGroupModal;
