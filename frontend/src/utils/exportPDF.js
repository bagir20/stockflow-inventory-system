import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const exportToPDF = (title, subtitle, columns, data, filename) => {
  const doc = new jsPDF()

  // header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 14, 20)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120)
  doc.text(subtitle, 14, 28)
  doc.text(`Generated: ${new Date().toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })}`, 14, 34)

  // reset color
  doc.setTextColor(0)

  // table
  autoTable(doc, {
    startY: 42,
    head: [columns.map(c => c.header)],
    body: data.map(item => columns.map(c => c.value(item))),
    headStyles: {
      fillColor: [92, 33, 182],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [248, 249, 252],
    },
    styles: {
      cellPadding: 4,
    },
    margin: { left: 14, right: 14 },
  })

  // footer
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `StockFlow — Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    )
  }

  doc.save(`${filename}.pdf`)
}

export const exportDashboardPDF = (stats, lowStock, movements) => {
  const doc = new jsPDF()

  // title
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('StockFlow', 14, 20)

  doc.setFontSize(13)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80)
  doc.text('Inventory Summary Report', 14, 28)

  doc.setFontSize(9)
  doc.text(`Generated: ${new Date().toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })}`, 14, 34)
  doc.setTextColor(0)

  // stats boxes
  const statsData = [
    ['Total Products', stats.totalProducts],
    ['Total Stock', `${stats.totalStock} units`],
    ['Low Stock', `${stats.lowStockCount} products`],
  ]

  let y = 44
  statsData.forEach(([label, value]) => {
    doc.setFillColor(248, 249, 252)
    doc.roundedRect(14, y, 55, 16, 2, 2, 'F')
    doc.setFontSize(8)
    doc.setTextColor(120)
    doc.text(label, 18, y + 6)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(20)
    doc.text(String(value), 18, y + 13)
    doc.setFont('helvetica', 'normal')
    y += 20
  })

  // low stock table
  if (lowStock.length > 0) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0)
    doc.text('Low Stock Alert', 14, y + 4)
    y += 8

    autoTable(doc, {
      startY: y,
      head: [['Product', 'SKU', 'Stock', 'Min Stock']],
      body: lowStock.map(p => [p.name, p.sku, p.stock, p.min_stock]),
      headStyles: { fillColor: [234, 88, 12], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 12
  }

  // recent movements
  if (movements.length > 0) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Recent Stock Movements', 14, y)
    y += 6

    autoTable(doc, {
      startY: y,
      head: [['Product', 'Type', 'Qty', 'Note', 'By', 'Date']],
      body: movements.map(m => [
        m.product_name,
        m.type.toUpperCase(),
        m.type === 'in' ? `+${m.quantity}` : m.quantity,
        m.note || '—',
        m.user_name,
        new Date(m.created_at).toLocaleDateString('id-ID')
      ]),
      headStyles: { fillColor: [92, 33, 182], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    })
  }

  // footer
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `StockFlow — Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    )
  }

  doc.save('StockFlow-Report.pdf')
}