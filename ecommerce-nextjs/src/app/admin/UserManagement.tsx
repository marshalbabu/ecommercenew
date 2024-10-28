import { useEffect, useState } from 'react';
import axios from 'axios';

type User = {
  _id: string;
  name: string;
  email: string;
  username?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

export default function UserManagement() {
  const [systemUsers, setSystemUsers] = useState<User[]>([]);  // Initialize as an empty array
  const [normalUsers, setNormalUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState('system-users');
  const [error, setError] = useState<string | null>(null);

  // Fetch users whenever the active tab changes
  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  // Fetch either system or normal users based on the active tab
  const fetchUsers = async () => {
    console.log("Fetching users...");  // Log fetch action
    const endpoint = activeTab === 'system-users'
      ? '/api/users/system-users'
      : '/api/users/normal-users';

    try {
      const response = await axios.get<User[]>(endpoint, { withCredentials: true });
      const fetchedUsers = response.data || [];  // Ensure the response is always an array

      activeTab === 'system-users'
        ? setSystemUsers(fetchedUsers)
        : setNormalUsers(fetchedUsers);
      
      console.log('Fetched users:', fetchedUsers);  // Log fetched users for debugging
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again later.');
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">User Management</h2>

      {/* Tabs to switch between System and Normal Users */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('system-users')}
          className={`px-4 py-2 rounded ${
            activeTab === 'system-users' ? 'bg-blue-500 text-white' : 'bg-gray-300'
          }`}
        >
          System Users
        </button>
        <button
          onClick={() => setActiveTab('normal-users')}
          className={`px-4 py-2 rounded ${
            activeTab === 'normal-users' ? 'bg-blue-500 text-white' : 'bg-gray-300'
          }`}
        >
          Normal Users
        </button>
      </div>

      {/* Error handling */}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Table */}
      <table className="min-w-full bg-white">
        <thead>
          <tr className="w-full text-left border-b">
            {activeTab === 'system-users' ? (
              <>
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Username</th>
                <th className="py-4 px-6">Role</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Created At</th>
                <th className="py-4 px-6">Action</th>
              </>
            ) : (
              <>
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Action</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {/* System Users Table */}
          {activeTab === 'system-users' ? (
            systemUsers.length > 0 ? (
              systemUsers.map((user) => (
                <tr key={user._id} className="border-b">
                  <td className="py-4 px-6">{user.name}</td>
                  <td className="py-4 px-6">{user.email}</td>
                  <td className="py-4 px-6">{user.username}</td>
                  <td className="py-4 px-6">{user.role}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2 py-1 rounded-full ${
                        user.isActive ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6">
                    <button className="text-blue-500 hover:text-blue-700">Edit</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-4 px-6" colSpan={7}>
                  No system users found.
                </td>
              </tr>
            )
          ) : normalUsers.length > 0 ? (
            /* Normal Users Table */
            normalUsers.map((user) => (
              <tr key={user._id} className="border-b">
                <td className="py-4 px-6">{user._id}</td>
                <td className="py-4 px-6">{user.email}</td>
                <td className="py-4 px-6">
                  <span
                    className={`px-2 py-1 rounded-full ${
                      user.isActive ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                    }`}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <button className="text-blue-500 hover:text-blue-700">Edit</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="py-4 px-6" colSpan={4}>
                No normal users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
