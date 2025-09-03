import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Download, ArrowRight, AlertCircle, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Watch, WatchSet } from '../../../types';
import apiService from '../../../services/apiService';

interface ColumnMappingModalProps {
  onClose: () => void;
  onImport: (watches: Omit<Watch, 'id'>[]) => Promise<void>;
  parsedData: {
    headers: string[];
    rows: string[][];
    fileName: string;
  };
}

interface ColumnMapping {
  csvColumn: string;
  watchField: keyof Watch | 'ignore';
  confidence: number;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: string;
  severity: 'error' | 'warning';
}

interface ProcessingResult {
  validRows: Omit<Watch, 'id'>[];
  errors: ValidationError[];
  duplicates: string[]; // Reference numbers that already exist
  duplicateMap: Map<string, number>; // Reference number -> existing watch ID
}

const AVAILABLE_FIELDS: { value: keyof Watch | 'ignore'; label: string; required?: boolean }[] = [
  { value: 'ignore', label: 'Ignore Column' },
  { value: 'brand', label: 'Brand *', required: true },
  { value: 'model', label: 'Model *', required: true },
  { value: 'referenceNumber', label: 'Reference Number *', required: true },
  { value: 'inDate', label: 'In Date' },
  { value: 'serialNumber', label: 'Serial Number' },
  { value: 'watchSet', label: 'Watch Set' },
  { value: 'platformPurchased', label: 'Platform Purchased' },
  { value: 'purchasePrice', label: 'Purchase Price' },
  { value: 'liquidationPrice', label: 'Liquidation Price' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'accessoriesCost', label: 'Accessories Cost' },
  { value: 'dateSold', label: 'Date Sold' },
  { value: 'platformSold', label: 'Platform Sold' },
  { value: 'priceSold', label: 'Price Sold' },
  { value: 'fees', label: 'Fees' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'taxes', label: 'Taxes' },
  { value: 'notes', label: 'Notes' },
];

