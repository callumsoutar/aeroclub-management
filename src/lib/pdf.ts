import { pdf } from '@react-pdf/renderer'
import { saveAs } from 'file-saver'
import { Document, DocumentProps } from '@react-pdf/renderer'

export async function generateAndDownloadPDF(document: React.ReactElement<DocumentProps, typeof Document>, filename: string = 'invoice.pdf') {
  const blob = await pdf(document).toBlob()
  saveAs(blob, filename)
} 