'use client';

import React, { useEffect, useState } from 'react';
import axiosClient from '@/lib/axiosClient';
import { useSession } from 'next-auth/react';

type Role = 'user' | 'intercessor' | 'admin' | 'superadmin';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role | null;
}

const roleOptions: Role[] = ['user', 'intercessor', 'admin', 'superadmin'];
const PAGE_SIZE = 20;

export default function AdminPageClient() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchText, setSearchText] = useState('');
  const [filterRole, setFilterRole] = useState<Role | 'all'>('all');

  const currentUserRole = session?.user?.role || 'user';

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await axiosClient.get(
        `/authorization?page=${page}&pageSize=${PAGE_SIZE}`
      );
      setUsers(res.data.users);
      setTotalCount(res.data.totalCount);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchUsers(currentPage);
    }
  }, [status, currentPage]);

  // 🔍 클라이언트 사이드 필터링
  useEffect(() => {
    let filtered = [...users];

    if (filterRole !== 'all') {
      filtered = filtered.filter((user) => user.role === filterRole);
    }

    if (searchText.trim() !== '') {
      const lowerSearch = searchText.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(lowerSearch) ||
          user.email.toLowerCase().includes(lowerSearch)
      );
    }

    setFilteredUsers(filtered);
  }, [users, filterRole, searchText]);
  // 🟢 역할 변경 핸들러
  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      await axiosClient.patch('/authorization', {
        userId,
        newRole,
        currentUserRole,
      });
      fetchUsers(currentPage);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update role');
    }
  };

  // 🔴 삭제 핸들러
  const handleDelete = async (userId: string, userName: string, userRole: Role | null) => {
    if (!confirm(`Are you sure you want to delete ${userName}?`)) return;

    const currentUserLevel = roleOptions.indexOf(currentUserRole);
    const targetUserLevel = roleOptions.indexOf(userRole || 'user');

    if (currentUserLevel <= targetUserLevel) {
      alert('You do not have permission to delete this account.');
      return;
    }

    try {
      await axiosClient.delete('/authorization', {
        data: {
          userId,
        },
      });
      fetchUsers(currentPage);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete account.');
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  if (status === 'loading' || loading) {
    return <div className="p-6 text-gray-700">Loading...</div>;
  }
  if (status === 'unauthenticated') {
    return <div className="p-6 text-red-600 font-semibold">Access Denied</div>;
  }
  if (error) {
    return <div className="p-6 text-red-600 font-semibold">Error: {error}</div>;
  }

  return (
    <div className="p-6 flex flex-col min-h-screen">
      <h1 className="text-3xl font-semibold mb-4 text-gray-900">Users</h1>

      {/* 🔍 필터 */}
      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="Search by name or email"
          className="border rounded px-3 py-1 text-gray-800"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <select
          className="border rounded px-3 py-1 text-gray-800"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as Role | 'all')}
        >
          <option value="all">All Roles</option>
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      {/* 📋 테이블 */}
      <div className="overflow-x-auto flex-grow">
        <table className="min-w-full text-sm text-gray-700 border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left px-4 py-2">Name</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Role</th>
              <th className="text-center px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => {
              const canEdit =
                roleOptions.indexOf(currentUserRole) > roleOptions.indexOf(user.role || 'user');

              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{user.name}</td>
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2">
                    <select
                      className={`px-2 py-1 rounded border text-sm ${
                        canEdit
                          ? 'bg-white border-gray-300 text-gray-800'
                          : 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                      value={user.role || ''}
                      disabled={!canEdit}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value as Role)
                      }
                    >
                      <option value="">No Role</option>
                      {roleOptions.map((role) => {
                        const assignable =
                          roleOptions.indexOf(role) <= roleOptions.indexOf(currentUserRole);
                        return (
                          <option key={role} value={role} disabled={!assignable}>
                            {role}
                          </option>
                        );
                      })}
                    </select>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      className={`text-red-600 hover:text-red-800 font-semibold ${
                        canEdit ? '' : 'opacity-50 cursor-not-allowed'
                      }`}
                      disabled={!canEdit}
                      onClick={() =>
                        handleDelete(user.id, user.name, user.role)
                      }
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-4 text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ⬅️ 페이지네이션 */}
      <div className="sticky bottom-0 bg-white py-4 border-t border-gray-200 flex justify-center">
        {[...Array(totalPages)].map((_, idx) => (
          <button
            key={idx + 1}
            onClick={() => setCurrentPage(idx + 1)}
            className={`mx-1 px-3 py-1 rounded text-sm ${
              currentPage === idx + 1
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
