import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { api } from '../../lib/axios';
import { formatCurrency, toSmallestUnit } from '../../utils/currency';
import { downloadFile, copyToClipboard, getBackendPDFUrl, ensureFrontendUrl } from '../../utils/download';
import { toast } from 'sonner';
import type {
  ApiResponse,
  Category,
  Subcategory,
  Item,
  CreateBillRequest,
  CreateBillResponse,
} from '../../types/api';
import { ChevronRight, ChevronLeft, Plus, Trash2, Copy, Download } from 'lucide-react';

const itemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  code: z.string().optional(),
  price: z.union([z.number(), z.string()]).refine(
    (val) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return !isNaN(num) && num >= 0;
    },
    { message: 'Price must be a valid non-negative number' }
  ),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
});

type BillItem = z.infer<typeof itemSchema> & {
  id: string;
  amount?: number;
};

const step1Schema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  subCategoryId: z.string().min(1, 'Subcategory is required'),
});

const step3Schema = z.object({
  customerPhone: z.string()
    .min(1, 'Phone number is required')
    .refine(
      (val) => {
        // Must start with +91 and have exactly 10 more digits
        return /^\+91\d{10}$/.test(val);
      },
      { message: 'Phone must be a valid 10-digit Indian number (e.g., +919664858715)' }
    ),
  customerEmails: z.array(z.string().email()).optional(),
  customerName: z.string().min(1, 'Customer name is required'),
  customerAddress: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  discount: z.union([z.number(), z.string()]).optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step3Data = z.infer<typeof step3Schema>;

export const BillStepper = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data>({
    categoryId: '',
    subCategoryId: '',
  });
  const [items, setItems] = useState<BillItem[]>([]);
  const [step3Data, setStep3Data] = useState<Step3Data>({
    customerPhone: '+91',
    customerEmails: [],
    customerName: '',
    customerAddress: {},
    discount: undefined,
  });
  const [emailInput, setEmailInput] = useState('');
  const [createdBill, setCreatedBill] = useState<CreateBillResponse | null>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await api.get<ApiResponse<{ categories: Category[] }>>('/categories');
        if (!response.data?.data?.categories) {
          console.error('Invalid categories response:', response.data);
          return [];
        }
        return response.data.data.categories;
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError('Failed to load categories. Please refresh the page.');
        return [];
      }
    },
    retry: 1,
  });

  // Fetch subcategories
  const { data: subcategoriesData, isLoading: subcategoriesLoading } = useQuery({
    queryKey: ['subcategories', step1Data.categoryId],
    queryFn: async () => {
      if (!step1Data.categoryId) return [];
      try {
        const response = await api.get<ApiResponse<{ subcategories: Subcategory[] }>>(
          `/categories/${step1Data.categoryId}/subcategories`
        );
        return response.data?.data?.subcategories || [];
      } catch (error) {
        console.error('Error fetching subcategories:', error);
        return [];
      }
    },
    enabled: !!step1Data.categoryId,
  });

  // Fetch items
  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['items', step1Data.subCategoryId],
    queryFn: async () => {
      if (!step1Data.subCategoryId) return [];
      try {
        const response = await api.get<ApiResponse<{ items: Item[] }>>('/items', {
          params: { subcategoryId: step1Data.subCategoryId },
        });
        return response.data?.data?.items || [];
      } catch (error) {
        console.error('Error fetching items:', error);
        return [];
      }
    },
    enabled: !!step1Data.subCategoryId,
  });

  const createBillMutation = useMutation({
    mutationFn: async (data: CreateBillRequest) => {
      const response = await api.post<ApiResponse<CreateBillResponse>>('/bills', data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        setCreatedBill(data.data);
        setCurrentStep(4);
        toast.success('Bill created successfully!');
      } else {
        toast.error(data.message || 'Failed to create bill');
      }
    },
    onError: (error: any) => {
      console.error('Bill creation error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to create bill';
      toast.error(message);
    },
  });

  const handleStep1Next = () => {
    const result = step1Schema.safeParse(step1Data);
    if (!result.success) {
      toast.error('Please select category and subcategory');
      return;
    }
    setCurrentStep(2);
  };

  const handleAddItem = () => {
    const newItem: BillItem = {
      id: Date.now().toString(),
      name: '',
      code: '',
      price: 0,
      quantity: 1,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof BillItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'price' || field === 'quantity') {
            const price = typeof updated.price === 'string' ? parseFloat(updated.price) : updated.price;
            const qty = typeof updated.quantity === 'string' ? parseInt(updated.quantity, 10) : updated.quantity;
            updated.amount = (price || 0) * (qty || 0);
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleSelectExistingItem = (item: Item) => {
    const newItem: BillItem = {
      id: Date.now().toString(),
      name: item.name,
      code: item.code || '',
      price: item.priceSmallestUnit / 100,
      quantity: 1,
      amount: item.priceSmallestUnit / 100,
    };
    setItems([...items, newItem]);
  };

  const handleStep2Next = () => {
    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    for (const item of items) {
      const result = itemSchema.safeParse(item);
      if (!result.success) {
        toast.error(`Invalid item: ${result.error.errors[0].message}`);
        return;
      }
    }

    setCurrentStep(3);
  };

  const handleAddEmail = () => {
    if (emailInput && z.string().email().safeParse(emailInput).success) {
      setStep3Data({
        ...step3Data,
        customerEmails: [...(step3Data.customerEmails || []), emailInput],
      });
      setEmailInput('');
    }
  };

  const handleRemoveEmail = (email: string) => {
    setStep3Data({
      ...step3Data,
      customerEmails: step3Data.customerEmails?.filter((e) => e !== email) || [],
    });
  };

  const handleStep3Submit = () => {
    const result = step3Schema.safeParse(step3Data);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    // Convert prices to strings (backend accepts string or number)
    const billData: CreateBillRequest = {
      customerName: step3Data.customerName.trim(),
      customerPhone: step3Data.customerPhone.trim(),
      customerEmail: step3Data.customerEmails?.[0]?.trim() || undefined,
      customerAddress: Object.keys(step3Data.customerAddress || {}).length > 0 
        ? step3Data.customerAddress 
        : undefined,
      items: items.map((item) => {
        const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
        return {
          name: item.name.trim(),
          code: item.code?.trim() || undefined,
          price: price.toString(), // Backend accepts string or number
          quantity: item.quantity,
        };
      }),
      discount: step3Data.discount
        ? (typeof step3Data.discount === 'string'
          ? parseFloat(step3Data.discount)
          : step3Data.discount).toString()
        : undefined,
    };

    console.log('Creating bill with data:', billData);
    createBillMutation.mutate(billData);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const discount = step3Data.discount
    ? typeof step3Data.discount === 'string'
      ? parseFloat(step3Data.discount)
      : step3Data.discount
    : 0;
  const total = Math.max(0, subtotal - discount);

  const handleDownloadPDF = async () => {
    if (!createdBill?.pdfLink) {
      toast.error('PDF link not available');
      return;
    }

    try {
      // Convert frontend URL to backend PDF URL for direct download
      const backendPdfUrl = getBackendPDFUrl(createdBill.pdfLink);
      
      // Try download first
      await downloadFile(backendPdfUrl, `Bill-${createdBill.bill.billNumber}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      // Fallback: open backend URL in new tab
      try {
        const backendPdfUrl = getBackendPDFUrl(createdBill.pdfLink);
        window.open(backendPdfUrl, '_blank', 'noopener,noreferrer');
        toast.success('PDF opened in new tab');
      } catch (openError) {
        console.error('Failed to open PDF:', openError);
        toast.error('Failed to download PDF. Please try the copy link option.');
      }
    }
  };

  const handleCopyLink = async () => {
    if (!createdBill?.pdfLink) {
      toast.error('PDF link not available');
      return;
    }

    try {
      // Ensure we're copying the frontend URL, not backend URL
      const frontendUrl = ensureFrontendUrl(createdBill.pdfLink);
      await copyToClipboard(frontendUrl);
      toast.success('Link copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  if (currentStep === 4 && createdBill) {
    return (
      <Card className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Bill Created Successfully!</h2>
          <p className="text-sm sm:text-base text-gray-600">Bill Number: {createdBill.bill.billNumber}</p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Amount</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">
              {formatCurrency(createdBill.bill.finalTotalSmallestUnit)}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs sm:text-sm font-medium text-gray-700">Notifications:</p>
            <div className="space-y-1 text-xs sm:text-sm text-gray-600">
              <p>PDF: {createdBill.notifications.pdf.success ? '✅ Sent' : '❌ Failed'}</p>
              <p>SMS: {createdBill.notifications.sms.success ? '✅ Sent' : '❌ Failed'}</p>
              <p>Email: {createdBill.notifications.email.success ? '✅ Sent' : '❌ Failed'}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button onClick={handleDownloadPDF} className="flex-1 w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={handleCopyLink} className="flex-1 w-full sm:w-auto">
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
        </div>

        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={() => {
              setCurrentStep(1);
              setStep1Data({ categoryId: '', subCategoryId: '' });
              setItems([]);
              setStep3Data({
                customerPhone: '+91',
                customerEmails: [],
                customerName: '',
                customerAddress: {},
                discount: undefined,
              });
              setCreatedBill(null);
            }}
          >
            Create New Bill
          </Button>
        </div>
      </Card>
    );
  }

  // Show error if any critical error occurs
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Error</h2>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Generate Bill</h1>
        <p className="text-sm sm:text-base text-gray-600">Create a new bill in 3 simple steps</p>
      </div>

      <div className="flex items-center justify-center mb-6 sm:mb-8 overflow-x-auto pb-2">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center flex-shrink-0">
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-sm sm:text-base ${
                currentStep >= step
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step}
            </div>
            {step < 3 && (
              <div
                className={`w-12 sm:w-24 h-1 mx-1 sm:mx-2 ${
                  currentStep > step ? 'bg-gray-900' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Card className="p-4 sm:p-6">
        {/* Step 1: Category & Subcategory */}
        {currentStep === 1 && (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Step 1: Select Category</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              {categoriesError ? (
                <div className="text-sm text-red-600">Failed to load categories. Please try again.</div>
              ) : (
                <Select
                  value={step1Data.categoryId}
                  onValueChange={(value) => {
                    setStep1Data({ categoryId: value, subCategoryId: '' });
                  }}
                  options={categoriesData?.map((cat) => ({ label: cat.name, value: cat._id })) || []}
                  placeholder={categoriesLoading ? 'Loading categories...' : 'Select a category'}
                  ariaLabel="Category selection"
                  disabled={categoriesLoading}
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
              <Select
                value={step1Data.subCategoryId}
                onValueChange={(value) => {
                  setStep1Data({ ...step1Data, subCategoryId: value });
                }}
                options={subcategoriesData?.map((sub) => ({ label: sub.name, value: sub._id })) || []}
                placeholder={subcategoriesLoading ? 'Loading subcategories...' : step1Data.categoryId ? 'Select a subcategory' : 'Select a category first'}
                ariaLabel="Subcategory selection"
                disabled={!step1Data.categoryId || subcategoriesLoading}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleStep1Next} disabled={!step1Data.categoryId || !step1Data.subCategoryId}>
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Add Items */}
        {currentStep === 2 && (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Step 2: Add Items</h2>

            {itemsLoading && step1Data.subCategoryId && (
              <div className="mb-4 text-sm text-gray-600">Loading items...</div>
            )}
            {itemsData && itemsData.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Select from Item Master (optional):
                </label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    const selectedItem = itemsData.find(item => item._id === value);
                    if (selectedItem) {
                      handleSelectExistingItem(selectedItem);
                    }
                  }}
                  options={itemsData.map((item) => ({ 
                    label: `${item.name}${item.code ? ` (${item.code})` : ''} - ${formatCurrency(item.priceSmallestUnit)}`, 
                    value: item._id 
                  }))}
                  placeholder="Select an item to pre-fill name and code"
                  ariaLabel="Select item from master"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Selecting an item will pre-fill the name and code. You can still edit price and quantity.
                </p>
              </div>
            )}
            {itemsData && itemsData.length === 0 && step1Data.subCategoryId && !itemsLoading && (
              <div className="mb-4 text-xs sm:text-sm text-gray-500">
                No existing items found for this subcategory. You can add items manually or create them in Item Master.
              </div>
            )}

            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="border rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-0">
                  {/* Mobile: Stacked layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 sm:items-end">
                    <div className="col-span-1 sm:col-span-4">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Name</label>
                      <Input
                        value={item.name}
                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                        placeholder="Item name"
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Code</label>
                      <Input
                        value={item.code}
                        onChange={(e) => handleItemChange(item.id, 'code', e.target.value)}
                        placeholder="Code"
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Price</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                        placeholder="0.00"
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value, 10))}
                        placeholder="1"
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Amount</p>
                      <p className="text-xs sm:text-sm font-semibold">{formatCurrency(toSmallestUnit(item.amount || 0))}</p>
                    </div>
                    <div className="col-span-1 sm:col-span-1 flex items-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                        aria-label="Remove item"
                        className="w-full sm:w-auto"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={handleAddItem}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-gray-700">Subtotal:</span>
                <span className="text-lg font-semibold">{formatCurrency(toSmallestUnit(subtotal))}</span>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleStep2Next} disabled={items.length === 0}>
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Customer & Review */}
        {currentStep === 3 && (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Step 3: Customer & Review</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
                <Input
                  value={step3Data.customerName}
                  onChange={(e) => setStep3Data({ ...step3Data, customerName: e.target.value })}
                  placeholder="Customer name"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">
                    +91
                  </div>
                  <Input
                    value={step3Data.customerPhone.startsWith('+91') ? step3Data.customerPhone.slice(3) : step3Data.customerPhone}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Remove any non-digit characters
                      const digitsOnly = value.replace(/[^\d]/g, '');
                      // Limit to exactly 10 digits
                      const limitedDigits = digitsOnly.slice(0, 10);
                      // Always prepend +91
                      const phoneValue = '+91' + limitedDigits;
                      setStep3Data({ ...step3Data, customerPhone: phoneValue });
                    }}
                    placeholder="9664858715"
                    className="text-sm pl-12"
                    maxLength={10}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Enter 10-digit Indian mobile number</p>
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <h3 className="text-sm font-semibold text-gray-900">Customer Address (Optional)</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street</label>
                  <Input
                    value={step3Data.customerAddress?.street || ''}
                    onChange={(e) =>
                      setStep3Data({
                        ...step3Data,
                        customerAddress: {
                          ...step3Data.customerAddress,
                          street: e.target.value,
                        },
                      })
                    }
                    placeholder="Street address"
                    className="text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <Input
                      value={step3Data.customerAddress?.city || ''}
                      onChange={(e) =>
                        setStep3Data({
                          ...step3Data,
                          customerAddress: {
                            ...step3Data.customerAddress,
                            city: e.target.value,
                          },
                        })
                      }
                      placeholder="City"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <Input
                      value={step3Data.customerAddress?.state || ''}
                      onChange={(e) =>
                        setStep3Data({
                          ...step3Data,
                          customerAddress: {
                            ...step3Data.customerAddress,
                            state: e.target.value,
                          },
                        })
                      }
                      placeholder="State"
                      className="text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
                    <Input
                      value={step3Data.customerAddress?.zipCode || ''}
                      onChange={(e) =>
                        setStep3Data({
                          ...step3Data,
                          customerAddress: {
                            ...step3Data.customerAddress,
                            zipCode: e.target.value,
                          },
                        })
                      }
                      placeholder="Zip code"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <Input
                      value={step3Data.customerAddress?.country || ''}
                      onChange={(e) =>
                        setStep3Data({
                          ...step3Data,
                          customerAddress: {
                            ...step3Data.customerAddress,
                            country: e.target.value,
                          },
                        })
                      }
                      placeholder="Country"
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Addresses</label>
              <div className="flex flex-col sm:flex-row gap-2 mb-2">
                <Input
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="customer@example.com"
                  className="text-sm flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddEmail();
                    }
                  }}
                />
                <Button variant="outline" onClick={handleAddEmail} className="w-full sm:w-auto">
                  Add
                </Button>
              </div>
              {step3Data.customerEmails && step3Data.customerEmails.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {step3Data.customerEmails.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-gray-100 rounded-full text-xs sm:text-sm"
                    >
                      {email}
                      <button
                        onClick={() => handleRemoveEmail(email)}
                        className="text-red-600 hover:text-red-800"
                        aria-label={`Remove ${email}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Discount (optional)</label>
              <Input
                type="number"
                step="0.01"
                value={step3Data.discount || ''}
                onChange={(e) =>
                  setStep3Data({
                    ...step3Data,
                    discount: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                placeholder="0.00"
                className="text-sm"
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Review</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Item</TableHead>
                      <TableHead className="text-xs sm:text-sm">Qty</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Price</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs sm:text-sm">{item.name}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{item.quantity}</TableCell>
                        <TableCell className="text-right text-xs sm:text-sm">
                          {formatCurrency(toSmallestUnit(typeof item.price === 'string' ? parseFloat(item.price) : item.price))}
                        </TableCell>
                        <TableCell className="text-right font-medium text-xs sm:text-sm">
                          {formatCurrency(toSmallestUnit(item.amount || 0))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Subtotal:</span>
                  <span className="text-sm font-medium">{formatCurrency(toSmallestUnit(subtotal))}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Discount:</span>
                    <span className="text-sm font-medium text-red-600">
                      -{formatCurrency(toSmallestUnit(discount))}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-lg font-bold">{formatCurrency(toSmallestUnit(total))}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleStep3Submit}
                disabled={createBillMutation.isPending}
              >
                {createBillMutation.isPending ? 'Creating...' : 'Create Bill'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

