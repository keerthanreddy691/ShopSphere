import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Grid, Plus, Edit2, Trash2, CheckCircle2, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { get, post, patch, del } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Field } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { TableWrap, Table, THead, TH, TBody, TR, TD } from '@/components/ui/table';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { CategoryIcon } from '@/components/layout/CategoryIcon';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Smartphone');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  const { data: categories = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => get('/categories', { all: 'true' }).then((d) => d.categories),
  });

  const openCreate = () => {
    setEditingCategory(null);
    setName('');
    setIcon('Smartphone');
    setDescription('');
    setImage('');
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditingCategory(cat);
    setName(cat.name || '');
    setIcon(cat.icon || 'Smartphone');
    setDescription(cat.description || '');
    setImage(cat.image || '');
    setModalOpen(true);
  };

  const saveCategory = useMutation({
    mutationFn: () => {
      const payload = { name, icon, description, image };
      return editingCategory
        ? patch(`/categories/${editingCategory._id}`, payload)
        : post('/categories', payload);
    },
    onSuccess: (res) => {
      toast.success(res?.message || 'Category saved successfully');
      setModalOpen(false);
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, isActive }) => patch(`/categories/${id}/status`, { isActive }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Category status updated');
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteCategory = useMutation({
    mutationFn: (id) => del(`/categories/${id}`),
    onSuccess: (res) => {
      toast.success(res?.message || 'Category deleted');
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Category Management</h1>
          <p className="mt-1 text-sm text-ink-muted">Organize product classification and marketplace storefront navigation.</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="size-4" /> Add Category
        </Button>
      </div>

      <Card className="overflow-hidden">
        <TableWrap>
          <Table>
            <THead>
              <TR>
                <TH>Category</TH>
                <TH>Slug</TH>
                <TH>Description</TH>
                <TH>Products</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {categories.map((c) => (
                <TR key={c._id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <CategoryIcon name={c.icon} className="size-4" />
                      </span>
                      <span className="font-semibold text-sm text-ink">{c.name}</span>
                    </div>
                  </TD>
                  <TD className="font-mono text-xs text-ink-muted">/{c.slug}</TD>
                  <TD className="text-xs text-ink-muted max-w-xs truncate">{c.description || '—'}</TD>
                  <TD className="text-xs font-semibold">{c.productCount || 0} items</TD>
                  <TD>
                    <StatusBadge status={c.isActive ? 'ACTIVE' : 'INACTIVE'} />
                  </TD>
                  <TD className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Edit Category"
                        onClick={() => openEdit(c)}
                      >
                        <Edit2 className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => toggleStatus.mutate({ id: c._id, isActive: !c.isActive })}
                      >
                        {c.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        aria-label="Delete Category"
                        onClick={() => setDeleteId(c._id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      </Card>

      {/* Save Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        description="Add a top-level category for marketplace product indexing."
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={saveCategory.isPending}
              onClick={() => saveCategory.mutate()}
              disabled={!name.trim()}
            >
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Category Name" required>
            <Input
              placeholder="e.g. Electronics, Fashion, Home Decor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>
          <Field label="Lucide Icon Name" hint="e.g. Smartphone, Shirt, Sofa, Sparkles, BookOpen">
            <Input
              placeholder="Smartphone"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
            />
          </Field>
          <Field label="Description">
            <Input
              placeholder="Brief description for category heading"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field label="Banner Image URL">
            <Input
              placeholder="https://images.unsplash.com/..."
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </Field>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteCategory.mutate(deleteId)}
        title="Delete Category"
        description="Are you sure you want to delete this category? If products belong to this category, deletion may be blocked."
        confirmText="Delete"
        danger
        loading={deleteCategory.isPending}
      />
    </div>
  );
}