const ColumnMappingModal: React.FC<ColumnMappingModalProps> = ({ onClose, onImport, parsedData }) => {
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>(() => {
    // Auto-map columns based on header names with enhanced pattern matching
    return parsedData.headers.map((header) => {
      const normalizedHeader = header
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '');

      let watchField: keyof Watch | 'ignore' = 'ignore';
      let confidence = 0;

      // Enhanced pattern matching with multiple variations
      const patterns = {
        brand: ['brand', 'make', 'manufacturer'],
        model: ['model', 'modelname', 'name'],
        referenceNumber: ['reference', 'ref', 'referencenumber', 'partnumber', 'modelref'],
        serialNumber: ['serial', 'serialnumber', 'sn', 'serialno'],
        inDate: ['indate', 'datein', 'receiveddate', 'acquireddate', 'purchasedate'],
        watchSet: ['watchset', 'set', 'condition', 'completeness'],
        platformPurchased: ['platformpurchased', 'platform', 'source', 'purchaseplatform'],
        purchasePrice: ['purchaseprice', 'price', 'cost', 'buyprice', 'paid'],
        liquidationPrice: ['liquidationprice', 'liquidation', 'wholesaleprice'],
        accessories: ['accessories', 'extras', 'included', 'parts'],
        accessoriesCost: ['accessoriescost', 'extrascost', 'addoncost'],
        dateSold: ['datesold', 'soldon', 'solddate', 'saledate'],
        platformSold: ['platformsold', 'soldplatform', 'soldvia', 'outlet'],
        priceSold: ['pricesold', 'soldprice', 'saleprice', 'soldfor'],
        fees: ['fees', 'commission', 'charges', 'costs'],
        shipping: ['shipping', 'shippingcost', 'delivery', 'freight'],
        taxes: ['taxes', 'tax', 'vat', 'duty'],
        notes: ['notes', 'comments', 'remarks', 'description'],
      };

      // Find best match
      for (const [field, fieldPatterns] of Object.entries(patterns)) {
        for (const pattern of fieldPatterns) {
          if (normalizedHeader.includes(pattern)) {
            watchField = field as keyof Watch;
            // Higher confidence for exact matches
            confidence = normalizedHeader === pattern ? 0.95 : 0.8;
            break;
          }
        }
        if (confidence > 0) break;
      }

      return { csvColumn: header, watchField, confidence };
    });
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [existingWatches, setExistingWatches] = useState<Watch[]>([]);
  const [loadingExistingData, setLoadingExistingData] = useState(false);

  // Load existing watches for duplicate detection
  const loadExistingWatches = useCallback(async () => {
    setLoadingExistingData(true);
    try {
      const response = await apiService.getWatches();
      const transformedWatches = response.watches.map((watch: any) => ({
        id: watch.id.toString(),
        brand: watch.brand,
        model: watch.model,
        referenceNumber: watch.reference_number,
        inDate: watch.in_date,
        serialNumber: watch.serial_number,
        watchSet: watch.watch_set as WatchSet,
        platformPurchased: watch.platform_purchased,
        purchasePrice: watch.purchase_price,
        liquidationPrice: watch.liquidation_price,
        accessories: watch.accessories,
        accessoriesCost: watch.accessories_cost,
        dateSold: watch.date_sold,
        platformSold: watch.platform_sold,
        priceSold: watch.price_sold,
        fees: watch.fees,
        shipping: watch.shipping,
        taxes: watch.taxes,
        notes: watch.notes,
      }));
      setExistingWatches(transformedWatches);
    } catch (error) {
      console.error('Failed to load existing watches:', error);
    }
    setLoadingExistingData(false);
  }, []);

  // Advanced date parsing with multiple format support
  const parseDate = useCallback((dateStr: string): string | null => {
    if (!dateStr || dateStr.trim() === '') return null;

    const cleanDateStr = dateStr.trim();

    // Try various date formats
    const formats = [
      // ISO format (YYYY-MM-DD)
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
      // US format (MM/DD/YYYY)
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      // European format (DD/MM/YYYY)
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      // Dot notation (MM.DD.YYYY or DD.MM.YYYY)
      /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
    ];

    // First try direct parsing
    const directParse = new Date(cleanDateStr);
    if (!isNaN(directParse.getTime()) && directParse.getFullYear() > 1900) {
      return directParse.toISOString().split('T')[0];
    }

    // Try format-specific parsing
    for (let i = 0; i < formats.length; i++) {
      const match = cleanDateStr.match(formats[i]);
      if (match) {
        let year, month, day;

        if (i === 0) {
          // ISO format
          year = parseInt(match[1]);
          month = parseInt(match[2]);
          day = parseInt(match[3]);
        } else if (i === 1) {
          // US format (MM/DD/YYYY)
          month = parseInt(match[1]);
          day = parseInt(match[2]);
          year = parseInt(match[3]);
        } else {
          // European format (DD/MM/YYYY) or dot notation
          day = parseInt(match[1]);
          month = parseInt(match[2]);
          year = parseInt(match[3]);
        }

        // Validate date components
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900) {
          const date = new Date(year, month - 1, day);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        }
      }
    }

    return null;
  }, []);

  // Enhanced numeric parsing with currency support
  const parseNumeric = useCallback((value: string): number | null => {
    if (!value || value.trim() === '') return null;

    // Remove currency symbols, commas, and extra spaces
    const cleaned = value
      .trim()
      .replace(/[$€£¥₹₽]/g, '') // Currency symbols
      .replace(/,/g, '') // Thousands separators
      .replace(/\s+/g, '') // Extra spaces
      .replace(/[()]/g, ''); // Parentheses

    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }, []);

  // Validate WatchSet enum
  const validateWatchSet = useCallback((value: string): WatchSet | null => {
    if (!value || value.trim() === '') return null;

    const normalized = value.trim();

    // Direct match
    if (Object.values(WatchSet).includes(normalized as WatchSet)) {
      return normalized as WatchSet;
    }

    // Fuzzy matching for common variations
    const mappings: { [key: string]: WatchSet } = {
      complete: WatchSet.FullSet,
      'complete set': WatchSet.FullSet,
      'full set': WatchSet.FullSet,
      'watch only': WatchSet.WatchOnly,
      'head only': WatchSet.WatchOnly,
      'no box papers': WatchSet.WatchOnly,
      'box papers': WatchSet.FullSet,
      'box & papers': WatchSet.FullSet,
      'watch & box': WatchSet.WatchAndBox,
      'watch and box': WatchSet.WatchAndBox,
      'watch & papers': WatchSet.WatchAndPapers,
      'watch and papers': WatchSet.WatchAndPapers,
    };

    const normalizedLower = normalized.toLowerCase();
    return mappings[normalizedLower] || null;
  }, []);

  const updateColumnMapping = useCallback((index: number, field: keyof Watch | 'ignore') => {
    setColumnMappings((prev) => prev.map((mapping, i) => (i === index ? { ...mapping, watchField: field } : mapping)));
  }, []);

  const processWithMapping = useCallback(async () => {
    setIsProcessing(true);

    // Load existing watches for duplicate detection
    await loadExistingWatches();

    const validRows: Omit<Watch, 'id'>[] = [];
    const errors: ValidationError[] = [];
    const duplicates: string[] = [];
    const duplicateMap = new Map<string, number>();

    // Create reference number map for existing watches
    const existingRefMap = new Map<string, number>();
    existingWatches.forEach((watch) => {
      if (watch.referenceNumber) {
        existingRefMap.set(watch.referenceNumber.toLowerCase(), parseInt(watch.id));
      }
    });

    parsedData.rows.forEach((row, rowIndex) => {
      const watch: Partial<Watch> = {};
      const rowErrors: ValidationError[] = [];

      // Apply column mappings with enhanced validation
      row.forEach((cell, colIndex) => {
        const mapping = columnMappings[colIndex];
        if (mapping && mapping.watchField !== 'ignore') {
          const rawValue = cell?.toString().trim() || '';

          if (rawValue === '') {
            // Check if this is a required field
            if (['brand', 'model', 'referenceNumber'].includes(mapping.watchField)) {
              rowErrors.push({
                row: rowIndex + 2, // +2 because we skip header and use 1-based indexing
                field: mapping.watchField,
                message: `Required field '${mapping.watchField}' is empty`,
                value: rawValue,
                severity: 'error',
              });
            }
            return;
          }

          // Process based on field type
          switch (mapping.watchField) {
            case 'purchasePrice':
            case 'liquidationPrice':
            case 'accessoriesCost':
            case 'priceSold':
            case 'fees':
            case 'shipping':
            case 'taxes':
              const numValue = parseNumeric(rawValue);
              if (numValue !== null) {
                (watch as any)[mapping.watchField] = numValue;
              } else if (rawValue !== '') {
                rowErrors.push({
                  row: rowIndex + 2,
                  field: mapping.watchField,
                  message: `Invalid number format: "${rawValue}"`,
                  value: rawValue,
                  severity: 'warning',
                });
              }
              break;

            case 'inDate':
            case 'dateSold':
              const dateValue = parseDate(rawValue);
              if (dateValue) {
                (watch as any)[mapping.watchField] = dateValue;
              } else {
                rowErrors.push({
                  row: rowIndex + 2,
                  field: mapping.watchField,
                  message: `Invalid date format: "${rawValue}". Expected YYYY-MM-DD or MM/DD/YYYY`,
                  value: rawValue,
                  severity: 'warning',
                });
              }
              break;

            case 'watchSet':
              const watchSetValue = validateWatchSet(rawValue);
              if (watchSetValue) {
                (watch as any)[mapping.watchField] = watchSetValue;
              } else {
                rowErrors.push({
                  row: rowIndex + 2,
                  field: mapping.watchField,
                  message: `Invalid watch set: "${rawValue}". Valid values: ${Object.values(WatchSet).join(', ')}`,
                  value: rawValue,
                  severity: 'warning',
                });
              }
              break;

            default:
              // Text fields - sanitize and validate length
              const sanitized = rawValue.replace(/[<>'"]/g, ''); // Basic sanitization
              if (sanitized.length > 255) {
                rowErrors.push({
                  row: rowIndex + 2,
                  field: mapping.watchField,
                  message: `Value too long (max 255 characters): "${sanitized.substring(0, 50)}..."`,
                  value: rawValue,
                  severity: 'warning',
                });
                (watch as any)[mapping.watchField] = sanitized.substring(0, 255);
              } else {
                (watch as any)[mapping.watchField] = sanitized;
              }
              break;
          }
        }
      });

      // Check for required fields
      const requiredFields = ['brand', 'model', 'referenceNumber'] as const;
      const missingRequired = requiredFields.filter((field) => !watch[field]);

      if (missingRequired.length > 0) {
        rowErrors.push({
          row: rowIndex + 2,
          field: 'required',
          message: `Missing required fields: ${missingRequired.join(', ')}`,
          value: '',
          severity: 'error',
        });
      }

      // Check for duplicates
      if (watch.referenceNumber && existingRefMap.has(watch.referenceNumber.toLowerCase())) {
        const existingId = existingRefMap.get(watch.referenceNumber.toLowerCase())!;
        duplicates.push(watch.referenceNumber);
        duplicateMap.set(watch.referenceNumber, existingId);

        rowErrors.push({
          row: rowIndex + 2,
          field: 'referenceNumber',
          message: `Reference number "${watch.referenceNumber}" already exists (ID: ${existingId})`,
          value: watch.referenceNumber,
          severity: 'warning',
        });
      }

      // Add all row errors to the main errors array
      errors.push(...rowErrors);

      // Only add to valid rows if no critical errors
      const hasErrors = rowErrors.some((error) => error.severity === 'error');
      if (!hasErrors && watch.brand && watch.model && watch.referenceNumber) {
        validRows.push(watch as Omit<Watch, 'id'>);
      }
    });

    setProcessingResult({
      validRows,
      errors,
      duplicates,
      duplicateMap,
    });
    setIsProcessing(false);
  }, [columnMappings, parsedData, existingWatches, loadExistingWatches, parseDate, parseNumeric, validateWatchSet]);

  const handleConfirmImport = useCallback(async () => {
    if (processingResult?.validRows) {
      await onImport(processingResult.validRows);
    }
  }, [processingResult, onImport]);

  // Check if required fields are mapped
  const requiredFieldsMapped = ['brand', 'model', 'referenceNumber'].every((field) =>
    columnMappings.some((mapping) => mapping.watchField === field),
  );

  return (
    <motion.div
      className='fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className='bg-charcoal-slate rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden'
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-champagne-gold/10'>
          <h2 className='text-xl font-bold text-platinum-silver'>Map CSV Columns</h2>
          <button onClick={onClose} className='p-1 rounded-full hover:bg-obsidian-black/50 transition-colors'>
            <X size={24} className='text-platinum-silver/60' />
          </button>
        </div>

        {/* Content */}
        <div className='p-6 overflow-y-auto max-h-[calc(90vh-120px)]'>
          <div className='mb-6'>
            <p className='text-platinum-silver/80 mb-4'>
              Map your CSV columns to the corresponding watch fields. Required fields are marked with *.
            </p>
            {!requiredFieldsMapped && (
              <div className='bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4'>
                <div className='flex items-center gap-2'>
                  <AlertCircle className='text-amber-500' size={16} />
                  <span className='text-amber-500 text-sm font-medium'>
                    Please map all required fields: Brand, Model, and Reference Number
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Column Mappings */}
          <div className='space-y-4 mb-6'>
            {columnMappings.map((mapping, index) => (
              <div key={index} className='flex items-center gap-4 p-4 bg-obsidian-black/30 rounded-lg'>
                <div className='flex-1'>
                  <div className='text-platinum-silver font-medium'>{mapping.csvColumn}</div>
                  {parsedData.rows[0] && parsedData.rows[0][index] && (
                    <div className='text-platinum-silver/60 text-sm'>Sample: "{parsedData.rows[0][index]}"</div>
                  )}
                </div>

                <ArrowRight className='text-champagne-gold' size={20} />

                <div className='flex-1'>
                  <select
                    value={mapping.watchField}
                    onChange={(e) => updateColumnMapping(index, e.target.value as keyof Watch | 'ignore')}
                    className='w-full bg-charcoal-slate border border-champagne-gold/20 text-platinum-silver rounded-md px-3 py-2 text-sm focus:ring-champagne-gold focus:border-champagne-gold'
                  >
                    {AVAILABLE_FIELDS.map((field) => (
                      <option key={field.value} value={field.value}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                  {mapping.confidence > 0.7 && (
                    <div className='text-money-green text-xs mt-1'>
                      Auto-mapped ({Math.round(mapping.confidence * 100)}% confidence)
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Preview Section */}
          {processingResult && (
            <div className='mb-6'>
              <h3 className='text-lg font-semibold text-platinum-silver mb-3'>Validation Results</h3>
              <div className='bg-obsidian-black/30 rounded-lg p-4'>
                <div className='flex items-center gap-4 mb-3'>
                  <CheckCircle className='text-money-green' size={20} />
                  <span className='text-platinum-silver'>
                    {processingResult.validRows.length} valid records ready for import
                  </span>
                  {processingResult.errors.length > 0 && (
                    <span className='text-crimson-red'>{processingResult.errors.length} validation issues</span>
                  )}
                  {processingResult.duplicates.length > 0 && (
                    <span className='text-amber-500'>{processingResult.duplicates.length} duplicates</span>
                  )}
                </div>

                {/* Error Summary */}
                {processingResult.errors.length > 0 && (
                  <div className='mb-4'>
                    <h4 className='text-sm font-semibold text-platinum-silver mb-2'>Validation Issues:</h4>
                    <div className='max-h-32 overflow-y-auto space-y-1'>
                      {processingResult.errors.slice(0, 10).map((error, index) => (
                        <div
                          key={index}
                          className={`text-xs p-2 rounded flex items-center gap-2 ${
                            error.severity === 'error'
                              ? 'bg-crimson-red/10 text-crimson-red'
                              : 'bg-amber-500/10 text-amber-500'
                          }`}
                        >
                          {error.severity === 'error' ? <XCircle size={12} /> : <AlertTriangle size={12} />}
                          <span>
                            Row {error.row}: {error.message}
                          </span>
                        </div>
                      ))}
                      {processingResult.errors.length > 10 && (
                        <div className='text-xs text-platinum-silver/60 text-center'>
                          ... and {processingResult.errors.length - 10} more issues
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Valid Records Preview */}
                {processingResult.validRows.length > 0 && (
                  <div className='overflow-x-auto'>
                    <h4 className='text-sm font-semibold text-platinum-silver mb-2'>Preview of Valid Records:</h4>
                    <table className='w-full text-sm'>
                      <thead>
                        <tr className='border-b border-champagne-gold/10'>
                          <th className='text-left p-2 text-champagne-gold'>Brand</th>
                          <th className='text-left p-2 text-champagne-gold'>Model</th>
                          <th className='text-left p-2 text-champagne-gold'>Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processingResult.validRows.slice(0, 3).map((watch, index) => (
                          <tr key={index} className='border-b border-champagne-gold/5'>
                            <td className='p-2 text-platinum-silver'>{watch.brand}</td>
                            <td className='p-2 text-platinum-silver'>{watch.model}</td>
                            <td className='p-2 text-platinum-silver'>{watch.referenceNumber}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {processingResult.validRows.length > 3 && (
                      <p className='text-platinum-silver/60 text-center mt-2'>
                        ... and {processingResult.validRows.length - 3} more records
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className='flex justify-between items-center'>
            <button
              onClick={onClose}
              className='px-4 py-2 text-platinum-silver hover:bg-obsidian-black/50 rounded-lg transition-colors'
            >
              Cancel
            </button>

            <div className='flex items-center gap-3'>
              <button
                onClick={processWithMapping}
                disabled={!requiredFieldsMapped || isProcessing}
                className='px-4 py-2 bg-charcoal-slate border border-champagne-gold/50 text-champagne-gold rounded-lg hover:bg-champagne-gold/10 transition-colors disabled:opacity-50'
              >
                {isProcessing ? 'Processing...' : 'Preview Import'}
              </button>

              {processingResult && processingResult.validRows.length > 0 && (
                <button
                  onClick={handleConfirmImport}
                  disabled={loadingExistingData}
                  className='px-6 py-2 bg-champagne-gold text-obsidian-black font-semibold rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50'
                >
                  Import {processingResult.validRows.length} Watches
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ColumnMappingModal;
