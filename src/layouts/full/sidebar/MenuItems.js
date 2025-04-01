import {
  IconLayoutDashboard,
  IconFolder,
  IconFolders,
  IconArchive,
  IconBook2,
  IconFileInvoice,
  IconCoin,
  IconBuildingFactory,
  IconTruckDelivery,
  IconShoppingCart,
  IconReportMoney,
  IconPackage,
  IconClockHour4,
  IconBottle,
  IconLetterCase,
  IconShadow,
  IconLogin,
  IconUserPlus,
  IconMoodHappy,
  IconAperture,
  IconReportAnalytics,
  IconChartHistogram,
  IconChartBar,
} from '@tabler/icons-react';

import { uniqueId } from 'lodash';

const Menuitems = [
  {
    navlabel: true,
    subheader: 'Home',
  },
  {
    id: uniqueId(),
    title: 'Dashboard',
    icon: IconLayoutDashboard,
    href: '/app/dashboard',
  },

  {
    navlabel: true,
    subheader: 'Masters',
  },
  {
    id: uniqueId(),
    title: 'Expense Type',
    icon: IconFolder,
    href: '/app/master/expense-type',
  },
  {
    id: uniqueId(),
    title: 'Expense Group',
    icon: IconFolders,
    href: '/app/master/expense-group',
  },
  {
    id: uniqueId(),
    title: 'Bucket',
    icon: IconArchive,
    href: '/app/master/bucket',
  },
  {
    id: uniqueId(),
    title: 'Ledger',
    icon: IconBook2,
    href: '/app/master/ledger',
  },
  {
    id: uniqueId(),
    title: 'Other Expenses',
    icon: IconFileInvoice,
    href: '/app/master/other-expenses',
  },
  {
    id: uniqueId(),
    title: 'Other Incomes',
    icon: IconCoin,
    href: '/app/master/other-incomes',
  },
  {
    id: uniqueId(),
    title: 'Plant',
    icon: IconBuildingFactory,
    href: '/app/master/plant',
  },
  {
    id: uniqueId(),
    title: 'Product',
    icon: IconTruckDelivery,
    href: '/app/master/product',
  },

  {
    navlabel: true,
    subheader: 'Inputs',
  },
  {
    id: uniqueId(),
    title: 'Sales',
    icon: IconShoppingCart,
    href: '/app/input/sales',
  },
  {
    id: uniqueId(),
    title: 'Ledgers',
    icon: IconReportMoney,
    href: '/app/input/ledgers',
  },
  {
    id: uniqueId(),
    title: 'Other Incomes',
    icon: IconCoin,
    href: '/app/input/other-incomes',
  },
  {
    id: uniqueId(),
    title: 'Other Expenses',
    icon: IconFileInvoice,
    href: '/app/input/other-expenses',
  },
  {
    id: uniqueId(),
    title: 'Closing Stock',
    icon: IconPackage,
    href: '/app/input/closing-stock',
  },
  {
    id: uniqueId(),
    title: 'VSI Hours',
    icon: IconClockHour4,
    href: '/app/input/vsi-hours',
  },
  {
    id: uniqueId(),
    title: 'Inward Consumption Slurry',
    icon: IconBottle,
    href: '/app/input/inward-consumption-slurry',
  },

  {
    navlabel: true,
    subheader: 'Reports',
  },
  {
    id: uniqueId(),
    title: 'Bucket Wise Report',
    icon: IconChartHistogram,
    href: '/app/reports/bucket-wise',
  },
  {
    id: uniqueId(),
    title: 'Avg Sales Price',
    icon: IconChartBar,
    href: '/app/reports/avg-sales-price',
  },
];

export default Menuitems;
