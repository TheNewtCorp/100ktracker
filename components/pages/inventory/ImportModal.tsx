import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Watch, WatchSet } from '../../../types';
import ColumnMappingModal from './ColumnMappingModal';

interface ImportModalProps {
  onClose: () => void;
  onImport: (watches: Omit<Watch, 'id'>[]) => Promise<void>;
}

interface ParsedData {
  headers: string[];
  rows: string[][];
  fileName: string;
  fileType: 'csv' | 'excel';
}

const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImport }) => {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [showColumnMapping, setShowColumnMapping] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Constants for file limits
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_ROWS = 1000;

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!file) return;

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setError(`File size too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
        return;
      }

      setError(null);
      setIsProcessing(true);
      setProcessingProgress(0);

      const fileName = file.name;
      const fileExtension = fileName.split('.').pop()?.toLowerCase();

      if (fileExtension === 'csv') {
        // Parse CSV
        Papa.parse(file, {
          header: false,
          skipEmptyLines: true,
          complete: (results) => {
            setProcessingProgress(75);

            if (results.errors.length > 0) {
              setError('Error parsing CSV file: ' + results.errors[0].message);
              setIsProcessing(false);
              setProcessingProgress(0);
              return;
            }

            const data = results.data as string[][];
            if (data.length < 2) {
              setError('CSV file must contain at least a header row and one data row');
              setIsProcessing(false);
              setProcessingProgress(0);
              return;
            }

            const filteredRows = data.slice(1).filter((row) => row.some((cell) => cell && cell.trim() !== ''));

            if (filteredRows.length > MAX_ROWS) {
              setError(`Too many rows. Maximum allowed is ${MAX_ROWS} rows, found ${filteredRows.length}`);
              setIsProcessing(false);
              setProcessingProgress(0);
              return;
            }

            setProcessingProgress(100);
            setTimeout(() => {
              setParsedData({
                headers: data[0],
                rows: filteredRows,
                fileName,
                fileType: 'csv',
              });
              setShowColumnMapping(true);
              setIsProcessing(false);
              setProcessingProgress(0);
            }, 200);
          },
          error: (error) => {
            setError('Error reading CSV file: ' + error.message);
            setIsProcessing(false);
            setProcessingProgress(0);
          },
        });
      } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
        // Parse Excel
        const reader = new FileReader();

        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            setProcessingProgress((e.loaded / e.total) * 50);
          }
        };

        reader.onload = (e) => {
          setProcessingProgress(75);

          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });

            // Use first sheet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Convert to array of arrays
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

            if (jsonData.length < 2) {
              setError('Excel file must contain at least a header row and one data row');
              setIsProcessing(false);
              setProcessingProgress(0);
              return;
            }

            const filteredRows = jsonData
              .slice(1)
              .filter((row) => row.some((cell) => cell && String(cell).trim() !== ''));

            if (filteredRows.length > MAX_ROWS) {
              setError(`Too many rows. Maximum allowed is ${MAX_ROWS} rows, found ${filteredRows.length}`);
              setIsProcessing(false);
              setProcessingProgress(0);
              return;
            }

            setProcessingProgress(100);
            setTimeout(() => {
              setParsedData({
                headers: jsonData[0].map((h) => String(h)),
                rows: filteredRows.map((row) => row.map((cell) => String(cell))),
                fileName,
                fileType: 'excel',
              });
              setShowColumnMapping(true);
              setIsProcessing(false);
              setProcessingProgress(0);
            }, 200);
          } catch (error) {
            setError('Error parsing Excel file: ' + (error as Error).message);
            setIsProcessing(false);
            setProcessingProgress(0);
          }
        };

        reader.onerror = () => {
          setError('Error reading Excel file');
          setIsProcessing(false);
          setProcessingProgress(0);
        };

        reader.readAsArrayBuffer(file);
      } else {
        setError('Please select a CSV or Excel file (.csv, .xlsx, .xls)');
        setIsProcessing(false);
        setProcessingProgress(0);
      }
    },
    [MAX_FILE_SIZE, MAX_ROWS],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect],
  );

  const downloadTemplate = useCallback(() => {
    const headers = [
      'Brand',
      'Model',
      'Reference Number',
      'Serial Number',
      'In Date',
      'Watch Set',
      'Platform Purchased',
      'Purchase Price',
      'Liquidation Price',
      'Accessories',
      'Accessories Cost',
      'Date Sold',
      'Platform Sold',
      'Price Sold',
      'Fees',
      'Shipping',
      'Taxes',
      'Notes',
    ];

    const sampleData = [
      'Rolex',
      'Submariner',
      '116610LN',
      'M123456',
      '2024-01-15',
      'Full Set',
      'Chrono24',
      '8500',
      '8000',
      'Box, Papers, Tags',
      '0',
      '2024-02-01',
      'eBay',
      '9200',
      '450',
      '50',
      '0',
      'Excellent condition',
    ];

    const csvContent = [headers, sampleData].map((row) => row.map((field) => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'watch_import_template.csv');
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleImportComplete = useCallback(
    async (watches: Omit<Watch, 'id'>[]) => {
      await onImport(watches);
      setShowColumnMapping(false);
      setParsedData(null);
      onClose();
    },
    [onImport, onClose],
  );

  if (showColumnMapping && parsedData) {
    return (
      <ColumnMappingModal
        onClose={() => {
          setShowColumnMapping(false);
          setParsedData(null);
        }}
        onImport={handleImportComplete}
        parsedData={parsedData}
      />
    );
  }

  return (
    <motion.div
      className='fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className='bg-charcoal-slate rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden'
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-champagne-gold/10'>
          <h2 className='text-xl font-bold text-platinum-silver'>Import Watches</h2>
          <button onClick={onClose} className='p-1 rounded-full hover:bg-obsidian-black/50 transition-colors'>
            <X size={24} className='text-platinum-silver/60' />
          </button>
        </div>

        {/* Content */}
        <div className='p-6 overflow-y-auto max-h-[calc(90vh-120px)]'>
          {/* Template Download */}
          <div className='mb-6'>
            <h3 className='text-lg font-semibold text-platinum-silver mb-2'>Download Template</h3>
            <p className='text-platinum-silver/80 mb-3'>
              Download a CSV template with the correct column headers and sample data.
            </p>
            <button
              onClick={downloadTemplate}
              className='flex items-center gap-2 px-4 py-2 bg-charcoal-slate border border-champagne-gold/50 text-champagne-gold rounded-lg hover:bg-champagne-gold/10 transition-colors'
            >
              <Download size={16} />
              Download Template
            </button>
          </div>

          {/* File Upload */}
          <div className='mb-6'>
            <h3 className='text-lg font-semibold text-platinum-silver mb-2'>Upload File</h3>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver
                  ? 'border-champagne-gold bg-champagne-gold/5'
                  : 'border-champagne-gold/30 hover:border-champagne-gold/50'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
            >
              <FileSpreadsheet className='mx-auto mb-4 text-champagne-gold' size={48} />
              <p className='text-platinum-silver mb-2'>Drag and drop your CSV or Excel file here, or click to browse</p>
              <p className='text-platinum-silver/60 text-sm mb-4'>
                Supported formats: .csv, .xlsx, .xls (Max size: 10MB, Max rows: 1,000)
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className='px-6 py-2 bg-champagne-gold text-obsidian-black font-semibold rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50'
              >
                {isProcessing ? 'Processing...' : 'Choose File'}
              </button>

              {/* Progress Bar */}
              {isProcessing && (
                <div className='w-full mt-4'>
                  <div className='flex justify-between text-sm text-platinum-silver/60 mb-1'>
                    <span>Processing file...</span>
                    <span>{Math.round(processingProgress)}%</span>
                  </div>
                  <div className='w-full bg-obsidian-black/50 rounded-full h-2'>
                    <div
                      className='bg-champagne-gold h-2 rounded-full transition-all duration-300'
                      style={{ width: `${processingProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type='file'
                accept='.csv,.xlsx,.xls'
                onChange={handleFileInputChange}
                className='hidden'
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className='mb-6 p-4 bg-crimson-red/10 border border-crimson-red/20 rounded-lg'>
              <div className='flex items-center gap-2'>
                <XCircle className='text-crimson-red' size={16} />
                <span className='text-crimson-red font-medium'>Error</span>
              </div>
              <p className='text-crimson-red/80 mt-1'>{error}</p>
            </div>
          )}

          {/* Instructions */}
          <div className='bg-obsidian-black/30 rounded-lg p-4'>
            <h4 className='text-platinum-silver font-semibold mb-2'>Import Instructions</h4>
            <ul className='text-platinum-silver/80 text-sm space-y-1'>
              <li>• First row should contain column headers</li>
              <li>• Required fields: Brand, Model, Reference Number</li>
              <li>• Dates should be in YYYY-MM-DD or MM/DD/YYYY format</li>
              <li>• Prices should be numeric (currency symbols will be removed automatically)</li>
              <li>• Watch Set values: Watch Only, Watch & Box, Watch & Papers, Full Set</li>
              <li>• Empty rows will be skipped automatically</li>
              <li>• Duplicate reference numbers will be flagged for review</li>
              <li>• Maximum file size: 10MB, Maximum rows: 1,000</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ImportModal;
