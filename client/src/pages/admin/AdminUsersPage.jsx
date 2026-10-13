import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, Search, Shield, CheckCircle2, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { get, post, patch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Field, Select } from '@/components/ui/input';
import { Tabs } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { TableWrap, Table, THead, TH, TBody, TR, TD } from '@/components/ui/table';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Pagination } from '@/components/common/Pagination';
import { formatDateTime, titleCase } from '@/lib/format';

const ROLE_TABS = [
  { value: '', label: 'All Users' },
  { value: 'CUSTOMER', label: 'Customers' },
  { value: 'SELLER', label: 'Sellers' },
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'SUPPORT', label: 'Support' },
  { value: 'ADMIN', label: 'Admins' },
];

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');

  // Add staff modal
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffRole, setStaffRole] = useState('SUPPORT');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-users', { page, role, search }],
    queryFn: () => get('/users', { page, limit: 15, role, search }),
  });

  const toggleUserStatus = useMutation({
    mutationFn: ({ id, isActive }) => patch(`/users/${id}/status`, { isActive }),
    onSuccess: (res) => {
      toast.success(res?.message || 'User status updated');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-overview'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const createStaff = useMutation({
    mutationFn: () =>
      post('/users', {
        name: staffName,
        email: staffEmail,
        password: staffPassword,
        phone: staffPhone,
        role: staffRole,
      }),
    onSuccess: () => {
      toast.success('Staff user created successfully');
      setStaffModalOpen(false);
      setStaffName('');
      setStaffEmail('');
      setStaffPassword('');
      setStaffPhone('');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-overview'] });
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  const users = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">User & Staff Management</h1>
          <p className="mt-1 text-sm text-ink-muted">View all platform registered users, assign staff roles, and manage permissions.</p>
        </div>
        <Button onClick={() => setStaffModalOpen(true)} className="gap-2">
          <UserPlus className="size-4" /> Add Staff Account
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Tabs
          tabs={ROLE_TABS}
          value={role}
          onChange={(v) => {
            setRole(v);
            setPage(1);
          }}
        />
      </div>

      {!users.length ? (
        <Card>
          <EmptyState
            icon={Users}
            title={role || search ? 'No users match filters' : 'No users registered'}
            description="Users registering on ShopSphere will be listed here."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <TableWrap>
            <Table>
              <THead>
                <TR>
                  <TH>User</TH>
                  <TH>Role</TH>
                  <TH>Phone</TH>
                  <TH>Status</TH>
                  <TH>Registered</TH>
                  <TH className="text-right">Action</TH>
                </TR>
              </THead>
              <TBody>
                {users.map((u) => (
                  <TR key={u._id}>
                    <TD>
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} className="size-9" />
                        <div>
                          <p className="font-semibold text-sm text-ink">{u.name}</p>
                          <p className="text-xs text-ink-muted">{u.email}</p>
                        </div>
                      </div>
                    </TD>
                    <TD>
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {u.role}
                      </span>
                    </TD>
                    <TD className="text-xs text-ink-muted">{u.phone || '—'}</TD>
                    <TD>
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                          <CheckCircle2 className="size-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                          <Ban className="size-3.5" /> Deactivated
                        </span>
                      )}
                    </TD>
                    <TD className="text-xs text-ink-muted">{formatDateTime(u.createdAt)}</TD>
                    <TD className="text-right">
                      {u.role !== 'ADMIN' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={u.isActive ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}
                          onClick={() => toggleUserStatus.mutate({ id: u._id, isActive: !u.isActive })}
                          loading={toggleUserStatus.isPending}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      )}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </TableWrap>
          <div className="border-t border-slate-100 p-4">
            <Pagination page={page} pages={data?.pagination?.pages} onChange={setPage} />
          </div>
        </Card>
      )}

      {/* Create Staff Dialog */}
      <Dialog
        open={staffModalOpen}
        onClose={() => setStaffModalOpen(false)}
        title="Create Staff Member"
        description="Add a new platform operator with Support or Delivery privileges."
        footer={
          <>
            <Button variant="outline" onClick={() => setStaffModalOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={createStaff.isPending}
              onClick={() => createStaff.mutate()}
              disabled={!staffName || !staffEmail || !staffPassword}
            >
              Create Account
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Full Name" required>
            <Input
              placeholder="e.g. Sneha Kapoor"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              required
            />
          </Field>
          <Field label="Email Address" required>
            <Input
              type="email"
              placeholder="e.g. sneha@shopsphere.demo"
              value={staffEmail}
              onChange={(e) => setStaffEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Password" required>
            <Input
              type="password"
              placeholder="Minimum 6 characters"
              value={staffPassword}
              onChange={(e) => setStaffPassword(e.target.value)}
              required
            />
          </Field>
          <Field label="Phone Number">
            <Input
              placeholder="10-digit mobile number"
              value={staffPhone}
              onChange={(e) => setStaffPhone(e.target.value)}
            />
          </Field>
          <Field label="Role Assigned" required>
            <Select value={staffRole} onChange={(e) => setStaffRole(e.target.value)}>
              <option value="SUPPORT">Support Agent</option>
              <option value="DELIVERY">Delivery Partner</option>
              <option value="ADMIN">Administrator</option>
            </Select>
          </Field>
        </div>
      </Dialog>
    </div>
  );
}

