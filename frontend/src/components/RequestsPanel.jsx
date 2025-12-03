import { useEffect, useState } from "react";
import { useRequestStore } from "../store/useRequestStore";
import { X, Check, UserPlus, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const RequestsPanel = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState("incoming");
    const {
        incomingRequests,
        outgoingRequests,
        isLoading,
        fetchIncomingRequests,
        fetchOutgoingRequests,
        acceptRequest,
        rejectRequest,
        cancelRequest,
    } = useRequestStore();

    useEffect(() => {
        fetchIncomingRequests();
        fetchOutgoingRequests();
    }, [fetchIncomingRequests, fetchOutgoingRequests]);

    const handleAccept = async (requestId) => {
        try {
            await acceptRequest(requestId);
        } catch (error) {
            console.error("Error accepting request:", error);
        }
    };

    const handleReject = async (requestId) => {
        try {
            await rejectRequest(requestId);
        } catch (error) {
            console.error("Error rejecting request:", error);
        }
    };

    const handleCancel = async (requestId) => {
        try {
            await cancelRequest(requestId);
        } catch (error) {
            console.error("Error cancelling request:", error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-base-100 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-base-300">
                    <h2 className="text-xl font-semibold">Chat Requests</h2>
                    <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-base-300">
                    <button
                        className={`flex-1 py-3 px-4 font-medium transition-colors ${activeTab === "incoming"
                                ? "text-primary border-b-2 border-primary"
                                : "text-base-content/60 hover:text-base-content"
                            }`}
                        onClick={() => setActiveTab("incoming")}
                    >
                        Incoming
                        {incomingRequests.length > 0 && (
                            <span className="ml-2 badge badge-primary badge-sm">{incomingRequests.length}</span>
                        )}
                    </button>
                    <button
                        className={`flex-1 py-3 px-4 font-medium transition-colors ${activeTab === "outgoing"
                                ? "text-primary border-b-2 border-primary"
                                : "text-base-content/60 hover:text-base-content"
                            }`}
                        onClick={() => setActiveTab("outgoing")}
                    >
                        Outgoing
                        {outgoingRequests.length > 0 && (
                            <span className="ml-2 badge badge-ghost badge-sm">{outgoingRequests.length}</span>
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : activeTab === "incoming" ? (
                        <IncomingRequestsList
                            requests={incomingRequests}
                            onAccept={handleAccept}
                            onReject={handleReject}
                        />
                    ) : (
                        <OutgoingRequestsList requests={outgoingRequests} onCancel={handleCancel} />
                    )}
                </div>
            </div>
        </div>
    );
};

const IncomingRequestsList = ({ requests, onAccept, onReject }) => {
    if (requests.length === 0) {
        return (
            <div className="text-center py-12">
                <UserPlus className="w-12 h-12 mx-auto text-base-content/30 mb-3" />
                <p className="text-base-content/60">No incoming requests</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {requests.map((request) => (
                <div
                    key={request._id}
                    className="flex items-center gap-3 p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors"
                >
                    <img
                        src={request.requester.profilePic || "/avatar.png"}
                        alt={request.requester.fullName}
                        className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{request.requester.fullName}</h3>
                        <p className="text-sm text-base-content/60 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onAccept(request._id)}
                            className="btn btn-sm btn-primary gap-1"
                            title="Accept"
                        >
                            <Check className="w-4 h-4" />
                            Accept
                        </button>
                        <button
                            onClick={() => onReject(request._id)}
                            className="btn btn-sm btn-ghost gap-1"
                            title="Reject"
                        >
                            <X className="w-4 h-4" />
                            Reject
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const OutgoingRequestsList = ({ requests, onCancel }) => {
    if (requests.length === 0) {
        return (
            <div className="text-center py-12">
                <UserPlus className="w-12 h-12 mx-auto text-base-content/30 mb-3" />
                <p className="text-base-content/60">No outgoing requests</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {requests.map((request) => (
                <div
                    key={request._id}
                    className="flex items-center gap-3 p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors"
                >
                    <img
                        src={request.recipient.profilePic || "/avatar.png"}
                        alt={request.recipient.fullName}
                        className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{request.recipient.fullName}</h3>
                        <p className="text-sm text-base-content/60 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Sent {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="badge badge-warning gap-1">
                            <Clock className="w-3 h-3" />
                            Pending
                        </span>
                        <button
                            onClick={() => onCancel(request._id)}
                            className="btn btn-sm btn-ghost"
                            title="Cancel request"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RequestsPanel;
