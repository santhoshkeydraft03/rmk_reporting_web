import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Paper
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import PageContainer from '../../components/container/PageContainer';
import axios from '../../utils/axios';

const BucketWiseReport = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedBucket, setSelectedBucket] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [buckets, setBuckets] = useState([]);
  const [rowData, setRowData] = useState([]);

  // Fetch buckets on component mount
  useEffect(() => {
    const fetchBuckets = async () => {
      try {
        const response = await axios.get('/master/buckets');
        console.log('Buckets API response:', response.data);
        setBuckets(response.data || []);
      } catch (error) {
        console.error('Error fetching buckets:', error);
        alert('Failed to fetch buckets. Please try again.');
        setBuckets([]);
      }
    };

    fetchBuckets();
  }, []);

  // Process report data into rows for AG Grid
  useEffect(() => {
    if (!reportData || !reportData.expenseTypes) {
      setRowData([]);
      return;
    }

    try {
      const gridRows = [];
      let rowId = 1;

      // Process expense types and their groups
      reportData.expenseTypes.forEach((expenseType) => {
        // Add expense type header row
        gridRows.push({
          id: rowId++,
          isHeader: true,
          particular: expenseType.expenseTypeName || '',
          total: '',
          perMT: ''
        });

        // Add expense groups
        if (expenseType.expenseGroups && Array.isArray(expenseType.expenseGroups)) {
          expenseType.expenseGroups.forEach((group) => {
            gridRows.push({
              id: rowId++,
              isHeader: false,
              particular: group.expenseGroupName || '',
              total: group.total || 0,
              perMT: group.perMT || '-'
            });
          });
        }
      });

      // Add total row
      gridRows.push({
        id: rowId++,
        isTotal: true,
        particular: 'Total',
        total: reportData.grandTotal || 0,
        perMT: ''
      });

      setRowData(gridRows);
    } catch (error) {
      console.error('Error processing report data:', error);
      setRowData([]);
    }
  }, [reportData]);

  const handleGenerateReport = async () => {
    if (!selectedBucket || !selectedDate) {
      alert('Please select both bucket and month');
      return;
    }
    
    setLoading(true);
    
    try {
      const month = selectedDate ? String(selectedDate.getMonth() + 1).padStart(2, '0') : '';
      const year = selectedDate ? String(selectedDate.getFullYear()) : '';
      
      const response = await axios.get('/reports/bucket-wise-report', {
        params: {
          bucketId: selectedBucket,
          month: month,
          year: year
        }
      });
      
      console.log('Bucket-wise report API response:', response.data);
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching report data:', error);
      console.log('Error details:', error.response || error.message);
      alert('Failed to fetch report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format number with commas for Indian locale
  const formatNumber = (value) => {
    if (value === null || value === undefined) return '-';
    return value.toLocaleString('en-IN');
  };

  const columnDefs = [
    { 
      field: 'particular',
      headerName: 'Particulars',
      flex: 3,
      cellStyle: params => {
        const style = {
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px',
          height: '28px',
          lineHeight: '28px'
        };
        
        if (params.data.isHeader) {
          return {
            ...style,
            fontWeight: 'bold',
            backgroundColor: '#FFFFFF'
          };
        } else if (params.data.isTotal) {
          return {
            ...style,
            fontWeight: 'bold'
          };
        }
        return {
          ...style,
          backgroundColor: '#FFCCFF'
        };
      }
    },
    {
      field: 'total',
      headerName: 'Total',
      flex: 1,
      cellStyle: params => {
        const style = {
          textAlign: 'right',
          padding: '0 8px',
          height: '28px',
          lineHeight: '28px'
        };
        
        if (params.data.isHeader) {
          return {
            ...style,
            fontWeight: 'bold',
            backgroundColor: '#FFFFFF'
          };
        } else if (params.data.isTotal) {
          return {
            ...style,
            fontWeight: 'bold',
            color: '#0000FF'
          };
        }
        return {
          ...style,
          backgroundColor: '#FFCCFF'
        };
      },
      valueFormatter: params => {
        if (params.value !== null && params.value !== undefined && params.value !== '') {
          return formatNumber(params.value);
        }
        return '';
      }
    },
    {
      field: 'perMT',
      headerName: 'Per MT',
      flex: 1,
      cellStyle: params => {
        const style = {
          textAlign: 'center',
          padding: '0 8px',
          height: '28px',
          lineHeight: '28px'
        };
        
        if (params.data.isHeader) {
          return {
            ...style,
            fontWeight: 'bold',
            backgroundColor: '#FFFFFF'
          };
        } else if (params.data.isTotal) {
          return {
            ...style,
            fontWeight: 'bold'
          };
        }
        return {
          ...style,
          backgroundColor: '#FFCCFF'
        };
      }
    }
  ];

  const defaultColDef = {
    sortable: false,
    resizable: true,
    suppressMovable: true
  };

  const gridOptions = {
    headerHeight: 0,
    rowHeight: 40,
    suppressHorizontalScroll: true,
    domLayout: 'autoHeight'
  };

  // Custom header component
  const CustomHeader = () => {
    if (!reportData) return null;
    
    return (
      <>
        <Box sx={{ 
          display: 'flex', 
          borderBottom: '1px solid #e2e2e2',
          height: '28px'
        }}>
          <Box sx={{ 
            width: '60%', 
            p: 0.5,
            pl: 1,
            fontWeight: 'bold',
            borderRight: '1px solid #e2e2e2',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center'
          }}>
            Particulars
          </Box>
          <Box sx={{ 
            width: '40%',
            p: 0.5,
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {reportData.date || 'N/A'}
          </Box>
        </Box>
        <Box sx={{ 
          display: 'flex',
          borderBottom: '1px solid #e2e2e2',
          height: '28px'
        }}>
          <Box sx={{ 
            width: '60%',
            borderRight: '1px solid #e2e2e2'
          }}></Box>
          <Box sx={{ 
            width: '20%',
            p: 0.5,
            fontWeight: 'bold',
            textAlign: 'center',
            borderRight: '1px solid #e2e2e2',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            Total
          </Box>
          <Box sx={{ 
            width: '20%',
            p: 0.5,
            fontWeight: 'bold',
            textAlign: 'center',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            Per MT
          </Box>
        </Box>
      </>
    );
  };

  return (
    <PageContainer title="Bucket Wise Report" description="Bucket Wise Report">
      <Card>
        <CardContent>
          <Box sx={{ width: '100%' }}>
            <Typography variant="h3" sx={{ color: '#2B3674', mb: 3 }}>
              Bucket Wise Report
            </Typography>

            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <FormControl sx={{ minWidth: 200 }} size="small">
                <InputLabel>Select Bucket</InputLabel>
                <Select
                  value={selectedBucket}
                  label="Select Bucket"
                  onChange={(e) => setSelectedBucket(e.target.value)}
                >
                  {buckets.map((bucket) => (
                    <MenuItem key={bucket.bucketId} value={bucket.bucketId}>
                      {bucket.bucketName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Select Month"
                  views={['year', 'month']}
                  value={selectedDate}
                  onChange={(newValue) => setSelectedDate(newValue)}
                  slotProps={{ textField: { size: 'small' } }}
                />
              </LocalizationProvider>

              <Button
                variant="contained"
                color="primary"
                onClick={handleGenerateReport}
                disabled={loading}
              >
                Generate Report
              </Button>
            </Stack>

            {loading && <Typography>Loading report data...</Typography>}

            {reportData && (
              <Paper sx={{ mt: 3, border: '1px solid #e2e2e2' }}>
                {/* Report Title */}
                <Box sx={{ 
                  p: 1, 
                  textAlign: 'center',
                  borderBottom: '1px solid #e2e2e2',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Typography sx={{ 
                    fontWeight: 'bold', 
                    fontSize: '14px'
                  }}>
                    {reportData.bucketName || 'No Data'}
                  </Typography>
                </Box>

                {/* Custom Header */}
                <CustomHeader />

                {/* AG Grid */}
                <div 
                  className="ag-theme-alpine" 
                  style={{ 
                    width: '100%',
                    border: 'none'
                  }}
                  sx={{
                    '& .ag-theme-alpine': {
                      border: 'none',
                      '& .ag-header': {
                        height: '28px',
                        minHeight: '28px',
                        borderBottom: '1px solid #e2e2e2',
                      },
                      '& .ag-header-cell': {
                        padding: '0 4px',
                        lineHeight: '28px',
                        backgroundColor: '#f8f9fa'
                      },
                      '& .ag-cell': {
                        lineHeight: '28px',
                        borderRight: '1px solid #e2e2e2',
                        padding: '0 8px'
                      },
                      '& .ag-row': {
                        borderBottom: '1px solid #e2e2e2',
                        height: '28px',
                        '&:hover': {
                          backgroundColor: '#f5f5f5'
                        }
                      }
                    }
                  }}
                >
                  <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    gridOptions={{
                      ...gridOptions,
                      rowHeight: 28,
                      headerHeight: 28,
                      suppressHorizontalScroll: true,
                      domLayout: 'autoHeight'
                    }}
                    suppressMenuHide={true}
                    suppressRowClickSelection={true}
                  />
                </div>
              </Paper>
            )}
          </Box>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default BucketWiseReport;
