import React, { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import Loadable from '../layouts/full/shared/loadable/Loadable';
import ProtectedRoute from '../components/ProtectedRoute';
import AuthLogin from '../views/authentication/auth/AuthLogin';

/* ***Layouts**** */
const FullLayout = Loadable(lazy(() => import('../layouts/full/FullLayout')));
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')));

/* ****Pages***** */
const Dashboard = Loadable(lazy(() => import('../views/dashboard/Dashboard')));
const SamplePage = Loadable(lazy(() => import('../views/sample-page/SamplePage')));
const Icons = Loadable(lazy(() => import('../views/icons/Icons')));
const TypographyPage = Loadable(lazy(() => import('../views/utilities/TypographyPage')));
const Shadow = Loadable(lazy(() => import('../views/utilities/Shadow')));
const Error = Loadable(lazy(() => import('../views/authentication/Error')));
const Register = Loadable(lazy(() => import('../views/authentication/Register')));
const Login = Loadable(lazy(() => import('../views/authentication/Login')));

// Master Pages
const ExpenseType = Loadable(lazy(() => import('../views/masters/ExpenseType')));
const ExpenseGroup = Loadable(lazy(() => import('../views/masters/ExpenseGroup')));
const Bucket = Loadable(lazy(() => import('../views/masters/Bucket')));
const Ledger = Loadable(lazy(() => import('../views/masters/Ledger')));
const OtherExpenses = Loadable(lazy(() => import('../views/masters/OtherExpenses')));
const OtherIncomes = Loadable(lazy(() => import('../views/masters/OtherIncomes')));
const Plant = Loadable(lazy(() => import('../views/masters/Plant')));
const Product = Loadable(lazy(() => import('../views/masters/Product')));

// Input Pages
const Sales = Loadable(lazy(() => import('../views/inputs/Sales')));
const Ledgers = Loadable(lazy(() => import('../views/inputs/Ledgers')));
const OtherIncomesInput = Loadable(lazy(() => import('../views/inputs/OtherIncomesInput')));
const OtherExpensesInput = Loadable(lazy(() => import('../views/inputs/OtherExpensesInput')));
const ClosingStock = Loadable(lazy(() => import('../views/inputs/ClosingStock')));
const VSIHours = Loadable(lazy(() => import('../views/inputs/VSIHours')));
const InwardConsumptionSlurry = Loadable(lazy(() => import('../views/inputs/InwardConsumptionSlurry')));

// Report Pages
const BucketWiseReport = Loadable(lazy(() => import('../views/reports/BucketWiseReport')));
const AvgSalesPrice = Loadable(lazy(() => import('../views/reports/AvgSalesPrice.js')));
const Final = Loadable(lazy(() => import('../views/reports/AvgSalesPrice.jsx')));
const ProductionReport = Loadable(lazy(() => import('../views/reports/ProductionReport.js')));
const AverageCostReport = Loadable(lazy(() => import('../views/reports/AverageCostReport.js')));

const Router = [
  {
    path: '/',
    element: <Navigate to="/auth/login" />
  },
  {
    path: '/auth',
    children: [
      {
        path: 'login',
        element: <Login />
      }
    ]
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <FullLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '', element: <Navigate to="/app/dashboard" /> },
      { path: 'dashboard', element: <Dashboard /> },
      
      // Master routes
      { path: 'master/expense-type', element: <ExpenseType /> },
      { path: 'master/expense-group', element: <ExpenseGroup /> },
      { path: 'master/bucket', element: <Bucket /> },
      { path: 'master/ledger', element: <Ledger /> },
      { path: 'master/other-expenses', element: <OtherExpenses /> },
      { path: 'master/other-incomes', element: <OtherIncomes /> },
      { path: 'master/plant', element: <Plant /> },
      { path: 'master/product', element: <Product /> },

      // Input routes
      { path: 'input/sales', element: <Sales /> },
      { path: 'input/ledgers', element: <Ledgers /> },
      { path: 'input/other-incomes', element: <OtherIncomesInput /> },
      { path: 'input/other-expenses', element: <OtherExpensesInput /> },
      { path: 'input/closing-stock', element: <ClosingStock /> },
      { path: 'input/vsi-hours', element: <VSIHours /> },
      { path: 'input/inward-consumption-slurry', element: <InwardConsumptionSlurry /> },

      // Report routes
      { path: 'reports/bucket-wise', element: <BucketWiseReport /> },
      { path: 'reports/avg-sales-price', element: <AvgSalesPrice /> },
      { path: 'reports/production-report', element: <ProductionReport /> },
      { path: 'reports/avg-cost', element: <AverageCostReport /> },
      { path: 'reports/final', element: <Final /> },

      // Error pages
      { path: '404', element: <Error /> },
      { path: '*', element: <Navigate to="/404" /> }
    ]
  },
];

export default Router;
