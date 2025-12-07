import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Dialog } from '../components/ui/Dialog';
import { api } from '../lib/axios';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import type { ApiResponse, Category, Subcategory } from '../types/api';

export const Subcategories = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', categoryId: '' });
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<{ categories: Category[] }>>('/categories');
      return response.data.data.categories;
    },
  });

  const { data: subcategories, isLoading, refetch } = useQuery({
    queryKey: ['subcategories', formData.categoryId],
    queryFn: async () => {
      if (!formData.categoryId) {
        // Fetch all subcategories by getting them from each category
        const allSubcategories: Subcategory[] = [];
        if (categories) {
          for (const category of categories) {
            try {
              const response = await api.get<ApiResponse<{ subcategories: Subcategory[] }>>(
                `/categories/${category._id}/subcategories`
              );
              allSubcategories.push(...response.data.data.subcategories);
            } catch (error) {
              console.error(`Error fetching subcategories for category ${category._id}:`, error);
            }
          }
        }
        return allSubcategories;
      }
      const response = await api.get<ApiResponse<{ subcategories: Subcategory[] }>>(
        `/categories/${formData.categoryId}/subcategories`
      );
      return response.data.data.subcategories;
    },
    enabled: true,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; categoryId: string; description?: string }) => {
      const response = await api.post<ApiResponse<{ subcategory: Subcategory }>>(
        '/categories/subcategories',
        data
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('Subcategory created successfully');
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      setIsDialogOpen(false);
      setFormData({ name: '', description: '', categoryId: formData.categoryId });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create subcategory');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; categoryId: string; description?: string; isActive?: boolean } }) => {
      try {
        const response = await api.put<ApiResponse<{ subcategory: Subcategory }>>(`/categories/subcategories/${id}`, data);
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 404 || error.response?.status === 405) {
          const response = await api.patch<ApiResponse<{ subcategory: Subcategory }>>(`/categories/subcategories/${id}`, data);
          return response.data;
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Subcategory updated successfully');
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      setIsDialogOpen(false);
      setEditingSubcategory(null);
      setFormData({ name: '', description: '', categoryId: formData.categoryId });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update subcategory');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<ApiResponse<{ subcategory: Subcategory }>>(`/categories/subcategories/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Subcategory deactivated successfully');
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to deactivate subcategory');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Subcategory name is required');
      return;
    }
    if (!formData.categoryId) {
      toast.error('Please select a category');
      return;
    }
    
    if (editingSubcategory) {
      updateMutation.mutate({
        id: editingSubcategory._id,
        data: {
          name: formData.name.trim(),
          categoryId: formData.categoryId,
          description: formData.description.trim() || undefined,
        },
      });
    } else {
      createMutation.mutate({
        name: formData.name.trim(),
        categoryId: formData.categoryId,
        description: formData.description.trim() || undefined,
      });
    }
  };

  const handleDelete = async (subcategory: Subcategory) => {
    if (!confirm(`Are you sure you want to deactivate "${subcategory.name}"?`)) {
      return;
    }
    deleteMutation.mutate(subcategory._id);
  };

  const handleOpenDialog = (subcategory?: Subcategory) => {
    if (subcategory) {
      setEditingSubcategory(subcategory);
      const categoryId = typeof subcategory.category === 'string' 
        ? subcategory.category 
        : subcategory.category._id;
      setFormData({
        name: subcategory.name,
        description: subcategory.description || '',
        categoryId,
      });
    } else {
      setEditingSubcategory(null);
      setFormData({ name: '', description: '', categoryId: formData.categoryId || '' });
    }
    setIsDialogOpen(true);
  };

  const displaySubcategories = subcategories || [];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Subcategories</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your product subcategories</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Subcategory
        </Button>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
          <Select
            value={formData.categoryId}
            onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
            options={[
              { label: 'All Categories', value: '' },
              ...(categories?.map((cat) => ({ label: cat.name, value: cat._id })) || []),
            ]}
            placeholder="Select a category"
            ariaLabel="Filter by category"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : displaySubcategories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No subcategories found</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Name</TableHead>
                  <TableHead className="text-xs sm:text-sm">Category</TableHead>
                  <TableHead className="text-xs sm:text-sm">Description</TableHead>
                  <TableHead className="text-xs sm:text-sm">Status</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displaySubcategories.map((subcategory) => {
                  const categoryName = typeof subcategory.category === 'string'
                    ? categories?.find(c => c._id === subcategory.category)?.name || 'Unknown'
                    : subcategory.category.name;
                  return (
                    <TableRow key={subcategory._id}>
                      <TableCell className="text-xs sm:text-sm font-medium">
                        {subcategory.name}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm text-gray-600">{categoryName}</TableCell>
                      <TableCell className="text-xs sm:text-sm text-gray-600">
                        {subcategory.description || '-'}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            subcategory.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {subcategory.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(subcategory)}
                            className="text-xs sm:text-sm"
                            disabled={!subcategory.isActive}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          {subcategory.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(subcategory)}
                              className="text-xs sm:text-sm text-red-600 hover:text-red-800"
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingSubcategory(null);
            setFormData({ name: '', description: '', categoryId: formData.categoryId });
          }
        }}
        title={editingSubcategory ? 'Edit Subcategory' : 'Add Subcategory'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              options={categories?.map((cat) => ({ label: cat.name, value: cat._id })) || []}
              placeholder="Select a category"
              ariaLabel="Category selection"
              disabled={!!editingSubcategory}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Subcategory name"
              required
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Subcategory description (optional)"
              className="text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setEditingSubcategory(null);
                setFormData({ name: '', description: '', categoryId: formData.categoryId });
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending 
                ? 'Saving...' 
                : editingSubcategory 
                  ? 'Update' 
                  : 'Create'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

