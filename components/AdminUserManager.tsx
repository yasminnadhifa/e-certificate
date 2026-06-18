"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, ChevronLeft, ChevronRight, KeyRound, Trash2, Search } from "lucide-react";

interface UserItem {
  id: string;
  _id: string;
  name: string;
  username: string;
  role: string;
  limit: number;
  used: number;
}

const PER_PAGE = 5;

export default function AdminUserManager() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    role: "USER",
    limit: 0,
  });

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q));
  }, [users, search]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PER_PAGE));
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filteredUsers.slice(start, start + PER_PAGE);
  }, [filteredUsers, page]);

  const loadUsers = async () => {
    setLoading(true);
    const response = await fetch("/api/users");
    const body = await response.json();
    if (response.ok) {
      setUsers(body.users || []);
      setMessage(null);
    } else {
      setMessage(body.error || "Gagal memuat pengguna.");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await response.json();
      if (response.ok) {
        setForm({ name: "", username: "", password: "", role: "USER", limit: 0 });
        setMessage("Pengguna baru berhasil dibuat.");
        setDialogOpen(false);
        loadUsers();
      } else {
        setMessage(body.error || "Gagal membuat user.");
      }
    } catch {
      setMessage("Terjadi kesalahan server. Coba lagi nanti.");
    }
    setLoading(false);
  };

  const handleUpdateLimit = async (id: string, limit: number) => {
    setLoading(true);
    const response = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit }),
    });
    const body = await response.json();
    if (response.ok) {
      setMessage("Limit berhasil diperbarui.");
      loadUsers();
    } else {
      setMessage(body.error || "Gagal memperbarui limit.");
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!selectedUser || newPassword.length < 6) {
      setMessage("Password minimal 6 karakter.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${selectedUser._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const body = await response.json();
      if (response.ok) {
        setMessage(`Password ${selectedUser.name} berhasil direset.`);
        setResetDialogOpen(false);
        setNewPassword("");
        setSelectedUser(null);
      } else {
        setMessage(body.error || "Gagal mereset password.");
      }
    } catch {
      setMessage("Terjadi kesalahan server.");
    }
    setLoading(false);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${selectedUser._id}`, {
        method: "DELETE",
      });
      const body = await response.json();
      if (response.ok) {
        setMessage(`User ${selectedUser.name} berhasil dihapus.`);
        setDeleteDialogOpen(false);
        setSelectedUser(null);
        loadUsers();
      } else {
        setMessage(body.error || "Gagal menghapus user.");
      }
    } catch {
      setMessage("Terjadi kesalahan server.");
    }
    setLoading(false);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Manajemen User</h1>
            <p className="mt-1 text-sm text-gray-500">
              Kelola pengguna dan atur limit sertifikat mereka.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus size={16} />
            Tambah User
          </Button>
        </div>

        {/* Message */}
        {message && (
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700">
            <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            {message}
          </div>
        )}

        {/* User Table */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-900">Daftar User</h2>
              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                {filteredUsers.length} pengguna
              </span>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama atau username..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-[#7B1111] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#7B1111] sm:w-56"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">User</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Role</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Pemakaian Limit</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Atur Limit</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedUsers.map((u) => {
                  const isUserAdmin = u.role === "ADMIN";
                  const sisa = isUserAdmin ? Infinity : Math.max(u.limit - u.used, 0);
                  const pct = isUserAdmin || u.limit === 0 ? 0 : Math.min((u.used / u.limit) * 100, 100);
                  return (
                    <tr key={u._id} className="transition-colors hover:bg-gray-50/60">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7B1111]/10 text-sm font-bold text-[#7B1111]">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            isUserAdmin
                              ? "bg-[#7B1111]/10 text-[#7B1111]"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {isUserAdmin ? "Admin" : "User"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {isUserAdmin ? (
                          <span className="text-xs text-gray-400">Unlimited</span>
                        ) : (
                          <div className="w-36">
                            <div className="mb-1 flex items-center justify-between text-xs">
                              <span className="text-gray-500">{u.used} / {u.limit}</span>
                              <span className={`font-medium ${sisa === 0 ? "text-red-500" : "text-gray-700"}`}>
                                sisa {sisa}
                              </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  pct >= 100 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-emerald-500"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {isUserAdmin ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number"
                              min={0}
                              value={u.limit}
                              onChange={(event) => {
                                const updated = users.map((item) =>
                                  item._id === u._id ? { ...item, limit: Number(event.target.value) } : item
                                );
                                setUsers(updated);
                              }}
                              className="h-8 w-20 text-center text-xs"
                            />
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleUpdateLimit(u._id, u.limit)}
                              disabled={loading}
                              className="h-8 px-2.5 text-xs"
                            >
                              Simpan
                            </Button>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setSelectedUser(u); setNewPassword(""); setResetDialogOpen(true); }}
                            disabled={loading}
                            title="Reset Password"
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
                          >
                            <KeyRound size={15} />
                          </button>
                          {!isUserAdmin && (
                            <button
                              onClick={() => { setSelectedUser(u); setDeleteDialogOpen(true); }}
                              disabled={loading}
                              title="Hapus User"
                              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">
                      {search ? "Tidak ada user yang cocok." : "Belum ada pengguna terdaftar."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
              <p className="text-xs text-gray-500">
                Menampilkan {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filteredUsers.length)} dari {filteredUsers.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-7 rounded-md px-1.5 py-1 text-xs font-medium transition-colors ${
                      p === page
                        ? "bg-[#7B1111] text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create User Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogHeader>
          <DialogTitle>Tambah User Baru</DialogTitle>
          <DialogDescription>
            Buat akun pengguna baru dan tentukan limit sertifikat.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                placeholder="Masukkan nama"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Masukkan username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 6 karakter"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="limit">Limit Sertifikat</Label>
              <Input
                id="limit"
                type="number"
                placeholder="100"
                min={0}
                value={form.limit}
                onChange={(e) => setForm({ ...form, limit: Number(e.target.value) })}
              />
              {form.role === "ADMIN" && (
                <p className="mt-1 text-[11px] text-gray-400">Admin memiliki limit tak terbatas</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 transition-colors focus:border-[#7B1111] focus:outline-none focus:ring-1 focus:ring-[#7B1111]"
            >
              <option value="USER">User</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Membuat..." : "Buat User"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Masukkan password baru untuk {selectedUser?.name}.
          </DialogDescription>
        </DialogHeader>
        <div>
          <Label htmlFor="newPassword">Password Baru</Label>
          <Input
            id="newPassword"
            type="password"
            placeholder="Min. 6 karakter"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setResetDialogOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleResetPassword} disabled={loading || newPassword.length < 6}>
            {loading ? "Menyimpan..." : "Reset Password"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogHeader>
          <DialogTitle>Hapus User</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus user <strong>{selectedUser?.name}</strong> ({selectedUser?.username})? Tindakan ini tidak bisa dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
            Batal
          </Button>
          <Button variant="danger" onClick={handleDeleteUser} disabled={loading}>
            {loading ? "Menghapus..." : "Ya, Hapus"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
