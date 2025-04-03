import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { DataGrid } from '@mui/x-data-grid';
import * as XLSX from 'xlsx';
import axiosInstance from '../../utils/axios';
import PageContainer from '../../components/container/PageContainer';

const InwardConsumptionSlurry = () => {
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const [quarries, setQuarries] = useState([]);
  const [formData, setFormData] = useState({
    month: '',
    year: new Date().getFullYear(),
    values: {
      inward: {},
      scalp: {},
      consumption: {},
      materialSwap: {}
    }
  });

  const columns = [
    { field: 'id', headerName: '#', width: 70 },
    { field: 'particulars', headerName: 'Particulars', flex: 1 },
    { field: 'quarryName', headerName: 'Quarry', flex: 1 },
    { field: 'tonnage', headerName: 'Tonnage (MT)', flex: 1, type: 'number' }
  ];

  const fetchQuarries = async () => {
    try {
      const response = await axiosInstance.get('/master/plants/quarries');
      // Map the response to get only required fields
      const quarryData = response.data.map(quarry => ({
        id: quarry.plantId,
        name: quarry.plantName,
        shortName: quarry.shortName
      }));
      setQuarries(quarryData);
    } catch (error) {
      showNotification('Failed to fetch quarries', 'error');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/input/inward-consumption-slurry');
      const transformedData = response.data.map((item, index) => ({
        id: item.id || index + 1,
        particulars: item.particulars,
        quarryName: item.quarryName,
        tonnage: Number(item.tonnage)
      }));
      setData(transformedData);
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (openDialog) {
      fetchQuarries();
    }
  }, [openDialog]);

  const calculateRowTotal = (values) => {
    return Object.values(values).reduce((sum, value) => sum + (Number(value) || 0), 0);
  };

  const handleValueChange = (rowId, quarryId, value) => {
    setFormData(prev => ({
      ...prev,
      values: {
        ...prev.values,
        [rowId]: {
          ...prev.values[rowId],
          [quarryId]: value
        }
      }
    }));
  };

  const handleSubmit = async () => {
    if (!formData.month || !formData.year) {
      showNotification('Please select month and year', 'error');
      return;
    }

    const materialSwapTotal = calculateRowTotal(formData.values.materialSwap);
    if (materialSwapTotal !== 0) {
      showNotification('Material Swap total must be zero', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // Transform data to match backend structure
      const transformedData = [];
      
      // Process each row type (inward, scalp, consumption, materialSwap)
      quarries.forEach(quarry => {
        transformedData.push({
          materialName: 'Inward',
          quarryName: quarry.shortName || quarry.name,
          tonnage: Number(formData.values.inward[quarry.id] || 0),
          month: formData.month,
          year: formData.year
        });
        transformedData.push({
          materialName: 'Scalp',
          quarryName: quarry.shortName || quarry.name,
          tonnage: Number(formData.values.scalp[quarry.id] || 0),
          month: formData.month,
          year: formData.year
        });
        transformedData.push({
          materialName: 'Consumption',
          quarryName: quarry.shortName || quarry.name,
          tonnage: Number(formData.values.consumption[quarry.id] || 0),
          month: formData.month,
          year: formData.year
        });
        transformedData.push({
          materialName: 'Material Swap',
          quarryName: quarry.shortName || quarry.name,
          tonnage: Number(formData.values.materialSwap[quarry.id] || 0),
          month: formData.month,
          year: formData.year
        });
      });

      await axiosInstance.post('/input/import-inward-consumption-slurry', transformedData);
      showNotification('Data saved successfully', 'success');
      handleCloseDialog();
      fetchData();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to save data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      month: '',
      year: new Date().getFullYear(),
      values: {
        inward: {},
        scalp: {},
        consumption: {},
        materialSwap: {}
      }
    });
  };

  const showNotification = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleExport = () => {
    try {
      // Create worksheet data
      const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
        'Particulars': item.particulars,
        'Quarry': item.quarryName,
        'Tonnage (MT)': item.tonnage
      })));

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Inward Consumption Slurry');

      // Generate file name with current date
      const date = new Date();
      const fileName = `Inward_Consumption_Slurry_${date.getFullYear()}_${(date.getMonth() + 1).toString().padStart(2, '0')}_${date.getDate().toString().padStart(2, '0')}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, fileName);
      showNotification('Data exported successfully', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showNotification('Failed to export data', 'error');
    }
  };

  return (
    <PageContainer title="Inward & Consumption Slurry" description="Manage inward & consumption slurry">
      <Card>
        <CardContent>
          <Box>
            <Typography variant="h3" sx={{ color: '#2B3674', mb: 3 }}>
              Inward & Consumption Slurry
            </Typography>

            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="From Date"
                  value={fromDate}
                  onChange={(newValue) => setFromDate(newValue)}
                  slotProps={{ textField: { size: 'small' } }}
                />
                <DatePicker
                  label="To Date"
                  value={toDate}
                  onChange={(newValue) => setToDate(newValue)}
                  slotProps={{ textField: { size: 'small' } }}
                />
              </LocalizationProvider>

              <Button
                variant="contained"
                color="primary"
                startIcon={<FileDownloadIcon />}
                onClick={handleExport}
                disabled={data.length === 0}
              >
                EXPORT
              </Button>

              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
              >
                ADD NEW
              </Button>
            </Stack>

            <Box>
              <DataGrid
                rows={data}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                checkboxSelection
                disableSelectionOnClick
                autoHeight
                loading={loading}
                sx={{
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: '#F8FAFF',
                    borderBottom: '2px solid #E5E5E5'
                  },
                  border: '1px solid #E5E5E5',
                  borderRadius: '12px',
                  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
                }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            maxWidth: '800px'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            borderBottom: '1px solid #e5e5e5',
            p: 2,
            color: '#2B3674',
            fontSize: '1.1rem',
            fontWeight: 600
          }}
        >
          Inward & Consumption Entry
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <Grid container spacing={3} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <FormControl 
                fullWidth 
                size="small"
              >
                <Select
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  displayEmpty
                  renderValue={(value) => {
                    if (!value) return "Month";
                    return new Date(0, value - 1).toLocaleString('default', { month: 'long' });
                  }}
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = i + 1;
                    return (
                      <MenuItem key={month} value={month}>
                        {new Date(0, month - 1).toLocaleString('default', { month: 'long' })}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl 
                fullWidth 
                size="small"
              >
                <Select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  displayEmpty
                  renderValue={(value) => value || "Year"}
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <TableContainer 
            component={Paper} 
            sx={{ 
              boxShadow: 'none',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              overflow: 'hidden'
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#2B3674' }}>
                  <TableCell 
                    colSpan={quarries.length + 2} 
                    align="center" 
                    sx={{ 
                      color: 'white',
                      py: 1.5,
                      fontSize: '0.9rem',
                      fontWeight: 500
                    }}
                  >
                    Inward & Consumption [MT]
                  </TableCell>
                </TableRow>
                <TableRow sx={{ backgroundColor: '#F8FAFF' }}>
                  <TableCell sx={{ 
                    fontWeight: 600, 
                    color: '#2B3674',
                    py: 1,
                    fontSize: '0.875rem'
                  }}>
                    Particulars
                  </TableCell>
                  {quarries.map(quarry => (
                    <TableCell 
                      key={quarry.id} 
                      align="center"
                      sx={{ 
                        fontWeight: 600, 
                        color: '#2B3674',
                        py: 1,
                        fontSize: '0.875rem'
                      }}
                    >
                      {quarry.shortName || quarry.name}
                    </TableCell>
                  ))}
                  <TableCell 
                    align="center"
                    sx={{ 
                      fontWeight: 600, 
                      color: '#2B3674',
                      py: 1,
                      fontSize: '0.875rem'
                    }}
                  >
                    Total
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {['inward', 'scalp', 'consumption', 'materialSwap'].map(row => (
                  <TableRow key={row}>
                    <TableCell sx={{ 
                      color: '#2B3674',
                      py: 0.75,
                      fontSize: '0.875rem'
                    }}>
                      {row.charAt(0).toUpperCase() + row.slice(1)}
                    </TableCell>
                    {quarries.map(quarry => (
                      <TableCell key={quarry.id} align="center" sx={{ py: 0.75 }}>
                        <TextField
                          size="small"
                          type="number"
                          value={formData.values[row][quarry.id] || ''}
                          onChange={(e) => handleValueChange(row, quarry.id, e.target.value)}
                          sx={{ 
                            width: '85px',
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: '#FFF9C4',
                              height: '32px',
                              '& fieldset': {
                                borderColor: '#E5E5E5'
                              },
                              '&:hover fieldset': {
                                borderColor: '#5D87FF'
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#5D87FF'
                              }
                            },
                            '& .MuiOutlinedInput-input': { 
                              textAlign: 'center',
                              py: 0,
                              fontSize: '0.875rem',
                              '&::-webkit-inner-spin-button': {
                                display: 'none'
                              }
                            }
                          }}
                          inputProps={{ 
                            min: 0,
                            style: { 
                              color: '#2B3674',
                              padding: '4px 8px'
                            }
                          }}
                        />
                      </TableCell>
                    ))}
                    <TableCell 
                      align="center"
                      sx={{ 
                        color: '#2B3674',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        py: 0.75
                      }}
                    >
                      {calculateRowTotal(formData.values[row])}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions 
          sx={{ 
            p: 2,
            borderTop: '1px solid #E5E5E5',
            gap: 1
          }}
        >
          <Button 
            onClick={handleCloseDialog}
            variant="outlined"
            size="small"
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              color: '#5D87FF',
              borderColor: '#5D87FF',
              px: 2,
              '&:hover': {
                borderColor: '#4570EA',
                backgroundColor: 'rgba(93, 135, 255, 0.1)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            size="small"
            sx={{
              backgroundColor: '#5D87FF',
              borderRadius: '8px',
              textTransform: 'none',
              px: 2,
              '&:hover': {
                backgroundColor: '#4570EA'
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default InwardConsumptionSlurry; 