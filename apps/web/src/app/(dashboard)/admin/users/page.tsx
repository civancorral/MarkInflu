'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Users, Search, Filter, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface UserItem {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  brandProfile: { companyName: string; logoUrl: string | null } | null;
  creatorProfile: { displayName: string; avatarUrl: string | null } | null;
}

const ROLE_LABELS: Record<string, string> = { ADMIN: 'Admin', BRAND: 'Marca', CREATOR: 'Creador', AGENCY: 'Agencia' };
const STATUS_LABELS: Record<string, string> = { ACTIVE: 'Activo', SUSPENDED: 'Suspendido', PENDING_VERIFICATION: 'Pendiente' };
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-500/10 text-green-500 border-green-500/20',
  SUSPENDED: 'bg-red-500/10 text-red-500 border-red-500/20',
  PENDING_VERIFICATION: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
};

export default function AdminUsersPage() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || '');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.data || []);
        setTotalPages(data.meta?.totalPages || 1);
        setTotal(data.meta?.total || 0);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
        toast.success('Estado actualizado');
      } else {
        toast.error('Error al actualizar');
      }
    } catch {
      toast.error('Error de conexión');
    }
  };

  const getDisplayName = (user: UserItem) => {
    if (user.brandProfile) return user.brandProfile.companyName;
    if (user.creatorProfile) return user.creatorProfile.displayName;
    return user.email.split('@')[0] ?? user.email;
  };

  const getAvatar = (user: UserItem) => {
    return user.brandProfile?.logoUrl || user.creatorProfile?.avatarUrl || null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">{total} usuarios registrados</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por email o nombre..."
            className="input pl-9"
          />
        </form>

        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="input w-auto"
        >
          <option value="">Todos los roles</option>
          <option value="BRAND">Marca</option>
          <option value="CREATOR">Creador</option>
          <option value="ADMIN">Admin</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input w-auto"
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVE">Activo</option>
          <option value="SUSPENDED">Suspendido</option>
          <option value="PENDING_VERIFICATION">Pendiente</option>
        </select>
      </div>

      {/* Table */}
      <div className="bento-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">No se encontraron usuarios</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="hidden border-b border-border bg-muted/30 px-6 py-3 sm:grid sm:grid-cols-12 sm:gap-4">
              <span className="col-span-4 text-xs font-medium text-muted-foreground uppercase">Usuario</span>
              <span className="col-span-2 text-xs font-medium text-muted-foreground uppercase">Rol</span>
              <span className="col-span-2 text-xs font-medium text-muted-foreground uppercase">Estado</span>
              <span className="col-span-2 text-xs font-medium text-muted-foreground uppercase">Registro</span>
              <span className="col-span-2 text-xs font-medium text-muted-foreground uppercase">Acciones</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border">
              {users.map((user) => {
                const avatar = getAvatar(user);
                return (
                  <div key={user.id} className="items-center px-6 py-3 hover:bg-accent/30 transition-colors sm:grid sm:grid-cols-12 sm:gap-4">
                    {/* User */}
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                        {avatar ? (
                          <Image src={avatar} alt="" fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
                            {getDisplayName(user).charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{getDisplayName(user)}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>

                    {/* Role */}
                    <div className="col-span-2 mt-1 sm:mt-0">
                      <span className="text-sm">{ROLE_LABELS[user.role] || user.role}</span>
                    </div>

                    {/* Status */}
                    <div className="col-span-2 mt-1 sm:mt-0">
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border',
                        STATUS_COLORS[user.status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20',
                      )}>
                        {STATUS_LABELS[user.status] || user.status}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="col-span-2 mt-1 sm:mt-0">
                      <p className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('es-MX')}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 mt-2 flex gap-2 sm:mt-0">
                      {user.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleStatusChange(user.id, 'SUSPENDED')}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Suspender
                        </button>
                      ) : user.status === 'SUSPENDED' ? (
                        <button
                          onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                          className="text-xs text-green-500 hover:underline"
                        >
                          Activar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                          className="text-xs text-brand-500 hover:underline"
                        >
                          Verificar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 border-t border-border px-6 py-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
