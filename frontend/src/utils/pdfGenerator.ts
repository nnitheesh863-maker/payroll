import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Theme Sandalwood & Chai Colors
const PRIMARY_COLOR: [number, number, number] = [140, 83, 43]; // #8C532B
const SECONDARY_COLOR: [number, number, number] = [56, 30, 13]; // #381E0D
const BG_TINT: [number, number, number] = [250, 247, 242]; // #FAF7F2
const ACCENT_GREEN: [number, number, number] = [21, 128, 61]; // #15803D
const ACCENT_RED: [number, number, number] = [185, 28, 28]; // #B91C1C

export const pdfReports = {
  // 0. Individual Official Employee Payslip PDF
  exportEmployeePayslip: (p: any) => {
    const doc = new jsPDF('portrait');
    const name = p.employee_name || (p.employee ? `${p.employee.first_name} ${p.employee.last_name}` : 'Employee');
    const code = p.employee_code || (p.employee?.emp_code || `EMP-${p.employee_id || '001'}`);
    const desig = p.designation || p.employee?.position || 'Associate';
    const dept = p.department || p.employee?.department || 'Operations';
    const period = `${p.period_start || '01-Feb-2026'} to ${p.period_end || '28-Feb-2026'}`;
    const basic = p.basic_salary ?? p.base_wage ?? 55000;
    const hra = p.hra ?? Math.round(basic * 0.4);
    const special = p.special_allowance ?? (p.gross_salary ? p.gross_salary - basic - hra : 13000);
    const gross = p.gross_salary ?? (basic + hra + special);
    const pf = p.pf_deduction ?? Math.round(basic * 0.12);
    const tds = p.tds_deduction ?? Math.round(gross * 0.065);
    const deductions = p.total_deductions ?? (pf + tds);
    const net = p.net_salary ?? (gross - deductions);
    const slipNo = p.payslip_number || `PS-2026-${p.id || '101'}`;

    // Top Brand Banner
    doc.setFillColor(...BG_TINT);
    doc.rect(0, 0, 210, 36, 'F');
    doc.setFillColor(...PRIMARY_COLOR);
    doc.rect(0, 0, 210, 4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text('PeoplePay360 — Enterprise HR & Payroll ERP', 14, 16);

    doc.setFontSize(11);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(`CONFIDENTIAL SALARY PAYSLIP — ${slipNo}`, 14, 25);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text(`Pay Period: ${period}`, 135, 25);

    // Employee Profile Card
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(220, 210, 200);
    doc.roundedRect(14, 42, 182, 32, 2, 2, 'FD');

    doc.setFontSize(8.5);
    doc.setTextColor(120, 120, 120);
    doc.text('EMPLOYEE NAME', 20, 50);
    doc.text('EMPLOYEE ID', 95, 50);
    doc.text('DEPARTMENT', 150, 50);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text(name, 20, 57);
    doc.text(code, 95, 57);
    doc.text(dept, 150, 57);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(120, 120, 120);
    doc.text('DESIGNATION', 20, 66);
    doc.text('PAY STRUCTURE', 95, 66);
    doc.text('STATUS', 150, 66);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text(desig, 20, 72);
    doc.text('Regular Salary (US/IN)', 95, 72);
    doc.setTextColor(...ACCENT_GREEN);
    doc.text(p.status || 'VALIDATED / PAID', 150, 72);

    // Earnings & Deductions Tables (Side by Side)
    const earningsData = [
      ['Basic Salary', `Rs. ${basic.toLocaleString()}`],
      ['House Rent Allowance (HRA)', `Rs. ${hra.toLocaleString()}`],
      ['Special Allowance', `Rs. ${special.toLocaleString()}`],
      ['Total Gross Earnings', `Rs. ${gross.toLocaleString()}`],
    ];

    const deductionsData = [
      ['Provident Fund (PF - 12%)', `Rs. ${pf.toLocaleString()}`],
      ['Income Tax (TDS Withheld)', `Rs. ${tds.toLocaleString()}`],
      ['Professional Tax / LOP', 'Rs. 0'],
      ['Total Deductions', `Rs. ${deductions.toLocaleString()}`],
    ];

    autoTable(doc, {
      startY: 82,
      margin: { left: 14, right: 110 },
      head: [['Earnings & Allowances', 'Amount']],
      body: earningsData,
      theme: 'grid',
      headStyles: { fillColor: PRIMARY_COLOR, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8.5 },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    });

    autoTable(doc, {
      startY: 82,
      margin: { left: 110, right: 14 },
      head: [['Statutory Deductions', 'Amount']],
      body: deductionsData,
      theme: 'grid',
      headStyles: { fillColor: ACCENT_RED, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8.5 },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold', textColor: ACCENT_RED } },
    });

    // Net Pay Callout Banner
    const finalY = 145;
    doc.setFillColor(...BG_TINT);
    doc.setDrawColor(220, 210, 200);
    doc.roundedRect(14, finalY, 182, 24, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text('NET SALARY PAYABLE (DIRECT BANK TRANSFER)', 22, finalY + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('Disbursed via automated bank clearing system', 22, finalY + 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...ACCENT_GREEN);
    doc.text(`Rs. ${net.toLocaleString()}`, 145, finalY + 15);

    // Signatures & Stamp
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Employee Signature', 30, 210);
    doc.line(20, 205, 75, 205);

    doc.text('Authorized HR / Payroll Signatory', 130, 210);
    doc.line(120, 205, 185, 205);

    doc.text('This is a computer-generated document and requires no physical signature under Indian IT Act 2000.', 14, 235);

    doc.save(`Payslip_${name.replace(/\s+/g, '_')}_${slipNo}.pdf`);
  },

  // 1. Monthly Payroll Master Summary
  exportMonthlyPayrollMaster: (payrunName = 'September 2026 Regular Payrun') => {
    const doc = new jsPDF('landscape');

    doc.setFillColor(...BG_TINT);
    doc.rect(0, 0, 297, 30, 'F');
    doc.setFillColor(...PRIMARY_COLOR);
    doc.rect(0, 0, 297, 4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text('PeoplePay360 — Enterprise HR & Payroll ERP', 14, 15);

    doc.setFontSize(11);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(`Monthly Payroll Master Summary — ${payrunName}`, 14, 23);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()} | Currency: INR (₹)`, 220, 23);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(220, 210, 200);
    doc.roundedRect(14, 35, 62, 18, 2, 2, 'FD');
    doc.roundedRect(82, 35, 62, 18, 2, 2, 'FD');
    doc.roundedRect(150, 35, 62, 18, 2, 2, 'FD');
    doc.roundedRect(218, 35, 65, 18, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('TOTAL EMPLOYEES', 18, 41);
    doc.text('GROSS PAYROLL', 86, 41);
    doc.text('TOTAL DEDUCTIONS', 154, 41);
    doc.text('NET DISBURSED', 222, 41);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text('48 On Roll', 18, 49);
    doc.text('₹ 4,82,950', 86, 49);
    doc.setTextColor(...ACCENT_RED);
    doc.text('₹ 68,410', 154, 49);
    doc.setTextColor(...ACCENT_GREEN);
    doc.text('₹ 4,14,540', 222, 49);

    const tableData = [
      ['EMP-001', 'Aarav Mehta', 'Finance', 'Sr. Analyst', '30d', '₹ 65,000', '₹ 26,000', '₹ 1,05,000', '₹ 7,800', '₹ 6,900', '₹ 14,700', '₹ 90,300'],
      ['EMP-002', 'Sara Khan', 'HR & Admin', 'HR Lead', '30d', '₹ 55,000', '₹ 22,000', '₹ 90,000', '₹ 6,600', '₹ 6,000', '₹ 12,600', '₹ 77,400'],
      ['EMP-003', 'Anil Patel', 'Engineering', 'Full Stack Dev', '30d', '₹ 55,000', '₹ 22,000', '₹ 90,000', '₹ 6,600', '₹ 6,000', '₹ 12,600', '₹ 77,400'],
      ['EMP-004', 'Anita Oliver', 'Finance', 'Accountant', '30d', '₹ 45,000', '₹ 18,000', '₹ 75,000', '₹ 5,400', '₹ 4,500', '₹ 9,900', '₹ 65,100'],
      ['EMP-005', 'Audrey Peterson', 'HR & Admin', 'Coordinator', '30d', '₹ 40,000', '₹ 16,000', '₹ 68,000', '₹ 4,800', '₹ 3,900', '₹ 8,700', '₹ 59,300'],
      ['EMP-006', 'Billy Kyle', 'Engineering', 'Jr. Engineer', '30d', '₹ 35,000', '₹ 14,000', '₹ 54,950', '₹ 4,200', '₹ 2,750', '₹ 6,950', '₹ 48,000'],
      ['EMP-007', 'Eli Lambert', 'Design', 'Sr. Designer', '30d', '₹ 50,000', '₹ 20,000', '₹ 82,000', '₹ 6,000', '₹ 5,100', '₹ 11,100', '₹ 70,900'],
      ['EMP-008', 'Paul Williams', 'Engineering', 'DevOps Eng', '30d', '₹ 48,000', '₹ 19,200', '₹ 78,000', '₹ 5,760', '₹ 4,800', '₹ 10,560', '₹ 67,440'],
    ];

    autoTable(doc, {
      startY: 58,
      head: [['Code', 'Employee', 'Department', 'Designation', 'Worked', 'Basic', 'HRA', 'Gross Salary', 'PF (12%)', 'TDS', 'Total Ded.', 'Net Pay']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: PRIMARY_COLOR,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [50, 50, 50],
      },
      columnStyles: {
        0: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right', fontStyle: 'bold' },
        8: { halign: 'right' },
        9: { halign: 'right' },
        10: { halign: 'right', textColor: ACCENT_RED },
        11: { halign: 'right', fontStyle: 'bold', textColor: ACCENT_GREEN },
      },
      alternateRowStyles: {
        fillColor: [252, 250, 247],
      },
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text('PeoplePay360 &copy; Statutory Compliance Engine | Confidential Document', 14, 200);
      doc.text(`Page ${i} of ${pageCount}`, 265, 200);
    }

    doc.save(`Monthly_Payroll_Master_${payrunName.replace(/\s+/g, '_')}.pdf`);
  },

  // 2. Statutory Compliance & PF/ESI Ledger
  exportStatutoryCompliance: () => {
    const doc = new jsPDF('landscape');

    doc.setFillColor(...BG_TINT);
    doc.rect(0, 0, 297, 30, 'F');
    doc.setFillColor(...PRIMARY_COLOR);
    doc.rect(0, 0, 297, 4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text('PeoplePay360 — Statutory Compliance & PF/ESI Ledger', 14, 15);

    doc.setFontSize(10);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text('Government ECR Electronic Challan Return Schedule (Form 5 / 10 / 12A)', 14, 23);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Establishment ID: MH/BAN/0094821 | Period: Sep 2026`, 200, 23);

    const tableData = [
      ['100192847291', 'EMP-001', 'Aarav Mehta', '₹ 65,000', '₹ 15,000', '₹ 1,800', '₹ 1,250', '₹ 550', '₹ 75', '₹ 75', '₹ 3,750', 'Exempt'],
      ['100192847292', 'EMP-002', 'Sara Khan', '₹ 55,000', '₹ 15,000', '₹ 1,800', '₹ 1,250', '₹ 550', '₹ 75', '₹ 75', '₹ 3,750', 'Exempt'],
      ['100192847293', 'EMP-003', 'Anil Patel', '₹ 55,000', '₹ 15,000', '₹ 1,800', '₹ 1,250', '₹ 550', '₹ 75', '₹ 75', '₹ 3,750', 'Exempt'],
      ['100192847294', 'EMP-004', 'Anita Oliver', '₹ 45,000', '₹ 15,000', '₹ 1,800', '₹ 1,250', '₹ 550', '₹ 75', '₹ 75', '₹ 3,750', 'Exempt'],
      ['100192847295', 'EMP-005', 'Audrey Peterson', '₹ 40,000', '₹ 15,000', '₹ 1,800', '₹ 1,250', '₹ 550', '₹ 75', '₹ 75', '₹ 3,750', 'Exempt'],
      ['100192847296', 'EMP-006', 'Billy Kyle', '₹ 35,000', '₹ 15,000', '₹ 1,800', '₹ 1,250', '₹ 550', '₹ 75', '₹ 75', '₹ 3,750', '₹ 412.12'],
      ['100192847297', 'EMP-007', 'Eli Lambert', '₹ 50,000', '₹ 15,000', '₹ 1,800', '₹ 1,250', '₹ 550', '₹ 75', '₹ 75', '₹ 3,750', 'Exempt'],
      ['100192847298', 'EMP-008', 'Paul Williams', '₹ 48,000', '₹ 15,000', '₹ 1,800', '₹ 1,250', '₹ 550', '₹ 75', '₹ 75', '₹ 3,750', 'Exempt'],
    ];

    autoTable(doc, {
      startY: 36,
      head: [['UAN Number', 'Code', 'Member Name', 'Gross Wages', 'EPF Wages', 'EE PF (12%)', 'EPS (8.33%)', 'ER EPF (3.67%)', 'EDLI (0.5%)', 'Admin (0.5%)', 'Total PF Remitted', 'ESI Remittance']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: PRIMARY_COLOR,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 7.5,
      },
      columnStyles: {
        0: { halign: 'center' },
        1: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
        8: { halign: 'right' },
        9: { halign: 'right' },
        10: { halign: 'right', fontStyle: 'bold', textColor: ACCENT_GREEN },
        11: { halign: 'center' },
      },
    });

    doc.save('Statutory_Compliance_PF_ESI_Ledger.pdf');
  },

  // 3. TDS Statement (Form 24Q)
  exportTdsStatement: () => {
    const doc = new jsPDF('landscape');

    doc.setFillColor(...BG_TINT);
    doc.rect(0, 0, 297, 30, 'F');
    doc.setFillColor(...PRIMARY_COLOR);
    doc.rect(0, 0, 297, 4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text('PeoplePay360 — TDS & Tax Withholding Statement', 14, 15);

    doc.setFontSize(10);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text('Form 24Q Quarterly Return Schedule (Financial Year 2026-27 | Quarter 2)', 14, 23);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`TAN: BLRP09281A | Tax Deductor: PeoplePay360 Technologies Pvt Ltd`, 170, 23);

    const tableData = [
      ['AABCM1928A', 'EMP-001', 'Aarav Mehta', '₹ 12,60,000', '₹ 1,50,000', '₹ 50,000', '₹ 10,60,000', '₹ 82,800', '₹ 6,900', 'BSR-0028192', '07-Oct-2026'],
      ['BAPSK2819B', 'EMP-002', 'Sara Khan', '₹ 10,80,000', '₹ 1,50,000', '₹ 30,000', '₹ 9,00,000', '₹ 72,000', '₹ 6,000', 'BSR-0028192', '07-Oct-2026'],
      ['CNMAP9281C', 'EMP-003', 'Anil Patel', '₹ 10,80,000', '₹ 1,50,000', '₹ 30,000', '₹ 9,00,000', '₹ 72,000', '₹ 6,000', 'BSR-0028192', '07-Oct-2026'],
      ['DGAOT3829D', 'EMP-004', 'Anita Oliver', '₹ 9,00,000', '₹ 1,20,000', '₹ 25,000', '₹ 7,55,000', '₹ 54,000', '₹ 4,500', 'BSR-0028192', '07-Oct-2026'],
      ['EPAPP4829E', 'EMP-005', 'Audrey Peterson', '₹ 8,16,000', '₹ 1,00,000', '₹ 20,000', '₹ 6,96,000', '₹ 46,800', '₹ 3,900', 'BSR-0028192', '07-Oct-2026'],
      ['FBKPL5829F', 'EMP-006', 'Billy Kyle', '₹ 6,59,400', '₹ 80,000', '₹ 15,000', '₹ 5,64,400', '₹ 33,000', '₹ 2,750', 'BSR-0028192', '07-Oct-2026'],
      ['GELKT6829G', 'EMP-007', 'Eli Lambert', '₹ 9,84,000', '₹ 1,40,000', '₹ 25,000', '₹ 8,19,000', '₹ 61,200', '₹ 5,100', 'BSR-0028192', '07-Oct-2026'],
      ['HPWDT7829H', 'EMP-008', 'Paul Williams', '₹ 9,36,000', '₹ 1,30,000', '₹ 20,000', '₹ 7,86,000', '₹ 57,600', '₹ 4,800', 'BSR-0028192', '07-Oct-2026'],
    ];

    autoTable(doc, {
      startY: 36,
      head: [['PAN of Deductee', 'Code', 'Employee Name', 'Annual CTC', '80C Exemption', 'Standard Ded.', 'Taxable Income', 'Annual Tax', 'Monthly TDS', 'Challan BSR', 'Deposit Date']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: PRIMARY_COLOR,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 7.5,
      },
      columnStyles: {
        0: { halign: 'center' },
        1: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right', fontStyle: 'bold' },
        7: { halign: 'right' },
        8: { halign: 'right', fontStyle: 'bold', textColor: ACCENT_RED },
        9: { halign: 'center' },
        10: { halign: 'center' },
      },
    });

    doc.save('TDS_Tax_Deduction_Statement_Form24Q.pdf');
  },

  // 4. Department-wise Headcount & Compensation Cost
  exportDepartmentHeadcount: () => {
    const doc = new jsPDF('portrait');

    doc.setFillColor(...BG_TINT);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setFillColor(...PRIMARY_COLOR);
    doc.rect(0, 0, 210, 4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text('PeoplePay360 — Department Headcount & Cost', 14, 16);

    doc.setFontSize(10);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text('Executive Compensation & Staffing Allocation Report', 14, 24);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 155, 24);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(220, 210, 200);
    doc.roundedRect(14, 38, 182, 22, 2, 2, 'FD');

    doc.setFontSize(8.5);
    doc.setTextColor(120, 120, 120);
    doc.text('TOTAL ACTIVE HEADCOUNT', 20, 46);
    doc.text('MONTHLY COMPENSATION EXPENSE', 85, 46);
    doc.text('AVERAGE CTC PER HEAD', 150, 46);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text('48 Staff', 20, 54);
    doc.text('₹ 4,82,950', 85, 54);
    doc.text('₹ 1,00,614', 150, 54);

    const tableData = [
      ['Engineering & Product', '22 Staff', '₹ 2,40,000', '₹ 2,04,000', '49.7%', '₹ 1,09,090', 'Active'],
      ['Finance & Accounting', '8 Staff', '₹ 92,000', '₹ 78,200', '19.0%', '₹ 1,15,000', 'Active'],
      ['HR & People Operations', '6 Staff', '₹ 64,000', '₹ 54,400', '13.3%', '₹ 1,06,666', 'Active'],
      ['Sales & Growth Marketing', '12 Staff', '₹ 86,950', '₹ 77,940', '18.0%', '₹ 72,458', 'Active'],
    ];

    autoTable(doc, {
      startY: 68,
      head: [['Department', 'Headcount', 'Monthly Gross', 'Monthly Net', '% of Budget', 'Avg Monthly CTC', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: PRIMARY_COLOR,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8.5,
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'center', fontStyle: 'bold', textColor: PRIMARY_COLOR },
        5: { halign: 'right' },
        6: { halign: 'center', textColor: ACCENT_GREEN },
      },
    });

    doc.save('Department_Headcount_Compensation_Cost.pdf');
  },
};
