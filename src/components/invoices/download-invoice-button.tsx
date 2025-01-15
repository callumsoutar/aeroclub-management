"use client";

import React from 'react';
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";
import { generateAndDownloadPDF } from "@/lib/pdf";
import InvoiceTemplate, { ExtendedInvoice } from "@/components/pdf-templates/InvoiceTemplate";

interface DownloadInvoiceButtonProps {
  invoice: ExtendedInvoice;
}

export function DownloadInvoiceButton({ invoice }: DownloadInvoiceButtonProps) {
  const handleDownload = async () => {
    try {
      await generateAndDownloadPDF(
        <InvoiceTemplate invoice={invoice} />,
        `invoice-${invoice.invoiceNumber}.pdf`
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <DropdownMenuItem onSelect={handleDownload}>
      <Download className="mr-2 h-4 w-4" />
      Download PDF
    </DropdownMenuItem>
  );
} 