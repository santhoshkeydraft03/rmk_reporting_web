import { useCallback, useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { Box } from '@mui/material';
import 'ag-grid-enterprise';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Custom CSS for modern enterprise design
const gridStyles = `
  .ag-theme-alpine {
    --ag-grid-size: 3px;
    --ag-list-item-height: 24px;
    --ag-font-size: 12px;
    --ag-cell-horizontal-padding: 8px;
    --ag-row-height: 32px;
    --ag-header-height: 36px;
    --ag-header-foreground-color: #5d87ff;
    --ag-header-background-color: #ffffff;
    --ag-odd-row-background-color: #ffffff;
    --ag-row-hover-color: #f8f9fa;
    --ag-selected-row-background-color: rgba(93, 135, 255, 0.1);
    --ag-font-family: 'Plus Jakarta Sans', sans-serif;
    --ag-borders: none;
    --ag-border-color: #edf2f6;
    --ag-cell-horizontal-border: solid var(--ag-border-color);
    --ag-row-border-color: var(--ag-border-color);
    --ag-header-column-separator-display: block;
    --ag-header-column-separator-height: 100%;
    --ag-header-column-separator-width: 1px;
    --ag-header-column-separator-color: #edf2f6;
  }

  .ag-theme-alpine {
    border: 1px solid #edf2f6;
    border-radius: 8px;
  }

  .ag-theme-alpine .ag-header-cell {
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    color: #2a3547;
  }

  .ag-theme-alpine .ag-cell {
    line-height: 32px;
    font-size: 12px;
    color: #2a3547;
  }

  .ag-theme-alpine .ag-row {
    border-bottom: 1px solid #edf2f6;
  }

  .ag-theme-alpine .ag-row:hover {
    background-color: #f8f9fa;
  }

  .ag-theme-alpine .ag-row-selected {
    background-color: rgba(93, 135, 255, 0.1) !important;
  }

  .ag-theme-alpine .ag-header {
    border-bottom: 1px solid #edf2f6;
    background-color: #ffffff;
  }

  .numeric-cell {
    text-align: right;
    font-family: 'Plus Jakarta Sans', monospace;
    font-size: 12px;
    padding-right: 16px !important;
  }

  .status-cell {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 6px;
    font-weight: 500;
    font-size: 11px;
    line-height: 1;
    text-transform: capitalize;
  }

  .status-completed {
    background-color: #f6ffed;
    color: #52c41a;
  }

  .status-pending {
    background-color: #fff7e6;
    color: #fa8b0c;
  }

  .status-cancelled {
    background-color: #fff1f0;
    color: #f5365c;
  }

  .ag-theme-alpine .ag-cell-focus {
    border: 1px solid #5d87ff !important;
  }

  .ag-theme-alpine .ag-body-viewport {
    background-color: #ffffff;
  }

  .ag-theme-alpine .ag-body-viewport::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  .ag-theme-alpine .ag-body-viewport::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  .ag-theme-alpine .ag-body-viewport::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }

  .ag-theme-alpine .ag-body-viewport::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

const ReportGrid = ({
  columnDefs,
  rowData,
  defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    suppressMenu: false,
    minWidth: 80,
    flex: 1,
  },
  gridOptions = {},
  height = '100%',
  pinnedBottomRowData
}) => {
  const gridRef = useRef(null);
  const containerStyle = { width: '100%', height };

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = gridStyles;
    document.head.appendChild(styleElement);
    return () => document.head.removeChild(styleElement);
  }, []);

  const onFirstDataRendered = useCallback(() => {
    gridRef.current.api.sizeColumnsToFit();
  }, []);

  const defaultGridOptions = {
    suppressMovableColumns: false,
    enableRangeSelection: true,
    enableCellTextSelection: true,
    copyHeadersToClipboard: true,
    pagination: false,
    rowSelection: 'multiple',
    animateRows: true,
    enableCharts: true,
    groupDisplayType: 'multipleColumns',
    defaultExportParams: {
      skipHeader: false,
      skipFooters: true,
      skipGroups: true,
      fileName: 'Report_Export.xlsx'
    },
    domLayout: 'normal',
    suppressHorizontalScroll: true,
    getContextMenuItems: (params) => [
      'autoSizeAll',
      'separator',
      'copy',
      'copyWithHeaders',
      'separator',
      'export',
      'separator',
      {
        name: 'Toggle Filters',
        action: () => {
          gridRef.current.api.setEnableFilter(!gridRef.current.api.isToolPanelShowing('filters'));
        }
      }
    ],
    ...gridOptions
  };

  return (
    <Box className="ag-theme-alpine" sx={{
      ...containerStyle,
      '& .ag-root': {
        border: 'none',
      },
      '& .ag-body': {
        overflowY: 'auto',
      },
      '& .ag-body-viewport': {
        overflowY: 'auto',
        scrollbarWidth: 'thin',
      }
    }}>
      <AgGridReact
        ref={gridRef}
        columnDefs={columnDefs}
        rowData={rowData}
        defaultColDef={defaultColDef}
        onFirstDataRendered={onFirstDataRendered}
        pinnedBottomRowData={pinnedBottomRowData}
        {...defaultGridOptions}
      />
    </Box>
  );
};

export default ReportGrid; 