// import { useAuthStore } from "../store/useAuthStore"; // adjust if your logout fn is elsewhere

// const SettingsPage = () => {
//   const { logout } = useAuthStore(); // OR whatever your logout function is

//   return (
//     <div className="h-screen container mx-auto px-4 pt-20 max-w-2xl">
//       <div className="space-y-6">

//         {/* Header */}
//         <div className="flex flex-col gap-1">
//           <h2 className="text-lg font-semibold">Settings</h2>
//           <p className="text-sm text-base-content/70">Manage your account</p>
//         </div>

//         {/* Logout Section */}
//         <div className="p-6 rounded-xl border border-base-300 bg-base-100 shadow">
//           <h3 className="font-medium text-sm mb-3">Account</h3>

//           <button
//             onClick={logout}
//             className="btn btn-error w-full"
//           >
//             Logout
//           </button>
//         </div>

//       </div>
//     </div>
//   );
// };

// export default SettingsPage;

import { useAuthStore } from "../store/useAuthStore"; // adjust if your logout fn is elsewhere

const SettingsPage = () => {
  const { logout } = useAuthStore(); // OR whatever your logout function is

  return (
    <div className="h-screen container mx-auto px-4 pt-20 max-w-2xl">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Settings</h2>
          <p className="text-sm text-base-content/70">Manage your account</p>
        </div>

        {/* Logout Section */}
        <div className="p-6 rounded-xl border border-base-300 bg-base-100 shadow">
          <h3 className="font-medium text-sm mb-3">Account</h3>

          <button
            onClick={logout}
            className="btn btn-error w-full"
          >
            Logout
          </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
