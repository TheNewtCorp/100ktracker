import React, { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { Invoice, InvoicePDFOptions } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoicePDFGeneratorProps {
  invoice: Invoice;
  onPDFGenerated?: (pdfBlob: Blob) => void;
  className?: string;
}

const InvoicePDFGenerator: React.FC<InvoicePDFGeneratorProps> = ({ invoice, onPDFGenerated, className = '' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isGenerating, setIsGenerating] = useState(false);
  const [options, setOptions] = useState<InvoicePDFOptions>({
    includeHeader: true,
    includeLogo: false,
    template: 'standard',
    primaryColor: '#1f2937',
  });

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const margin = 20;
      let yPosition = margin;

      // Header
      if (options.includeHeader) {
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.text('INVOICE', margin, yPosition);

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Invoice #: ${invoice.invoice_number}`, pageWidth - 80, yPosition);

        yPosition += 15;
        pdf.text(`Date: ${formatDate(invoice.created_at)}`, pageWidth - 80, yPosition);

        if (invoice.due_date) {
          yPosition += 10;
          pdf.text(`Due Date: ${formatDate(invoice.due_date)}`, pageWidth - 80, yPosition);
        }

        yPosition += 30;
      }

      // Business Info (Placeholder - in real implementation, this would come from user settings)
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('From:', margin, yPosition);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      yPosition += 15;
      pdf.text('Your Business Name', margin, yPosition);
      yPosition += 10;
      pdf.text('123 Business Street', margin, yPosition);
      yPosition += 10;
      pdf.text('City, State 12345', margin, yPosition);
      yPosition += 10;
      pdf.text('phone@business.com', margin, yPosition);

      // Customer Info
      yPosition += 25;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Bill To:', margin, yPosition);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      yPosition += 15;

      if (invoice.contact_name) {
        pdf.text(invoice.contact_name, margin, yPosition);
        yPosition += 10;
      }

      if (invoice.contact_email) {
        pdf.text(invoice.contact_email, margin, yPosition);
        yPosition += 10;
      }

      if (invoice.customer_info) {
        if (invoice.customer_info.name && !invoice.contact_name) {
          pdf.text(invoice.customer_info.name, margin, yPosition);
          yPosition += 10;
        }
        if (invoice.customer_info.email && !invoice.contact_email) {
          pdf.text(invoice.customer_info.email, margin, yPosition);
          yPosition += 10;
        }
        if (invoice.customer_info.address) {
          pdf.text(invoice.customer_info.address, margin, yPosition);
          yPosition += 10;
        }
      }

      // Line Items Table
      yPosition += 20;

      const tableData =
        invoice.items?.map((item) => [
          item.description,
          item.quantity.toString(),
          formatCurrency(item.unit_price),
          formatCurrency(item.total_amount),
        ]) || [];

      // Using jsPDF autoTable for better table formatting
      autoTable(pdf, {
        startY: yPosition,
        head: [['Description', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: 10,
        },
        headStyles: {
          fillColor: [31, 41, 55], // Gray-800
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        margin: { left: margin, right: margin },
      });

      // Total
      const finalY = (pdf as any).lastAutoTable?.finalY + 20 || yPosition + 50;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');

      const totalText = `Total: ${formatCurrency(invoice.total_amount, invoice.currency)}`;
      const totalWidth = pdf.getTextWidth(totalText);
      pdf.text(totalText, pageWidth - margin - totalWidth, finalY);

      // Notes
      if (invoice.notes) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Notes:', margin, finalY + 20);

        // Split notes into lines that fit the page width
        const noteLines = pdf.splitTextToSize(invoice.notes, pageWidth - margin * 2);
        pdf.text(noteLines, margin, finalY + 35);
      }

      // Generate the PDF blob
      const pdfBlob = pdf.output('blob');

      // Download the PDF
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (onPDFGenerated) {
        onPDFGenerated(pdfBlob);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`${className}`}>
      <button
        onClick={generatePDF}
        disabled={isGenerating}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
          isDark
            ? 'bg-champagne-gold text-obsidian-black hover:bg-champagne-gold/90 disabled:bg-champagne-gold/50'
            : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'
        } disabled:cursor-not-allowed`}
      >
        {isGenerating ? <Loader2 size={18} className='animate-spin' /> : <Download size={18} />}
        {isGenerating ? 'Generating PDF...' : 'Download PDF'}
      </button>

      {/* PDF Options (can be expanded into a modal) */}
      <div
        className={`mt-4 p-3 rounded-lg border ${
          isDark ? 'bg-charcoal-slate border-champagne-gold/20' : 'bg-gray-50 border-gray-200'
        }`}
      >
        <div className='flex items-center gap-2 mb-2'>
          <FileText size={16} className={isDark ? 'text-champagne-gold' : 'text-blue-600'} />
          <span className={`text-sm font-medium ${isDark ? 'text-platinum-silver' : 'text-gray-700'}`}>
            PDF Options
          </span>
        </div>

        <div className='space-y-2'>
          <label className='flex items-center gap-2'>
            <input
              type='checkbox'
              checked={options.includeHeader}
              onChange={(e) => setOptions((prev) => ({ ...prev, includeHeader: e.target.checked }))}
              className='rounded'
            />
            <span className={`text-xs ${isDark ? 'text-platinum-silver/70' : 'text-gray-600'}`}>
              Include header with logo
            </span>
          </label>

          <div className='flex items-center gap-2'>
            <span className={`text-xs ${isDark ? 'text-platinum-silver/70' : 'text-gray-600'}`}>Template:</span>
            <select
              value={options.template}
              onChange={(e) => setOptions((prev) => ({ ...prev, template: e.target.value as any }))}
              className={`text-xs px-2 py-1 rounded border ${
                isDark
                  ? 'bg-obsidian-black border-champagne-gold/30 text-platinum-silver'
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
            >
              <option value='standard'>Standard</option>
              <option value='minimal'>Minimal</option>
              <option value='detailed'>Detailed</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePDFGenerator;
