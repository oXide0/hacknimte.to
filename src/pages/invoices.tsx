import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Check, X, ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationPrevious,
    PaginationLink,
    PaginationNext
} from '@/components/ui/pagination';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type Invoice = {
    id: string;
    month: string;
    totalUsage: number;
    unitCost: number;
    totalCost: number;
    paid: boolean;
    date: Date;
    year: number;
};

// Generate mock data
const generateMockInvoices = () => {
    return Array.from({ length: 50 }, (_, i) => {
        const monthIndex = i % 12;
        const year = 2024 + Math.floor(i / 12);
        return {
            id: `INV-${year}${(monthIndex + 1).toString().padStart(2, '0')}`,
            month: new Date(year, monthIndex, 1).toLocaleString('default', { month: 'long' }),
            totalUsage: Math.floor(Math.random() * 1000) + 500,
            unitCost: parseFloat((Math.random() * 0.5 + 0.1).toFixed(4)),
            totalCost: parseFloat(((Math.floor(Math.random() * 1000) + 500) * (Math.random() * 0.5 + 0.1)).toFixed(2)),
            paid: Math.random() > 0.3,
            date: new Date(year, monthIndex, 1),
            year: year
        };
    });
};

type SortConfig = {
    key: keyof Invoice;
    direction: 'asc' | 'desc';
};

