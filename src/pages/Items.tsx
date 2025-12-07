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
import { formatCurrency, fromSmallestUnit } from '../utils/currency';
import type { ApiResponse, Category, Subcategory, Item } from '../types/api';

export const Items = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    code: '', 
    description: '', 
    categoryId: '', 
    subcategoryId: '', 
    price: '' 
  });
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<{ categories: Category[] }>>('/categories');
      return response.data.data.categories;
    },
  });

  const { data: subcategories } = useQuery({
    queryKey: ['subcategories', formData.categoryId],
    queryFn: async () => {
      if (!formData.categoryId) return [];
      const response = await api.get<ApiResponse<{ subcategories: Subcategory[] }>>(
        `/categories/${formData.categoryId}/subcategories`
      );
      return response.data.data.subcategories;
    },
    enabled: !!formData.categoryId,
  });

  const { data: items, isLoading, refetch } = useQuery({
    queryKey: ['items', formData.subcategoryId],
    queryFn: async () => {
      if (!formData.subcategoryId) {
        // Fetch all items by getting them from each subcategory
        const allItems: Item[] = [];
        if (categories) {
          for (const category of categories) {
            try {
              const subcatsResponse = await api.get<ApiResponse<{ subcategories: Subcategory[] }>>(
                `/categories/${category._id}/subcategories`
              );
              const subcats = subcatsResponse.data.data.subcategories;
              for (const subcat of subcats) {
                try {
                  const itemsResponse = await api.get<ApiResponse<{ items: Item[] }>>('/items', {
                    params: { subcategoryId: subcat._id },
                  });
                  allItems.push(...itemsResponse.data.data.items);
                } catch (error) {
                  console.error(`Error fetching items for subcategory ${subcat._id}:`, error);
                }
              }
            } catch (error) {
              console.error(`Error fetching subcategories for category ${category._id}:`, error);
            }
          }
        }
        return allItems;
      }
      const response = await api.get<ApiResponse<{ items: Item[] }>>('/items', {
        params: { subcategoryId: formData.subcategoryId },
      });
      return response.data.data.items;
    },
    enabled: true,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { 
      name: string; 
      code?: string; 
      subcategoryId: string; 
      price: number | string;
      description?: string;
    }) => {
      const response = await api.post<ApiResponse<{ item: Item }>>('/items', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Item created successfully');
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setIsDialogOpen(false);
      setFormData({ name: '', code: '', description: '', categoryId: '', subcategoryId: '', price: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create item');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { 
      id: string; 
      data: { 
        name?: string; 
        code?: string; 
        subcategoryId?: string; 
        price?: number | string;
        description?: string;
      } 
    }) => {
      try {
        const response = await api.put<ApiResponse<{ item: Item }>>(`/items/${id}`, data);
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 404 || error.response?.status === 405) {
          const response = await api.patch<ApiResponse<{ item: Item }>>(`/items/${id}`, data);
          return response.data;
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Item updated successfully');
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({ name: '', code: '', description: '', categoryId: '', subcategoryId: '', price: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update item');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<ApiResponse<{ item: Item }>>(`/items/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Item deactivated successfully');
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to deactivate item');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Item name is required');
      return;
    }
    if (!formData.subcategoryId) {
      toast.error('Please select a subcategory');
      return;
    }
    if (!formData.price || parseFloat(formData.price.toString()) < 0) {
      toast.error('Please enter a valid price');
      return;
    }
    
    const submitData = {
      name: formData.name.trim(),
      code: formData.code.trim() || undefined,
      subcategoryId: formData.subcategoryId,
      price: parseFloat(formData.price.toString()),
      description: formData.description.trim() || undefined,
    };
    
    if (editingItem) {
      updateMutation.mutate({
        id: editingItem._id,
        data: submitData,
      });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = async (item: Item) => {
    if (!confirm(`Are you sure you want to deactivate "${item.name}"?`)) {
      return;
    }
    deleteMutation.mutate(item._id);
  };

  const handleOpenDialog = (item?: Item) => {
    if (item) {
      setEditingItem(item);
      const subcategory = typeof item.subcategory === 'string' 
        ? null 
        : item.subcategory;
      const categoryId = subcategory && typeof subcategory.category === 'object'
        ? subcategory.category._id
        : '';
      const subcategoryId = typeof item.subcategory === 'string'
        ? item.subcategory
        : subcategory?._id || '';
      
      setFormData({
        name: item.name,
        code: item.code || '',
        description: item.description || '',
        categoryId,
        subcategoryId,
        price: fromSmallestUnit(item.priceSmallestUnit).toString(),
      });
    } else {
      setEditingItem(null);
      setFormData({ name: '', code: '', description: '', categoryId: '', subcategoryId: '', price: '' });
    }
    setIsDialogOpen(true);
  };

  const displayItems = items || [];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Item Master</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your product items</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="mb-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => setFormData({ ...formData, categoryId: value, subcategoryId: '' })}
              options={[
                { label: 'All Categories', value: '' },
                ...(categories?.map((cat) => ({ label: cat.name, value: cat._id })) || []),
              ]}
              placeholder="Select a category"
              ariaLabel="Filter by category"
            />
          </div>
          {formData.categoryId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Subcategory</label>
              <Select
                value={formData.subcategoryId}
                onValueChange={(value) => setFormData({ ...formData, subcategoryId: value })}
                options={[
                  { label: 'All Subcategories', value: '' },
                  ...(subcategories?.map((sub) => ({ label: sub.name, value: sub._id })) || []),
                ]}
                placeholder="Select a subcategory"
                ariaLabel="Filter by subcategory"
              />
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : displayItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No items found</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Name</TableHead>
                  <TableHead className="text-xs sm:text-sm">Code</TableHead>
                  <TableHead className="text-xs sm:text-sm">Category</TableHead>
                  <TableHead className="text-xs sm:text-sm">Subcategory</TableHead>
                  <TableHead className="text-xs sm:text-sm text-right">Price</TableHead>
                  <TableHead className="text-xs sm:text-sm">Status</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayItems.map((item) => {
                  const subcategory = typeof item.subcategory === 'string'
                    ? null
                    : item.subcategory;
                  const categoryName = subcategory && typeof subcategory.category === 'object'
                    ? subcategory.category.name
                    : 'Unknown';
                  const subcategoryName = typeof item.subcategory === 'string'
                    ? 'Unknown'
                    : subcategory?.name || 'Unknown';
                  
                  return (
                    <TableRow key={item._id}>
                      <TableCell className="text-xs sm:text-sm font-medium">
                        {item.name}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm text-gray-600">
                        {item.code || '-'}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm text-gray-600">
                        {categoryName}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm text-gray-600">
                        {subcategoryName}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm text-right font-medium">
                        {formatCurrency(item.priceSmallestUnit)}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            item.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(item)}
                            className="text-xs sm:text-sm"
                            disabled={!item.isActive}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          {item.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item)}
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
            setEditingItem(null);
            setFormData({ name: '', code: '', description: '', categoryId: '', subcategoryId: '', price: '' });
          }
        }}
        title={editingItem ? 'Edit Item' : 'Add Item'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => setFormData({ ...formData, categoryId: value, subcategoryId: '' })}
              options={categories?.map((cat) => ({ label: cat.name, value: cat._id })) || []}
              placeholder="Select a category"
              ariaLabel="Category selection"
              disabled={!!editingItem}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory *</label>
            <Select
              value={formData.subcategoryId}
              onValueChange={(value) => setFormData({ ...formData, subcategoryId: value })}
              options={subcategories?.map((sub) => ({ label: sub.name, value: sub._id })) || []}
              placeholder={formData.categoryId ? 'Select a subcategory' : 'Select a category first'}
              ariaLabel="Subcategory selection"
              disabled={!formData.categoryId || !!editingItem}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Item name"
              required
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="Item code (optional)"
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹) *</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0.00"
              required
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Item description (optional)"
              className="text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setEditingItem(null);
                setFormData({ name: '', code: '', description: '', categoryId: '', subcategoryId: '', price: '' });
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
                : editingItem 
                  ? 'Update' 
                  : 'Create'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

