import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { SimpleArea } from '../components/charts/SimpleArea';
import { api } from '../lib/axios';
import { formatCurrency } from '../utils/currency';
import type { ApiResponse, EarningsSummary } from '../types/api';
import { DollarSign, FileText, TrendingUp, Calendar } from 'lucide-react';

const getLast7Days = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(date.toISOString().split('T')[0]);
  }
  return days;
};

export const Dashboard = () => {
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['earnings', 'summary', { from: sevenDaysAgoStr, to: today }],
    queryFn: async () => {
      const response = await api.get<ApiResponse<EarningsSummary>>('/earnings/summary', {
        params: { startDate: sevenDaysAgoStr, endDate: today, limit: 100 },
      });
      return response.data.data;
    },
  });

  const { data: totalData } = useQuery({
    queryKey: ['earnings', 'total', 'all-time'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<{ earnings: { totalSmallestUnit: number; totalFormatted: string } }>>(
        '/earnings/total'
      );
      console.log('Total earnings response:', response.data);
      return response.data.data.earnings;
    },
  });

  const { data: todayData } = useQuery({
    queryKey: ['earnings', 'total', 'today', today],
    queryFn: async () => {
      const response = await api.get<ApiResponse<{ earnings: { totalSmallestUnit: number; totalFormatted: string } }>>(
        '/earnings/total',
        { 
          params: { 
            startDate: today,
            endDate: today
          } 
        }
      );
      console.log('Today earnings response:', response.data);
      return response.data.data.earnings;
    },
  });

  const chartData =
    summaryData?.bills.docs.map((bill) => ({
      date: bill.createdAt,
      value: bill.finalTotalSmallestUnit,
    })) || [];

  const totalBills = summaryData?.bills.totalDocs || 0;
  const totalRevenue = totalData?.totalSmallestUnit || 0;
  const todayRevenue = todayData?.totalSmallestUnit || 0;
  const last7DaysRevenue = summaryData?.totalEarnings?.totalSmallestUnit || 0;

  const stats = [
    {
      label: 'Total Bills',
      value: totalBills.toString(),
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: "Today's Revenue",
      value: formatCurrency(todayRevenue),
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Last 7 Days',
      value: formatCurrency(last7DaysRevenue),
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">Overview of your billing activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">{stat.label}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-2 sm:p-3 rounded-lg flex-shrink-0 ml-2`}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Revenue Trend (Last 7 Days)</h2>
        <div className="overflow-x-auto">
          <SimpleArea data={chartData} height={250} />
        </div>
      </Card>
    </div>
  );
};