export function Invoices() {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: 'date',
        direction: 'desc'
    });
    const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
    const invoicesPerPage = 8;

    // Generate and sort invoices
    const sortedInvoices = [...generateMockInvoices()].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const totalPages = Math.ceil(sortedInvoices.length / invoicesPerPage);
    const currentInvoices = sortedInvoices.slice((currentPage - 1) * invoicesPerPage, currentPage * invoicesPerPage);

    const requestSort = (key: keyof Invoice) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1);
    };

    const getSortIcon = (key: keyof Invoice) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? (
            <ArrowUp className='ml-1 h-3 w-3' />
        ) : (
            <ArrowDown className='ml-1 h-3 w-3' />
        );
    };

    const toggleSelectInvoice = (invoiceId: string) => {
        setSelectedInvoices((prev) =>
            prev.includes(invoiceId) ? prev.filter((id) => id !== invoiceId) : [...prev, invoiceId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedInvoices.length === currentInvoices.length) {
            setSelectedInvoices([]);
        } else {
            setSelectedInvoices(currentInvoices.map((invoice) => invoice.id));
        }
    };

    const generatePdf = (invoices: Invoice[]) => {
        const doc = new jsPDF();

        // Add title
        doc.setFontSize(18);
        doc.text('Invoice Report', 14, 22);

        // Add date
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

        // Prepare table data
        const tableData = invoices.map((invoice) => [
            `${invoice.month} ${invoice.year}`,
            `${invoice.totalUsage} units`,
            `€${invoice.unitCost.toFixed(4)}`,
            `€${invoice.totalCost.toFixed(2)}`,
            invoice.paid ? 'Paid' : 'Unpaid'
        ]);

        // Add table
        autoTable(doc, {
            head: [['Month', 'Usage', 'Unit Cost', 'Total Cost', 'Status']],
            body: tableData,
            startY: 40,
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [240, 240, 240]
            }
        });

        // Add summary
        const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.totalCost, 0);
        doc.setFontSize(12);
        doc.text(`Total Amount: €${totalAmount.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 20);

        return doc;
    };

    const downloadPdf = (invoice: Invoice) => {
        const doc = generatePdf([invoice]);
        doc.save(`invoice_${invoice.month}_${invoice.year}.pdf`);
    };

    const downloadSelectedPdfs = () => {
        if (selectedInvoices.length === 0) return;

        const selected = sortedInvoices.filter((invoice) => selectedInvoices.includes(invoice.id));

        if (selected.length === 1) {
            downloadPdf(selected[0]);
        } else {
            const doc = generatePdf(selected);
            doc.save(`invoices_${selected.length}_items.pdf`);
        }
    };

    const handleBulkMarkAsPaid = () => {
        console.log('Marking as paid:', selectedInvoices);
        setSelectedInvoices([]);
    };

    return (
        <div className='pr-6 w-full'>
            <div className='space-y-4 pt-6'>
                <div className='flex justify-between items-center'>
                    <h1 className='text-3xl font-bold tracking-tight'>Invoices</h1>
                    {selectedInvoices.length > 0 && (
                        <div className='flex gap-2'>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant='outline'>
                                        Bulk Actions <ChevronDown className='ml-2 h-4 w-4' />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={downloadSelectedPdfs}>
                                        <Download className='mr-2 h-4 w-4' />
                                        {selectedInvoices.length > 1 ? 'Download Selected as PDF' : 'Download as PDF'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleBulkMarkAsPaid}>
                                        <Check className='mr-2 h-4 w-4' />
                                        Mark as Paid
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button variant='ghost' onClick={() => setSelectedInvoices([])}>
                                Clear Selection
                            </Button>
                        </div>
                    )}
                </div>

                <div className='rounded-md border'>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className='w-[40px]'>
                                    <Checkbox
                                        checked={
                                            currentInvoices.length > 0 &&
                                            selectedInvoices.length === currentInvoices.length
                                        }
                                        onCheckedChange={toggleSelectAll}
                                        aria-label='Select all'
                                    />
                                </TableHead>
                                <TableHead
                                    className='cursor-pointer hover:bg-accent'
                                    onClick={() => requestSort('month')}
                                >
                                    <div className='flex items-center'>
                                        Month
                                        {getSortIcon('month')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className='cursor-pointer hover:bg-accent'
                                    onClick={() => requestSort('totalUsage')}
                                >
                                    <div className='flex items-center'>
                                        Total Usage
                                        {getSortIcon('totalUsage')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className='cursor-pointer hover:bg-accent'
                                    onClick={() => requestSort('unitCost')}
                                >
                                    <div className='flex items-center'>
                                        Unit Cost (€)
                                        {getSortIcon('unitCost')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className='cursor-pointer hover:bg-accent'
                                    onClick={() => requestSort('totalCost')}
                                >
                                    <div className='flex items-center'>
                                        Total Cost (€)
                                        {getSortIcon('totalCost')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className='cursor-pointer hover:bg-accent'
                                    onClick={() => requestSort('paid')}
                                >
                                    <div className='flex items-center'>
                                        Status
                                        {getSortIcon('paid')}
                                    </div>
                                </TableHead>
                                <TableHead className='text-right pr-14'>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentInvoices.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedInvoices.includes(invoice.id)}
                                            onCheckedChange={() => toggleSelectInvoice(invoice.id)}
                                            aria-label={`Select invoice ${invoice.id}`}
                                        />
                                    </TableCell>
                                    <TableCell className='font-medium'>
                                        {invoice.month} {invoice.year}
                                    </TableCell>
                                    <TableCell>{invoice.totalUsage} units</TableCell>
                                    <TableCell>€{invoice.unitCost.toFixed(4)}</TableCell>
                                    <TableCell>€{invoice.totalCost.toFixed(2)}</TableCell>
                                    <TableCell>
                                        {invoice.paid ? (
                                            <span className='flex items-center text-green-500'>
                                                <Check className='mr-1 h-4 w-4' /> Paid
                                            </span>
                                        ) : (
                                            <span className='flex items-center text-red-500'>
                                                <X className='mr-1 h-4 w-4' /> Unpaid
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className='text-right'>
                                        <Button variant='outline' size='sm' onClick={() => downloadPdf(invoice)}>
                                            <Download className='h-4 w-4 mr-2' />
                                            Download
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} />
                        </PaginationItem>

                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                            return (
                                <PaginationItem key={page}>
                                    <PaginationLink
                                        isActive={page === currentPage}
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </PaginationLink>
                                </PaginationItem>
                            );
                        })}

                        <PaginationItem>
                            <PaginationNext onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    );
}
