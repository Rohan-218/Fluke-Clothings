import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { backendUrl } from '../App';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const response = await axios.get(`${backendUrl}/api/user/list`, {
        withCredentials: true,
      });

      if (response.data.status === 'success') {
        setUsers(response.data.users || response.data.data || []);
      } else {
        setUsers(response.data.users || response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(error.response?.data?.message || 'Unable to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const name = user.name || user.fullName || '';
    const email = user.email || '';

    return `${name} ${email}`.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Users</h1>
          <p className="mt-1 text-sm text-gray-500">View and manage your registered customers.</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs text-gray-500">Total customers</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">{users.length}</p>
        </div>
      </div>

      <div className="mb-5">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-500 sm:max-w-md"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <p className="p-8 text-center text-sm text-gray-500">Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">
            {users.length === 0 ? 'No users found.' : 'No users match your search.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-150 text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Customer</th>
                  <th className="px-5 py-4 font-semibold">Email</th>
                  <th className="px-5 py-4 font-semibold">User ID</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="transition hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {user.name || user.fullName || 'Unnamed user'}
                    </td>
                    <td className="px-5 py-4 text-gray-600">{user.email || '—'}</td>
                    <td className="px-5 py-4 text-xs text-gray-500">{user._id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;