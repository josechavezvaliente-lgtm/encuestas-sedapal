import jsPDF from 'jspdf';
import { FormatReport, SurveyResponse } from '../types';

export function exportReportToCSV(report: FormatReport, responses: SurveyResponse[]) {
  const filtered = responses.filter(r => r.formatType === report.formatType);
  
  let csvContent = '\uFEFF'; // UTF-8 BOM for Excel
  csvContent += `REPORTE DE RESULTADOS - FORMATO ${report.formatType}\n`;
  csvContent += `Título: ${report.formatTitle}\n`;
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

export function exportReportToPDF(report: FormatReport) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [15, 43, 72]; // SEDAPAL Navy Blue
  const accentColor = [2, 132, 199]; // Cyan accent
  const lightBg = [241, 245, 249];

  let y = 15;

  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('SEDAPAL - ORGANISMO DE INSPECCIÓN Y CALIDAD', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`REPORTE DE EVALUACIÓN DE SATISFACCIÓN - FORMATO ${report.formatType}`, 14, 19);

  doc.setFontSize(8);
  doc.text(`Generado el: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}`, 140, 19);

  y = 35;

  // Title Box
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(report.formatTitle, 14, y);
  y += 8;

  // Executive Summary Cards
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(14, y, 55, 22, 2, 2, 'F');
  doc.roundedRect(77, y, 55, 22, 2, 2, 'F');
  doc.roundedRect(140, y, 56, 22, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL ENCUESTAS', 18, y + 6);
  doc.text('PROMEDIO GENERAL', 81, y + 6);
  doc.text('ÍNDICE CSAT (>=8)', 144, y + 6);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`${report.totalSurveys}`, 18, y + 16);
  
  // Score color
  if (report.overallAverage >= 8) {
    doc.setTextColor(16, 185, 129); // Green
  } else if (report.overallAverage >= 7) {
    doc.setTextColor(234, 179, 8); // Yellow
  } else {
    doc.setTextColor(239, 68, 68); // Red
  }
  doc.text(`${report.overallAverage} / 10`, 81, y + 16);

  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text(`${report.csatIndex}%`, 144, y + 16);

  y += 30;

  // Section Breakdown Table
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. Resumen por Sección de Evaluación', 14, y);
  y += 6;

  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(14, y, 182, 7, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('Sección', 18, y + 4.5);
  doc.text('Preguntas', 110, y + 4.5);
  doc.text('Promedio', 140, y + 4.5);
  doc.text('Satisfacción %', 168, y + 4.5);

  y += 7;

  report.sectionMetrics.forEach((sec, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, 7, 'F');
    }
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    // Shorten section title if too long
    const shortTitle = sec.sectionTitle.length > 55 ? sec.sectionTitle.substring(0, 52) + '...' : sec.sectionTitle;
    doc.text(shortTitle, 18, y + 4.5);
    doc.text(`${sec.totalQuestions}`, 115, y + 4.5);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`${sec.averageScore}/10`, 142, y + 4.5);
    doc.text(`${sec.csatPercentage}%`, 172, y + 4.5);

    y += 7;
  });

  y += 8;

  // Questions Detail Table
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. Detalle por Pregunta', 14, y);
  y += 6;

  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('N°', 16, y + 4.5);
  doc.text('Pregunta', 24, y + 4.5);
  doc.text('Promedio', 148, y + 4.5);
  doc.text('Alertas (<8)', 170, y + 4.5);

  y += 7;

  report.questionMetrics.forEach((q, idx) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, 10, 'F');
    }

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`${q.questionNumber}`, 16, y + 4);

    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(q.text, 120);
    doc.text(lines, 24, y + 4);

    doc.setFont('helvetica', 'bold');
    doc.text(`${q.averageScore}`, 152, y + 4);

    if (q.lowScoresCount > 0) {
      doc.setTextColor(220, 38, 38);
      doc.text(`${q.lowScoresCount}`, 178, y + 4);
    } else {
      doc.setTextColor(16, 185, 129);
      doc.text(`0`, 178, y + 4);
    }

    y += 10;
  });

  y += 10;

  // Motives for scores < 8
  if (report.allMotives.length > 0) {
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`3. Registro de Motivos e Inspecciones con Bajas Calificaciones (<8)`, 14, y);
    y += 6;

    report.allMotives.forEach((m, idx) => {
      if (y > 255) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(254, 242, 242); // light red
      doc.roundedRect(14, y, 182, 16, 1.5, 1.5, 'F');

      doc.setTextColor(185, 28, 28);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(`Pregunta ${m.questionNumber} - Calificación: ${m.score}/10 | Cliente: ${m.clientName}`, 18, y + 5);

      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'italic');
      const motiveLines = doc.splitTextToSize(`" ${m.motive} "`, 174);
      doc.text(motiveLines, 18, y + 10);

      y += 19;
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Página ${i} de ${pageCount} - Sistema de Evaluación de Encuestas SEDAPAL (GCFO0131 / GCFO0192)`, 14, 290);
  }

  doc.save(`Reporte_Oficial_${report.formatType}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
