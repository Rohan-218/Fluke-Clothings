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

        <div className="flex min-w-37.5 flex-col justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 sm:self-center">
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
          <div className="w-full">
            <table className="w-full table-fixed text-left text-xs sm:text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th rowSpan={2} className="px-2 py-3 font-semibold sm:px-3">Customer</th>
                  <th rowSpan={2} className="px-2 py-3 font-semibold sm:px-3">Email</th>
                  <th rowSpan={2} className="px-2 py-3 font-semibold sm:px-3">Customer ID</th>
                  <th colSpan={2} className="px-2 py-3 text-center font-semibold sm:px-3">Orders</th>
                </tr>
                <tr>
                  <th className="px-2 py-2 text-center font-medium normal-case sm:px-3">Total</th>
                  <th className="px-2 py-2 text-center font-medium normal-case sm:px-3">Cancelled</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="transition hover:bg-gray-50">
                    <td className="wrap-break-word px-2 py-3 font-medium text-gray-800 sm:px-3">
                      {user.name || 'Unnamed user'}
                    </td>
                    <td className="break-all px-2 py-3 text-gray-600 sm:px-3">
                      {user.email || '—'}
                    </td>
                    <td className="break-all px-2 py-3 text-[10px] text-gray-500 sm:px-3 sm:text-xs">
                      {user._id}
                    </td>
                    <td className="px-2 py-3 text-center sm:px-3">
                      <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-green-100 px-2.5 py-1 font-semibold text-green-700">
                        {user.totalOrders ?? 0}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center sm:px-3">
                      <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-red-100 px-2.5 py-1 font-semibold text-red-700">
                        {user.cancelledOrders ?? 0}
                      </span>
                    </td>
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