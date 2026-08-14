import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { FormatReport, SurveyResponse } from '../types';
import { getQuestionsForFormat } from '../data/initialQuestions';

export function exportReportToCSV(report: FormatReport, responses: SurveyResponse[]) {
  const filtered = responses.filter(r => r.formatType === report.formatType);
  
  let csvContent = '\uFEFF'; // UTF-8 BOM for Excel
  csvContent += `REPORTE DE RESULTADOS - FORMATO ${report.formatType}\n`;
  csvContent += `Título: ${report.formatTitle}\n`;
  if (report.selectedServiceType && report.selectedServiceType !== 'all') {
    csvContent += `Tipo de Servicio: ${report.selectedServiceType}\n`;
  }
  csvContent += `Fecha de Generación: ${new Date().toLocaleString()}\n`;
  csvContent += `Total Encuestas: ${report.totalSurveys}; Promedio General: ${report.overallAverage}/10; Índice CSAT: ${report.csatIndex}%\n\n`;

  // Section 1: Question Summary
  csvContent += `RESUMEN POR PREGUNTA\n`;
  csvContent += `Pregunta N°;Sección;Texto de la Pregunta;Puntaje Promedio;% Satisfacción (>=8);Respuestas con < 8\n`;

  report.questionMetrics.forEach(q => {
    const cleanText = q.text.replace(/;/g, ',').replace(/\n/g, ' ');
    const cleanSec = q.sectionTitle.replace(/;/g, ',');
    csvContent += `${q.questionNumber};"${cleanSec}";"${cleanText}";${q.averageScore};${q.csatPercentage}%;${q.lowScoresCount}\n`;
  });

  csvContent += `\n\nDETALLE DE OBSERVACIONES Y MOTIVOS (CALIFICACIONES MENORES A 8)\n`;
  csvContent += `Pregunta N°;Sección;Cliente/Empresa;Fecha;Puntaje;Motivo de la baja calificación\n`;

  if (report.allMotives.length === 0) {
    csvContent += `No se registraron calificaciones menores a 8 con observaciones.\n`;
  } else {
    report.allMotives.forEach(m => {
      const cleanMotive = m.motive.replace(/;/g, ',').replace(/\n/g, ' ');
      const dateStr = new Date(m.date).toLocaleDateString();
      csvContent += `${m.questionNumber};"${m.sectionTitle}";"${m.clientName}";${dateStr};${m.score};"${cleanMotive}"\n`;
    });
  }

  csvContent += `\n\nHISTORIAL DE RESPUESTAS INDIVIDUALES\n`;
  csvContent += `ID;Fecha;Cliente;Empresa;Expediente/Orden;Inspector;Canal;Promedio;Alertas (<8);Comentarios Generales\n`;

  filtered.forEach(r => {
    const dateStr = new Date(r.createdAt).toLocaleDateString();
    const comment = (r.generalComments || '').replace(/;/g, ',').replace(/\n/g, ' ');
    csvContent += `${r.id};${dateStr};"${r.clientName}";"${r.companyName || ''}";"${r.serviceOrderOrExpedient}";"${r.inspectorName || ''}";"${r.serviceChannel}";${r.averageScore};${r.lowScoreCount};"${comment}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Reporte_${report.formatType}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// -------------------------------------------------------------
// EXPORT INDIVIDUAL SURVEY TO PDF
// -------------------------------------------------------------
export function exportSingleSurveyToPDF(response: SurveyResponse) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const sedapalPrimary = [0, 56, 101];   // #003865 Deep Corporate Blue
  const sedapalCyan = [0, 153, 221];     // #0099DD Wave Blue
  const sedapalLightCyan = [120, 192, 235]; // #78C0EB Light Blue

  // Header Banner Background
  doc.setFillColor(sedapalPrimary[0], sedapalPrimary[1], sedapalPrimary[2]);
  doc.rect(0, 0, 210, 30, 'F');

  // Wave accent bars
  doc.setFillColor(sedapalCyan[0], sedapalCyan[1], sedapalCyan[2]);
  doc.rect(0, 26.5, 210, 2, 'F');
  doc.setFillColor(sedapalLightCyan[0], sedapalLightCyan[1], sedapalLightCyan[2]);
  doc.rect(0, 28.5, 210, 1.5, 'F');

  // Header Titles (Clean typography without deformed logo box)
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('SEDAPAL - ORGANISMO DE INSPECCIÓN Y CALIDAD', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`FICHA INDIVIDUAL DE EVALUACIÓN DE SATISFACCIÓN - FORMATO ${response.formatType}`, 14, 17.5);

  doc.setFontSize(8);
  doc.setTextColor(224, 242, 254);
  const formattedDate = new Date(response.createdAt).toLocaleDateString('es-PE') + ' ' + new Date(response.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  doc.text(`Fecha de Registro: ${formattedDate}`, 196, 23.5, { align: 'right' });

  let y = 38;

  // Title Box
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Registro de Encuesta: Expediente / Remesa N° ${response.serviceOrderOrExpedient}`, 14, y);
  y += 6;

  // Respondent Metadata Box (Grid style)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, 182, 38, 2, 2, 'FD');

  // Inside Metadata
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('TIPO DE SERVICIO BRINDADO:', 18, y + 6);
  doc.text('RAZÓN SOCIAL / EQUIPO SEDAPAL:', 18, y + 14);
  doc.text('EXPEDIENTE / REMESA / DOC. REF:', 18, y + 22);
  doc.text('CANAL DE ATENCIÓN:', 18, y + 30);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 56, 101);
  doc.text(response.serviceProvidedType || 'No especificado', 78, y + 6);
  doc.text(response.clientName + (response.companyName ? ` (${response.companyName})` : ''), 78, y + 14);
  doc.text(response.serviceOrderOrExpedient, 78, y + 22);
  doc.text(response.serviceChannel || 'Directo', 78, y + 30);

  // Score Badge in Metadata
  doc.setFillColor(response.averageScore >= 8 ? 236 : 254, response.averageScore >= 8 ? 253 : 243, response.averageScore >= 8 ? 245 : 199);
  doc.roundedRect(148, y + 4, 44, 30, 2, 2, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('CALIFICACIÓN', 170, y + 11, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  if (response.averageScore >= 8) {
    doc.setTextColor(5, 150, 105);
  } else if (response.averageScore >= 7) {
    doc.setTextColor(217, 119, 6);
  } else {
    doc.setTextColor(220, 38, 38);
  }
  doc.text(`${response.averageScore} / 10`, 170, y + 20, { align: 'center' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(response.averageScore >= 8 ? 5 : 220, response.averageScore >= 8 ? 150 : 38, response.averageScore >= 8 ? 105 : 38);
  doc.text(response.averageScore >= 8 ? 'SATISFACTORIO' : `${response.lowScoreCount} OBS. (≤8)`, 170, y + 28, { align: 'center' });

  y += 44;

  // Answers Table Section Header
  doc.setTextColor(sedapalPrimary[0], sedapalPrimary[1], sedapalPrimary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Detalle de Respuestas y Calificaciones Otorgadas', 14, y);
  y += 5;

  // Table Column Headers
  doc.setFillColor(sedapalPrimary[0], sedapalPrimary[1], sedapalPrimary[2]);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('N°', 18, y + 4.5, { align: 'center' });
  doc.text('Aspecto / Pregunta Evaluada', 26, y + 4.5);
  doc.text('Puntaje', 152, y + 4.5, { align: 'center' });
  doc.text('Estado / Motivo', 176, y + 4.5, { align: 'center' });

  y += 7;

  const questions = getQuestionsForFormat(response.formatType);

  questions.forEach((q, idx) => {
    const ans = response.answers.find(a => a.questionId === q.id || a.questionNumber === q.number);
    const score = ans ? ans.score : 0;
    const isLow = score <= 8;
    const motive = ans?.motive;

    const questionLines = doc.splitTextToSize(q.text, 116);
    let rowHeight = Math.max(8, questionLines.length * 3.8 + 3);

    let motiveLines: string[] = [];
    if (isLow && motive) {
      motiveLines = doc.splitTextToSize(`Obs: "${motive}"`, 116);
      rowHeight += motiveLines.length * 3.5 + 2;
    }

    // Page Break Check
    if (y + rowHeight > 270) {
      doc.addPage();
      y = 20;

      // Repeat Table Header
      doc.setFillColor(sedapalPrimary[0], sedapalPrimary[1], sedapalPrimary[2]);
      doc.rect(14, y, 182, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('N°', 18, y + 4.5, { align: 'center' });
      doc.text('Aspecto / Pregunta Evaluada', 26, y + 4.5);
      doc.text('Puntaje', 152, y + 4.5, { align: 'center' });
      doc.text('Estado / Motivo', 176, y + 4.5, { align: 'center' });
      y += 7;
    }

    // Row Background
    if (isLow) {
      doc.setFillColor(254, 242, 242); // soft red/amber
      doc.rect(14, y, 182, rowHeight, 'F');
    } else if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, rowHeight, 'F');
    }

    // Question Number
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`${q.number}`, 18, y + 4.5, { align: 'center' });

    // Question Text
    doc.setFont('helvetica', 'normal');
    doc.text(questionLines, 26, y + 4.5);

    // Score
    doc.setFont('helvetica', 'bold');
    if (score >= 8) {
      doc.setTextColor(5, 150, 105);
    } else if (score >= 7) {
      doc.setTextColor(217, 119, 6);
    } else {
      doc.setTextColor(220, 38, 38);
    }
    doc.text(`${score} / 10`, 152, y + 4.5, { align: 'center' });

    // Status / Alert Badge
    doc.setFontSize(7.5);
    if (isLow) {
      doc.setTextColor(185, 28, 28);
      doc.text('Obs. ≤ 8', 176, y + 4.5, { align: 'center' });
    } else {
      doc.setTextColor(5, 150, 105);
      doc.text('Conforme', 176, y + 4.5, { align: 'center' });
    }

    // Print Motive below question if low score
    if (isLow && motive && motiveLines.length > 0) {
      const motiveY = y + questionLines.length * 3.8 + 4;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(185, 28, 28);
      doc.text(motiveLines, 26, motiveY);
    }

    // Row Divider Line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y + rowHeight, 196, y + rowHeight);

    y += rowHeight;
  });

  y += 6;

  // General Comments Box
  if (response.generalComments) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setTextColor(sedapalPrimary[0], sedapalPrimary[1], sedapalPrimary[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Comentarios Generales del Cliente:', 14, y);
    y += 4;

    const commentLines = doc.splitTextToSize(`"${response.generalComments}"`, 174);
    const boxHeight = Math.max(12, commentLines.length * 4 + 6);

    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, y, 182, boxHeight, 1.5, 1.5, 'FD');

    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text(commentLines, 18, y + 5);

    y += boxHeight + 4;
  }

  // Institutional Thank You Box at the end of PDF
  if (y > 250) {
    doc.addPage();
    y = 20;
  } else {
    y += 2;
  }

  doc.setFillColor(232, 244, 252);
  doc.setDrawColor(179, 216, 245);
  doc.roundedRect(14, y, 182, 12, 1.5, 1.5, 'FD');

  doc.setTextColor(sedapalPrimary[0], sedapalPrimary[1], sedapalPrimary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(
    '“Muchas gracias por haber llenado nuestra encuesta, su opinión es importante para nosotros”.',
    105,
    y + 7,
    { align: 'center' }
  );

  y += 16;

  // Footer for all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${i} de ${pageCount} - Ficha de Evaluación Individual SEDAPAL (GCFO0131)`,
      105,
      290,
      { align: 'center' }
    );
  }

  const cleanExp = response.serviceOrderOrExpedient.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Evaluacion_SEDAPAL_${cleanExp}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// -------------------------------------------------------------
// EXPORT INDIVIDUAL SURVEY TO EXCEL (.XLSX)
// -------------------------------------------------------------
export function exportSingleSurveyToExcel(response: SurveyResponse) {
  const wb = XLSX.utils.book_new();
  const questions = getQuestionsForFormat(response.formatType);

  const formattedDate = new Date(response.createdAt).toLocaleDateString('es-PE') + ' ' + new Date(response.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  // Build Sheet Data
  const sheetData: (string | number)[][] = [
    ['SEDAPAL - ORGANISMO DE INSPECCIÓN Y CALIDAD'],
    ['FICHA INDIVIDUAL DE EVALUACIÓN DE SATISFACCIÓN DEL CLIENTE'],
    ['FORMATO OFICIAL GCFO0131'],
    [],
    ['DATOS GENERALES DE LA EVALUACIÓN', ''],
    ['Fecha y Hora de Registro:', formattedDate],
    ['Formato de Inspección:', response.formatType],
    ['Tipo de Servicio Brindado:', response.serviceProvidedType || 'No especificado'],
    ['Razón Social / Equipo SEDAPAL:', response.clientName],
    ['Empresa / Entidad:', response.companyName || '-'],
    ['N° Expediente / Remesa / Ref.:', response.serviceOrderOrExpedient],
    ['Inspector / Técnico Evaluado:', response.inspectorName || '-'],
    ['Canal de Atención:', response.serviceChannel],
    ['Calificación Promedio General:', `${response.averageScore} / 10`],
    ['Total de Preguntas Observadas (<=8):', response.lowScoreCount],
    ['Estado de Satisfacción:', response.averageScore >= 8 ? 'SATISFACTORIO' : 'CON OBSERVACIONES'],
    [],
    ['DETALLE DE RESPUESTAS POR PREGUNTA', '', '', '', ''],
    ['N° Pregunta', 'Sección', 'Aspecto Evaluado', 'Calificación (1-10)', 'Estado', 'Motivo / Justificación de la Calificación (<=8)']
  ];

  questions.forEach(q => {
    const ans = response.answers.find(a => a.questionId === q.id || a.questionNumber === q.number);
    const score = ans ? ans.score : 0;
    const isLow = score <= 8;
    const motive = ans?.motive || (isLow ? 'Sin motivo especificado' : '-');

    sheetData.push([
      `Pregunta ${q.number}`,
      q.sectionTitle,
      q.text,
      score,
      isLow ? 'Observado (<=8)' : 'Conforme (>=8)',
      motive
    ]);
  });

  sheetData.push([]);
  sheetData.push(['COMENTARIOS GENERALES DEL CLIENTE', '']);
  sheetData.push([response.generalComments || 'Sin comentarios adicionales']);
  sheetData.push([]);
  sheetData.push(['“Muchas gracias por haber llenado nuestra encuesta, su opinión es importante para nosotros”.']);

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set column widths
  ws['!cols'] = [
    { wch: 16 }, // N°
    { wch: 22 }, // Sección
    { wch: 65 }, // Aspecto
    { wch: 18 }, // Calificación
    { wch: 18 }, // Estado
    { wch: 50 }  // Motivo
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Evaluación');

  const cleanExp = response.serviceOrderOrExpedient.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `Evaluacion_SEDAPAL_${cleanExp}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// -------------------------------------------------------------
// EXPORT ALL / FILTERED SURVEYS TO EXCEL (.XLSX)
// -------------------------------------------------------------
export function exportAllSurveysToExcel(responses: SurveyResponse[], fileNamePrefix: string = 'Historial_Evaluaciones_GCFO0131') {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Resumen Consolidado
  const headers = [
    'ID',
    'Fecha de Registro',
    'Formato',
    'Tipo de Servicio',
    'Razón Social / Equipo',
    'Empresa',
    'N° Expediente / Remesa',
    'Inspector Evaluado',
    'Canal',
    'Promedio (/10)',
    'Alertas (<=8)',
    'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8',
    'Motivos y Observaciones',
    'Comentarios Generales'
  ];

  const rows = responses.map(r => {
    const formattedDate = new Date(r.createdAt).toLocaleDateString('es-PE') + ' ' + new Date(r.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    // Question scores
    const pScores: (number | string)[] = [];
    for (let i = 1; i <= 8; i++) {
      const a = r.answers.find(ans => ans.questionNumber === i);
      pScores.push(a ? a.score : '-');
    }

    // Motives summary
    const motivesList = r.answers
      .filter(a => a.score <= 8 && a.motive)
      .map(a => `[P${a.questionNumber}=${a.score}]: ${a.motive}`)
      .join(' | ');

    return [
      r.id,
      formattedDate,
      r.formatType,
      r.serviceProvidedType || 'No especificado',
      r.clientName,
      r.companyName || '',
      r.serviceOrderOrExpedient,
      r.inspectorName || '',
      r.serviceChannel,
      r.averageScore,
      r.lowScoreCount,
      ...pScores,
      motivesList || 'Ninguna',
      r.generalComments || ''
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([
    ['SEDAPAL - ORGANISMO DE INSPECCIÓN Y CALIDAD'],
    [`HISTORIAL COMPLETO DE EVALUACIONES REGISTRADAS - FORMATO GCFO0131`],
    [`Fecha de Exportación: ${new Date().toLocaleString('es-PE')}`],
    [],
    headers,
    ...rows
  ]);

  ws['!cols'] = [
    { wch: 12 }, // ID
    { wch: 18 }, // Fecha
    { wch: 12 }, // Formato
    { wch: 28 }, // Tipo de Servicio
    { wch: 28 }, // Razón Social
    { wch: 20 }, // Empresa
    { wch: 22 }, // Expediente
    { wch: 20 }, // Inspector
    { wch: 14 }, // Canal
    { wch: 14 }, // Promedio
    { wch: 14 }, // Alertas
    { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 },
    { wch: 50 }, // Motivos
    { wch: 40 }  // Comentarios
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Historial_Respuestas');

  XLSX.writeFile(wb, `${fileNamePrefix}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportReportToPDF(report: FormatReport) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const sedapalPrimary = [0, 56, 101];   // #003865 Deep Corporate Blue
  const sedapalCyan = [0, 153, 221];     // #0099DD Wave Blue
  const sedapalLightCyan = [120, 192, 235]; // #78C0EB Light Blue
  const primaryColor = sedapalPrimary;
  const accentColor = sedapalCyan;
  const lightBg = [241, 245, 249];

  let y = 15;

  // Header Banner Background
  doc.setFillColor(sedapalPrimary[0], sedapalPrimary[1], sedapalPrimary[2]);
  doc.rect(0, 0, 210, 30, 'F');

  // Draw 2 SEDAPAL Wave lines in the header
  doc.setFillColor(sedapalCyan[0], sedapalCyan[1], sedapalCyan[2]);
  doc.rect(0, 26.5, 210, 2, 'F');
  doc.setFillColor(sedapalLightCyan[0], sedapalLightCyan[1], sedapalLightCyan[2]);
  doc.rect(0, 28.5, 210, 1.5, 'F');

  // Header Titles (Clean typography without logo box)
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('SEDAPAL - ORGANISMO DE INSPECCIÓN Y CALIDAD', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`REPORTE DE EVALUACIÓN DE SATISFACCIÓN - FORMATO ${report.formatType}`, 14, 17.5);

  doc.setFontSize(8);
  doc.setTextColor(224, 242, 254);
  doc.text(
    `Generado el: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}`,
    196,
    23.5,
    { align: 'right' }
  );

  y = 38;

  // Title Box (Wrapped to 182mm max width to prevent right margin overflow)
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const titleLines = doc.splitTextToSize(report.formatTitle, 182);
  doc.text(titleLines, 14, y);
  y += titleLines.length * 5 + 2;

  // Prominent Service Type Box in PDF
  const serviceLabel = !report.selectedServiceType || report.selectedServiceType === 'all'
    ? 'Todos los Tipos de Servicio (Consolidado General)'
    : report.selectedServiceType;

  const serviceTextLines = doc.splitTextToSize(`TIPO DE SERVICIO BRINDADO: ${serviceLabel}`, 174);
  const serviceBoxHeight = Math.max(8, serviceTextLines.length * 4.5 + 4);

  doc.setFillColor(232, 244, 252); // SEDAPAL Light Sky Box
  doc.setDrawColor(179, 216, 245); // Subtle SEDAPAL border
  doc.roundedRect(14, y, 182, serviceBoxHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 56, 101); // SEDAPAL Deep Blue
  doc.text(serviceTextLines, 17, y + 5);

  y += serviceBoxHeight + 5;

  // Executive Summary Cards (Centered & Balanced Layout across 182mm)
  const cardWidth = 58;
  const cardGap = 4;
  const card1X = 14;
  const card2X = card1X + cardWidth + cardGap; // 76
  const card3X = card2X + cardWidth + cardGap; // 138

  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(card1X, y, cardWidth, 22, 2, 2, 'F');
  doc.roundedRect(card2X, y, cardWidth, 22, 2, 2, 'F');
  doc.roundedRect(card3X, y, cardWidth, 22, 2, 2, 'F');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL ENCUESTAS', card1X + 5, y + 6);
  doc.text('PROMEDIO GENERAL', card2X + 5, y + 6);
  doc.text('ÍNDICE CSAT (>=8)', card3X + 5, y + 6);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`${report.totalSurveys}`, card1X + 5, y + 16);

  // Score color
  if (report.overallAverage >= 8) {
    doc.setTextColor(16, 185, 129); // Green
  } else if (report.overallAverage >= 7) {
    doc.setTextColor(217, 119, 6); // Amber
  } else {
    doc.setTextColor(239, 68, 68); // Red
  }
  doc.text(`${report.overallAverage} / 10`, card2X + 5, y + 16);

  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text(`${report.csatIndex}%`, card3X + 5, y + 16);

  y += 28;

  // Section Breakdown Table
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('1. Resumen por Sección de Evaluación', 14, y);
  y += 5;

  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(14, y, 182, 7, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('Sección', 18, y + 4.5);
  doc.text('Preguntas', 115, y + 4.5, { align: 'center' });
  doc.text('Promedio', 150, y + 4.5, { align: 'center' });
  doc.text('Satisfacción %', 180, y + 4.5, { align: 'center' });

  y += 7;

  report.sectionMetrics.forEach((sec, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, 7, 'F');
    }
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    const shortTitle = sec.sectionTitle.length > 55 ? sec.sectionTitle.substring(0, 52) + '...' : sec.sectionTitle;
    doc.text(shortTitle, 18, y + 4.5);
    doc.text(`${sec.totalQuestions}`, 115, y + 4.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.text(`${sec.averageScore}/10`, 150, y + 4.5, { align: 'center' });
    doc.text(`${sec.csatPercentage}%`, 180, y + 4.5, { align: 'center' });

    y += 7;
  });

  y += 8;

  // Questions Detail Table
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('2. Detalle por Pregunta', 14, y);
  y += 5;

  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('N°', 18, y + 4.5, { align: 'center' });
  doc.text('Pregunta', 26, y + 4.5);
  doc.text('Promedio', 152, y + 4.5, { align: 'center' });
  doc.text('Alertas (<8)', 180, y + 4.5, { align: 'center' });

  y += 7;

  report.questionMetrics.forEach((q, idx) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const lines = doc.splitTextToSize(q.text, 118);
    const rowHeight = Math.max(8, lines.length * 4 + 3);

    // Page break check
    if (y + rowHeight > 270) {
      doc.addPage();
      y = 20;

      // Re-print header on new page
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(14, y, 182, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('N°', 18, y + 4.5, { align: 'center' });
      doc.text('Pregunta', 26, y + 4.5);
      doc.text('Promedio', 152, y + 4.5, { align: 'center' });
      doc.text('Alertas (<8)', 180, y + 4.5, { align: 'center' });
      y += 7;
    }

    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, rowHeight, 'F');
    }

    // Number
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`${q.questionNumber}`, 18, y + 4.5, { align: 'center' });

    // Text lines
    doc.setFont('helvetica', 'normal');
    doc.text(lines, 26, y + 4.5);

    // Score
    doc.setFont('helvetica', 'bold');
    if (q.averageScore >= 8) {
      doc.setTextColor(16, 185, 129);
    } else if (q.averageScore >= 7) {
      doc.setTextColor(217, 119, 6);
    } else {
      doc.setTextColor(220, 38, 38);
    }
    doc.text(`${q.averageScore}`, 152, y + 4.5, { align: 'center' });

    // Low score alerts
    if (q.lowScoresCount > 0) {
      doc.setTextColor(220, 38, 38);
      doc.text(`${q.lowScoresCount}`, 180, y + 4.5, { align: 'center' });
    } else {
      doc.setTextColor(100, 116, 139);
      doc.text(`0`, 180, y + 4.5, { align: 'center' });
    }

    y += rowHeight;
  });

  y += 8;

  // Motives for scores < 8
  if (report.allMotives.length > 0) {
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`3. Registro de Motivos e Inspecciones con Bajas Calificaciones (<8)`, 14, y);
    y += 6;

    report.allMotives.forEach((m) => {
      doc.setFontSize(8);
      const motiveLines = doc.splitTextToSize(`" ${m.motive} "`, 172);
      const cardHeight = Math.max(14, 9 + motiveLines.length * 4);

      if (y + cardHeight > 270) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(254, 242, 242); // light red
      doc.roundedRect(14, y, 182, cardHeight, 1.5, 1.5, 'F');

      doc.setTextColor(185, 28, 28);
      doc.setFont('helvetica', 'bold');
      doc.text(`Pregunta ${m.questionNumber} - Calificación: ${m.score}/10 | Cliente: ${m.clientName}`, 18, y + 4.5);

      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'italic');
      doc.text(motiveLines, 18, y + 9);

      y += cardHeight + 3;
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${i} de ${pageCount} - Sistema de Evaluación de Encuestas SEDAPAL (GCFO0131)`,
      105,
      290,
      { align: 'center' }
    );
  }

  doc.save(`Reporte_Oficial_${report.formatType}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

