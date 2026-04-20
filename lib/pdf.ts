import { jsPDF } from 'jspdf'

export function downloadEulogyPdf({
  fullName,
  subtitle,
  text,
  filename,
}: {
  fullName: string
  subtitle: string
  text: string
  filename: string
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const marginX = 22
  const marginTop = 25
  const marginBottom = 20
  const pageHeight = 297
  const maxWidth = 210 - marginX * 2
  const lineHeight = 6.5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(18)
  doc.text(fullName, marginX, marginTop)

  doc.setFontSize(11)
  doc.setTextColor(100)
  doc.text(subtitle, marginX, marginTop + 8)

  doc.setTextColor(0)
  doc.setDrawColor(200)
  doc.line(marginX, marginTop + 13, 210 - marginX, marginTop + 13)

  doc.setFontSize(11)
  doc.setTextColor(0)

  const bodyLines = doc.splitTextToSize(text, maxWidth) as string[]
  let y = marginTop + 22

  for (const line of bodyLines) {
    if (y + lineHeight > pageHeight - marginBottom) {
      doc.addPage()
      y = marginTop
    }
    doc.text(line, marginX, y)
    y += lineHeight
  }

  doc.save(filename)
}
