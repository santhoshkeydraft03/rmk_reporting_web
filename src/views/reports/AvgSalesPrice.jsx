import { useState, useMemo } from 'react';
import { 
  Box, 
  Card, 
  Typography, 
  Stack, 
  Button, 
  IconButton, 
  Tooltip,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ReportGrid from '../../components/ReportGrid';
import PageContainer from '../../components/container/PageContainer';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import BarChartIcon from '@mui/icons-material/BarChart';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';

const AvgSalesPrice = () => {
  // Filter states
  const [selectedPlant, setSelectedPlant] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Column definitions with advanced formatting
  const columnDefs = useMemo(() => [
    {
      headerName: 'Date',
      field: 'date',
      width: 100,
      filter: 'agDateColumnFilter',
      filterParams: {
        comparator: (filterLocalDateAtMidnight, cellValue) => {
          const dateParts = cellValue.split('/');
          const cellDate = new Date(
            Number(dateParts[2]),
            Number(dateParts[1]) - 1,
            Number(dateParts[0])
          );
          if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) return 0;
          if (cellDate < filterLocalDateAtMidnight) return -1;
          if (cellDate > filterLocalDateAtMidnight) return 1;
        },
      },
      flex: 0.8,
    },
    {
      headerName: 'Product',
      field: 'product',
      width: 130,
      filter: 'agTextColumnFilter',
      pinned: 'left',
      flex: 1,
    },
    {
      headerName: 'Plant',
      field: 'plant',
      width: 110,
      flex: 0.8,
    },
    {
      headerName: 'Customer',
      field: 'customer',
      width: 150,
      flex: 1.2,
    },
    {
      headerName: 'Quantity',
      field: 'quantity',
      width: 110,
      type: 'numericColumn',
      filter: 'agNumberColumnFilter',
      valueFormatter: params => params.value?.toLocaleString() ?? '',
      cellClass: 'numeric-cell',
      flex: 0.8,
    },
    {
      headerName: 'Unit Price',
      field: 'unitPrice',
      width: 120,
      type: 'numericColumn',
      valueFormatter: params => 
        params.value ? `₹${params.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '',
      cellClass: 'numeric-cell',
      flex: 1,
    },
    {
      headerName: 'Total Amount',
      field: 'totalAmount',
      width: 140,
      type: 'numericColumn',
      valueFormatter: params => 
        params.value ? `₹${params.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '',
      cellClass: 'numeric-cell',
      aggFunc: 'sum',
      flex: 1.2,
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 120,
      cellRenderer: params => {
        const statusClass = `status-cell status-${params.value?.toLowerCase()}`;
        return <div className={statusClass}>{params.value}</div>;
      },
      cellStyle: { display: 'flex', alignItems: 'center', padding: '0 16px' },
      flex: 0.8,
    },
  ], []);

  // Add more sample data to demonstrate scrolling
  const rowData = useMemo(() => [
    { date: '01/04/2024', product: 'Product A', plant: 'Plant 1', customer: 'Customer 1', quantity: 1500, unitPrice: 2500.00, totalAmount: 3750000.00, status: 'Completed' },
    { date: '01/04/2024', product: 'Product B', plant: 'Plant 2', customer: 'Customer 2', quantity: 2000, unitPrice: 1800.00, totalAmount: 3600000.00, status: 'Pending' },
    { date: '01/04/2024', product: 'Product C', plant: 'Plant 3', customer: 'Customer 5', quantity: 950, unitPrice: 2800.00, totalAmount: 2660000.00, status: 'Completed' },
    { date: '01/04/2024', product: 'Product D', plant: 'Plant 1', customer: 'Customer 6', quantity: 3000, unitPrice: 1650.00, totalAmount: 4950000.00, status: 'Completed' },
    { date: '02/04/2024', product: 'Product A', plant: 'Plant 1', customer: 'Customer 3', quantity: 1200, unitPrice: 2600.00, totalAmount: 3120000.00, status: 'Completed' },
    { date: '02/04/2024', product: 'Product C', plant: 'Plant 3', customer: 'Customer 1', quantity: 800, unitPrice: 3200.00, totalAmount: 2560000.00, status: 'Completed' },
    { date: '02/04/2024', product: 'Product B', plant: 'Plant 2', customer: 'Customer 7', quantity: 1600, unitPrice: 1900.00, totalAmount: 3040000.00, status: 'Pending' },
    { date: '02/04/2024', product: 'Product D', plant: 'Plant 1', customer: 'Customer 8', quantity: 2200, unitPrice: 1700.00, totalAmount: 3740000.00, status: 'Completed' },
    { date: '03/04/2024', product: 'Product B', plant: 'Plant 2', customer: 'Customer 4', quantity: 1800, unitPrice: 1850.00, totalAmount: 3330000.00, status: 'Pending' },
    { date: '03/04/2024', product: 'Product A', plant: 'Plant 1', customer: 'Customer 9', quantity: 2500, unitPrice: 2450.00, totalAmount: 6125000.00, status: 'Completed' },
    { date: '03/04/2024', product: 'Product C', plant: 'Plant 3', customer: 'Customer 10', quantity: 1100, unitPrice: 2900.00, totalAmount: 3190000.00, status: 'Cancelled' },
    { date: '03/04/2024', product: 'Product D', plant: 'Plant 1', customer: 'Customer 2', quantity: 1750, unitPrice: 1750.00, totalAmount: 3062500.00, status: 'Completed' },
    { date: '04/04/2024', product: 'Product A', plant: 'Plant 1', customer: 'Customer 5', quantity: 1900, unitPrice: 2550.00, totalAmount: 4845000.00, status: 'Pending' },
    { date: '04/04/2024', product: 'Product B', plant: 'Plant 2', customer: 'Customer 1', quantity: 2800, unitPrice: 1750.00, totalAmount: 4900000.00, status: 'Completed' },
    { date: '04/04/2024', product: 'Product C', plant: 'Plant 3', customer: 'Customer 7', quantity: 1300, unitPrice: 2950.00, totalAmount: 3835000.00, status: 'Completed' },
    { date: '04/04/2024', product: 'Product D', plant: 'Plant 1', customer: 'Customer 4', quantity: 2100, unitPrice: 1800.00, totalAmount: 3780000.00, status: 'Pending' },
    { date: '05/04/2024', product: 'Product A', plant: 'Plant 1', customer: 'Customer 8', quantity: 1600, unitPrice: 2700.00, totalAmount: 4320000.00, status: 'Completed' },
    { date: '05/04/2024', product: 'Product B', plant: 'Plant 2', customer: 'Customer 3', quantity: 2400, unitPrice: 1850.00, totalAmount: 4440000.00, status: 'Cancelled' },
    { date: '05/04/2024', product: 'Product C', plant: 'Plant 3', customer: 'Customer 6', quantity: 900, unitPrice: 3100.00, totalAmount: 2790000.00, status: 'Completed' },
    { date: '05/04/2024', product: 'Product D', plant: 'Plant 1', customer: 'Customer 10', quantity: 2600, unitPrice: 1600.00, totalAmount: 4160000.00, status: 'Pending' },
    { date: '06/04/2024', product: 'Product A', plant: 'Plant 1', customer: 'Customer 3', quantity: 2100, unitPrice: 2550.00, totalAmount: 5355000.00, status: 'Completed' },
    { date: '06/04/2024', product: 'Product B', plant: 'Plant 2', customer: 'Customer 5', quantity: 1700, unitPrice: 1900.00, totalAmount: 3230000.00, status: 'Pending' },
    { date: '06/04/2024', product: 'Product C', plant: 'Plant 3', customer: 'Customer 8', quantity: 1400, unitPrice: 2850.00, totalAmount: 3990000.00, status: 'Completed' },
    { date: '06/04/2024', product: 'Product D', plant: 'Plant 1', customer: 'Customer 1', quantity: 2300, unitPrice: 1700.00, totalAmount: 3910000.00, status: 'Completed' },
    { date: '07/04/2024', product: 'Product A', plant: 'Plant 1', customer: 'Customer 7', quantity: 1800, unitPrice: 2650.00, totalAmount: 4770000.00, status: 'Pending' },
    { date: '07/04/2024', product: 'Product B', plant: 'Plant 2', customer: 'Customer 9', quantity: 2500, unitPrice: 1750.00, totalAmount: 4375000.00, status: 'Completed' },
    { date: '07/04/2024', product: 'Product C', plant: 'Plant 3', customer: 'Customer 2', quantity: 1000, unitPrice: 3000.00, totalAmount: 3000000.00, status: 'Cancelled' },
    { date: '07/04/2024', product: 'Product D', plant: 'Plant 1', customer: 'Customer 6', quantity: 1900, unitPrice: 1800.00, totalAmount: 3420000.00, status: 'Completed' },
    { date: '08/04/2024', product: 'Product A', plant: 'Plant 1', customer: 'Customer 4', quantity: 2200, unitPrice: 2500.00, totalAmount: 5500000.00, status: 'Completed' },
    { date: '08/04/2024', product: 'Product B', plant: 'Plant 2', customer: 'Customer 10', quantity: 1500, unitPrice: 1950.00, totalAmount: 2925000.00, status: 'Pending' }
  ], []);

  const gridOptions = {
    enableRangeSelection: true,
    enableCellTextSelection: true,
    groupDisplayType: 'multipleColumns',
    groupDefaultExpanded: 1,
    rowGroup: false,
    // Add these options for better scrolling experience
    suppressScrollOnNewData: true,
    suppressAnimationFrame: false,
  };

  // Get unique plants for filter dropdown
  const plants = useMemo(() => {
    const uniquePlants = [...new Set(rowData.map(row => row.plant))];
    return uniquePlants.sort();
  }, [rowData]);

  // Filter the data based on selected filters
  const filteredData = useMemo(() => {
    return rowData.filter(row => {
      // Plant filter
      if (selectedPlant && row.plant !== selectedPlant) {
        return false;
      }

      // Date filter
      if (startDate || endDate) {
        const [day, month, year] = row.date.split('/');
        const rowDate = new Date(Number(year), Number(month) - 1, Number(day));

        if (startDate && rowDate < startDate) {
          return false;
        }
        if (endDate && rowDate > endDate) {
          return false;
        }
      }

      return true;
    });
  }, [rowData, selectedPlant, startDate, endDate]);

  // Calculate totals for the footer using filtered data
  const pinnedBottomRowData = useMemo(() => {
    const totals = filteredData.reduce((acc, row) => {
      acc.quantity += row.quantity;
      acc.totalAmount += row.totalAmount;
      return acc;
    }, { quantity: 0, totalAmount: 0 });

    const avgUnitPrice = totals.totalAmount / totals.quantity;

    return [{
      date: 'Total',
      product: `${filteredData.length} Records`,
      quantity: totals.quantity,
      unitPrice: avgUnitPrice,
      totalAmount: totals.totalAmount,
      status: '',
      _cellClassRules: {
        'numeric-cell': params => ['quantity', 'unitPrice', 'totalAmount'].includes(params.colDef.field),
      }
    }];
  }, [filteredData]);

  // Handle filter reset
  const handleResetFilters = () => {
    setSelectedPlant('');
    setStartDate(null);
    setEndDate(null);
  };

  return (
    <PageContainer title="Average Sales Price Report" description="Detailed sales analysis with pricing information">
      <Box sx={{ p: 0 }}>
        <Stack 
          direction="row" 
          justifyContent="space-between" 
          alignItems="center" 
          sx={{ 
            mb: 3,
            '& .MuiButton-root': {
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 500,
              px: 2,
              py: 0.75,
              fontSize: '0.875rem',
              minWidth: '100px',
              '& .MuiSvgIcon-root': {
                fontSize: '1.25rem',
              }
            }
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1.25rem' }}>
              Average Sales Price Report
            </Typography>
            <Tooltip title="Refresh Data">
              <IconButton 
                size="small" 
                sx={{ 
                  ml: 0.5, 
                  p: 1, 
                  bgcolor: 'rgba(93, 135, 255, 0.1)', 
                  color: '#5d87ff',
                  '&:hover': {
                    bgcolor: 'rgba(93, 135, 255, 0.2)',
                  }
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button
              size="medium"
              variant="outlined"
              startIcon={<FilterAltIcon />}
              onClick={() => {
                // Toggle side panel with filters
              }}
              sx={{ 
                color: '#2a3547', 
                borderColor: '#edf2f6',
                '&:hover': {
                  borderColor: '#5d87ff',
                  bgcolor: 'rgba(93, 135, 255, 0.08)',
                }
              }}
            >
              Filters
            </Button>
            <Button
              size="medium"
              variant="outlined"
              startIcon={<BarChartIcon />}
              onClick={() => {
                // Open charts panel
              }}
              sx={{ 
                color: '#2a3547', 
                borderColor: '#edf2f6',
                '&:hover': {
                  borderColor: '#5d87ff',
                  bgcolor: 'rgba(93, 135, 255, 0.08)',
                }
              }}
            >
              Charts
            </Button>
            <Button
              size="medium"
              variant="contained"
              startIcon={<FileDownloadIcon />}
              onClick={() => {
                // Trigger export
              }}
              sx={{ 
                bgcolor: '#5d87ff', 
                '&:hover': { 
                  bgcolor: '#4570ea' 
                },
                boxShadow: 'none'
              }}
            >
              Export
            </Button>
          </Stack>
        </Stack>
        
        {/* Filter Section */}
        <Card 
          sx={{ 
            p: 2, 
            mb: 2, 
            borderRadius: '12px',
            border: '1px solid #edf2f6',
            boxShadow: 'none',
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Plant</InputLabel>
                <Select
                  value={selectedPlant}
                  onChange={(e) => setSelectedPlant(e.target.value)}
                  label="Plant"
                >
                  <MenuItem value="">All Plants</MenuItem>
                  {plants.map((plant) => (
                    <MenuItem key={plant} value={plant}>{plant}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  slotProps={{ 
                    textField: { 
                      size: 'small',
                      fullWidth: true,
                    } 
                  }}
                  format="dd/MM/yyyy"
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  slotProps={{ 
                    textField: { 
                      size: 'small',
                      fullWidth: true,
                    } 
                  }}
                  format="dd/MM/yyyy"
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={() => {}}
                  fullWidth
                  sx={{ 
                    bgcolor: '#5d87ff',
                    '&:hover': { bgcolor: '#4570ea' },
                    boxShadow: 'none',
                  }}
                >
                  Search
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleResetFilters}
                  sx={{ 
                    color: '#2a3547',
                    borderColor: '#edf2f6',
                    '&:hover': {
                      borderColor: '#5d87ff',
                      bgcolor: 'rgba(93, 135, 255, 0.08)',
                    }
                  }}
                >
                  Reset
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Card>
        
        <Card 
          sx={{ 
            height: 'calc(100vh - 280px)', // Adjusted for filter section
            minHeight: 500,
            borderRadius: '12px',
            border: '1px solid #edf2f6',
            boxShadow: 'none',
            overflow: 'hidden',
            '& .ag-theme-alpine': {
              border: 'none',
            }
          }}
        >
          <ReportGrid
            columnDefs={columnDefs}
            rowData={filteredData}
            gridOptions={gridOptions}
            height="100%"
            pinnedBottomRowData={pinnedBottomRowData}
          />
        </Card>
      </Box>
    </PageContainer>
  );
};

export default AvgSalesPrice; 