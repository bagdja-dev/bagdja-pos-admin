'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Input,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Chip,
} from '@heroui/react';

import { AppModal } from '../../components/app-modal';
import { LoadingSpinner } from '../../components/loading-spinner';
import { NoBusinessState } from '../../components/no-business-state';
import { useNewShortcut } from '../../hooks/use-new-shortcut';
import { apiClient, ApiError } from '../../lib/api-client';
import { useBusinessContext } from '../../context/business-context';
import {
  hasMinRole,
  ROLE_LABELS,
  type GridResult,
  type PosLocation,
  type PosRole,
  type PosStaff,
  type PosStaffInvitation,
} from '../../lib/types';

const INVITABLE_ROLES: PosRole[] = ['manager', 'cashier', 'mechanic'];

export default function StaffPage() {
  const { businessId, role, loading: businessLoading } = useBusinessContext();
  const [staff, setStaff] = useState<PosStaff[]>([]);
  const [invitations, setInvitations] = useState<PosStaffInvitation[]>([]);
  const [locations, setLocations] = useState<PosLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<{ email: string; role: PosRole; location_id: string }>({
    email: '',
    role: 'cashier',
    location_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastInviteInfo, setLastInviteInfo] = useState<string | null>(null);

  const canManage = hasMinRole(role ?? '', 'manager');

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const [staffData, locationData] = await Promise.all([
        apiClient<PosStaff[]>(`/api/businesses/${businessId}/staff`),
        apiClient<GridResult<PosLocation>>(`/api/businesses/${businessId}/locations?size=200`),
      ]);
      setStaff(staffData);
      setLocations(locationData.data);

      if (canManage) {
        const invitationData = await apiClient<PosStaffInvitation[]>(
          `/api/businesses/${businessId}/staff/invitations`,
        );
        setInvitations(invitationData.filter((i) => !i.is_accepted));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat staff');
    } finally {
      setLoading(false);
    }
  }, [businessId, canManage]);

  useEffect(() => {
    void load();
  }, [load]);

  useNewShortcut(openInvite, canManage && !modalOpen);

  function openInvite() {
    setForm({ email: '', role: 'cashier', location_id: locations[0]?.id ?? '' });
    setError(null);
    setLastInviteInfo(null);
    setModalOpen(true);
  }

  async function handleInvite() {
    if (!businessId || !form.email.trim()) return;
    if ((form.role === 'cashier' || form.role === 'mechanic') && !form.location_id) {
      setError('Lokasi wajib dipilih untuk role Kasir/Mekanik');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const invitation = await apiClient<PosStaffInvitation>(`/api/businesses/${businessId}/staff/invitations`, {
        method: 'POST',
        body: JSON.stringify({
          email: form.email,
          role: form.role,
          location_id: form.location_id || undefined,
        }),
      });
      setLastInviteInfo(
        invitation.emailSent
          ? `Email undangan terkirim ke ${invitation.email}.`
          : `Undangan dibuat tapi email GAGAL terkirim. Token: ${invitation.token}`,
      );
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal membuat undangan');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateRole(s: PosStaff, newRole: PosRole) {
    if (!businessId) return;
    try {
      await apiClient(`/api/businesses/${businessId}/staff/${s.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gagal update role');
    }
  }

  async function handleRemove(s: PosStaff) {
    if (!businessId) return;
    if (!confirm(`Hapus staff "${s.email ?? s.user_id}"?`)) return;
    try {
      await apiClient(`/api/businesses/${businessId}/staff/${s.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gagal menghapus staff');
    }
  }

  async function handleCancelInvitation(id: string) {
    if (!businessId) return;
    try {
      await apiClient(`/api/businesses/${businessId}/staff/invitations/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gagal membatalkan undangan');
    }
  }

  if (businessLoading) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tim</h1>
          <p className="text-sm text-default-500">Staff aktif & undangan yang menunggu diterima.</p>
        </div>
        {canManage && (
          <Button color="primary" onPress={openInvite}>
            + Undang Staff
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <Table aria-label="Daftar staff">
            <TableHeader>
              <TableColumn>EMAIL</TableColumn>
              <TableColumn>ROLE</TableColumn>
              <TableColumn>LOKASI</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>AKSI</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Belum ada staff">
              {staff.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.email ?? s.user_id}</TableCell>
                  <TableCell>
                    {canManage && s.role !== 'owner' ? (
                      <Select
                        size="sm"
                        selectedKeys={[s.role]}
                        className="w-36"
                        onSelectionChange={(keys) => handleUpdateRole(s, Array.from(keys)[0] as PosRole)}
                      >
                        {INVITABLE_ROLES.map((r) => (
                          <SelectItem key={r}>{ROLE_LABELS[r]}</SelectItem>
                        ))}
                      </Select>
                    ) : (
                      ROLE_LABELS[s.role]
                    )}
                  </TableCell>
                  <TableCell>{s.location?.name ?? '—'}</TableCell>
                  <TableCell>
                    <Chip size="sm" color={s.is_active ? 'success' : 'default'} variant="flat">
                      {s.is_active ? 'Aktif' : 'Nonaktif'}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {canManage && s.role !== 'owner' && (
                      <Button size="sm" variant="flat" color="danger" onPress={() => handleRemove(s)}>
                        Hapus
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {canManage && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-foreground">Undangan Pending</h2>
              <Table aria-label="Daftar undangan">
                <TableHeader>
                  <TableColumn>EMAIL</TableColumn>
                  <TableColumn>ROLE</TableColumn>
                  <TableColumn>KEDALUWARSA</TableColumn>
                  <TableColumn>AKSI</TableColumn>
                </TableHeader>
                <TableBody emptyContent="Tidak ada undangan pending">
                  {invitations.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>{inv.email}</TableCell>
                      <TableCell>{ROLE_LABELS[inv.role]}</TableCell>
                      <TableCell>{new Date(inv.expires_at).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="flat" color="danger" onPress={() => handleCancelInvitation(inv.id)}>
                          Batalkan
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Undang Staff"
        footer={
          <>
            <Button variant="flat" onPress={() => setModalOpen(false)}>
              Tutup
            </Button>
            <Button color="primary" isLoading={saving} onPress={handleInvite}>
              Kirim Undangan
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={form.email}
            onValueChange={(v) => setForm((f) => ({ ...f, email: v }))}
            isRequired
          />
          <Select
            label="Role"
            selectedKeys={[form.role]}
            onSelectionChange={(keys) => setForm((f) => ({ ...f, role: Array.from(keys)[0] as PosRole }))}
          >
            {INVITABLE_ROLES.map((r) => (
              <SelectItem key={r}>{ROLE_LABELS[r]}</SelectItem>
            ))}
          </Select>
          {(form.role === 'cashier' || form.role === 'mechanic') && (
            <Select
              label="Lokasi"
              selectedKeys={form.location_id ? [form.location_id] : []}
              onSelectionChange={(keys) => setForm((f) => ({ ...f, location_id: Array.from(keys)[0] as string }))}
            >
              {locations.map((loc) => (
                <SelectItem key={loc.id}>{loc.name}</SelectItem>
              ))}
            </Select>
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
          {lastInviteInfo && <p className="text-sm text-success-600">{lastInviteInfo}</p>}
        </div>
      </AppModal>
    </div>
  );
}
