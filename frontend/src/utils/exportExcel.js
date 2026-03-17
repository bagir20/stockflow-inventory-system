import * as XLSX from 'xlsx'

export const exportToExcel = (data, columns, filename) => {
  // format data sesuai columns
  const rows = data.map(item => {
    const row = {}
    columns.forEach(col => {
      row[col.header] = col.value(item)
    })
    return row
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()

  // auto column width
  const colWidths = columns.map(col => ({
    wch: Math.max(col.header.length, 15)
  }))
  ws['!cols'] = colWidths

  XLSX.utils.book_append_sheet(wb, ws, 'Data')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}