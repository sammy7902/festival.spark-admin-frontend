import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { api } from '../lib/axios';
import { formatCurrency } from '../utils/currency';
import { toast } from 'sonner';
import type { ApiResponse, EarningsSummary, Bill } from '../types/api';

export const Earnings = () => {
  const queryClient = useQueryClient();
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });

  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['earnings', 'summary', fromDate, toDate, page, limit],
    queryFn: async () => {
      if (!fromDate || !toDate) {
        throw new Error('Please select both start and end dates');
      }
      if (new Date(fromDate) > new Date(toDate)) {
        throw new Error('Start date must be before end date');
      }
      console.log('Fetching earnings with params:', { startDate: fromDate, endDate: toDate, page, limit });
      const response = await api.get<ApiResponse<EarningsSummary>>('/earnings/summary', {
        params: {
          startDate: fromDate,
          endDate: toDate,
          page,
          limit,
        },
      });
      console.log('Earnings response:', response.data);
      return response.data.data;
    },
    enabled: !!fromDate && !!toDate,
    retry: false,
  });

  const handleApplyFilters = async () => {
    if (!fromDate || !toDate) {
      toast.error('Please select both start and end dates');
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      toast.error('Start date must be before end date');
      return;
    }
    setPage(1);
    // Force refetch with new dates
    await queryClient.invalidateQueries({ 
      queryKey: ['earnings', 'summary'],
      exact: false 
    });
    await refetch();
    toast.success('Filters applied');
  };

  const handleDateChange = (type: 'from' | 'to', value: string) => {
    if (type === 'from') {
      setFromDate(value);
    } else {
      setToDate(value);
    }
    // Reset to page 1 when dates change
    setPage(1);
  };

  const bills = data?.bills.docs || [];
  const totalEarnings = data?.totalEarnings.totalSmallestUnit || 0;
  const totalPages = data?.bills.totalPages || 1;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Earnings</h1>
        <p className="text-sm sm:text-base text-gray-600">View and filter your earnings by date range</p>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label htmlFor="from-date" className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <Input
              id="from-date"
              type="date"
              value={fromDate}
              onChange={(e) => handleDateChange('from', e.target.value)}
              aria-label="From date"
              className="text-sm"
              max={toDate}
            />
          </div>
          <div>
            <label htmlFor="to-date" className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <Input
              id="to-date"
              type="date"
              value={toDate}
              onChange={(e) => handleDateChange('to', e.target.value)}
              aria-label="To date"
              className="text-sm"
              min={fromDate}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleApplyFilters} className="w-full text-sm">
              Apply Filters
            </Button>
          </div>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Earnings</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(totalEarnings)}</p>
        </div>

        {isLoading || isFetching ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : bills.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No bills found for this date range</div>
        ) : (
          <>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Date</TableHead>
                      <TableHead className="text-xs sm:text-sm">Bill Number</TableHead>
                      <TableHead className="text-xs sm:text-sm">Customer</TableHead>
                      <TableHead className="text-xs sm:text-sm">Items</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bills.map((bill: Bill) => (
                      <TableRow key={bill._id}>
                        <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                          {new Date(bill.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="font-medium text-xs sm:text-sm">{bill.billNumber}</TableCell>
                        <TableCell className="text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                          {bill.customerName}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">{bill.items.length}</TableCell>
                        <TableCell className="text-right font-medium text-xs sm:text-sm">
                          {formatCurrency(bill.finalTotalSmallestUnit)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                <p className="text-xs sm:text-sm text-gray-600">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="text-xs sm:text-sm"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="text-xs sm:text-sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

