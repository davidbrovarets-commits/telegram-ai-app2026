import { useState } from 'react';
import { jsPDF } from 'jspdf';
import type { UserFile } from '../../types';
import { analyzeDocument } from '../../utils/api';

interface FileModalProps {
    file: UserFile;
    onClose: () => void;
    onDelete: (fileId: number) => void;
}

export const FileModal = ({ file, onClose, onDelete }: FileModalProps) => {
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSavingPdf, setIsSavingPdf] = useState(false);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setAnalysisResult(null);

        try {
            const result = await analyzeDocument(file.file_url);
            setAnalysisResult(result);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Ühendus AI-ga ebaõnnestus';
            alert('Viga: ' + message);
        }

        setIsAnalyzing(false);
    };

    const handleSavePdf = async () => {
        if (!analysisResult) return;

        setIsSavingPdf(true);

        try {
            const pdf = new jsPDF();
            const pageWidth = pdf.internal.pageSize.getWidth();
            const margin = 15;
            const maxWidth = pageWidth - margin * 2;

            // Title
            pdf.setFontSize(18);
            pdf.setTextColor(0, 87, 184); // Ukrainian blue
            pdf.text('Аналіз документа', margin, 20);

            // Date
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
            const dateStr = new Date().toLocaleDateString('uk-UA', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            pdf.text(`Дата: ${dateStr}`, margin, 28);

            // Filename
            pdf.text(`Файл: ${file.file_name}`, margin, 34);

            // Divider line
            pdf.setDrawColor(186, 230, 253);
            pdf.line(margin, 40, pageWidth - margin, 40);

            // Analysis result
            pdf.setFontSize(11);
            pdf.setTextColor(0, 0, 0);

            // Split text into lines that fit the page width
            const lines = pdf.splitTextToSize(analysisResult, maxWidth);
            let yPosition = 50;

            for (const line of lines) {
                if (yPosition > 270) {
                    pdf.addPage();
                    yPosition = 20;
                }
                pdf.text(line, margin, yPosition);
                yPosition += 6;
            }

            // Try to add image on a new page
            try {
                const response = await fetch(file.file_url);
                const blob = await response.blob();
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });

                pdf.addPage();
                pdf.setFontSize(14);
                pdf.setTextColor(0, 87, 184);
                pdf.text('Оригінальний документ:', margin, 20);

                // Add image (centered, max 180mm wide, max 200mm tall)
                const imgWidth = 180;
                const imgHeight = 200;
                const xPos = (pageWidth - imgWidth) / 2;
                pdf.addImage(base64, 'JPEG', xPos, 30, imgWidth, imgHeight, undefined, 'FAST');
            } catch {
                // If image fails to load, just skip it
                console.log('Could not add image to PDF');
            }

            // Save the PDF
            const pdfName = `Analiz_${file.file_name.replace(/\.[^/.]+$/, '')}_${Date.now()}.pdf`;
            pdf.save(pdfName);

            alert('✅ PDF збережено!');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'PDF loomine ebaõnnestus';
            alert('Viga: ' + message);
        }

        setIsSavingPdf(false);
    };

    const handleDelete = () => {
        if (confirm('Kustutada fail?')) {
            onDelete(file.id);
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                onClick={e => e.stopPropagation()}
                style={{ maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
            >
                <div className="modal-header">
                    <h3>Перегляд (Vaade)</h3>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                {/* Image preview */}
                <div
                    style={{
                        background: '#f0f0f0',
                        borderRadius: '12px',
                        padding: '10px',
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '15px'
                    }}
                >
                    <img
                        src={file.file_url}
                        style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                        alt="Document"
                    />
                </div>

                {/* Analyze button */}
                {!analysisResult && (
                    <button
                        className="primary-btn"
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        style={{ background: 'linear-gradient(45deg, #0057B8, #60a5fa)', marginBottom: '10px' }}
                    >
                        {isAnalyzing ? '⏳ Analüüsin...' : '🤖 AI: Що це за документ?'}
                    </button>
                )}

                {/* Analysis result */}
                {analysisResult && (
                    <div
                        style={{
                            background: '#f0f9ff',
                            padding: '15px',
                            borderRadius: '12px',
                            border: '1px solid #bae6fd',
                            marginTop: '10px'
                        }}
                    >
                        <h4 style={{ marginTop: 0, color: '#0369a1' }}>💡 Результат аналізу:</h4>
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', fontSize: '0.9rem' }}>
                            {analysisResult}
                        </div>
                        <button
                            className="external-link-btn"
                            style={{ marginTop: '15px' }}
                            onClick={handleSavePdf}
                            disabled={isSavingPdf}
                        >
                            {isSavingPdf ? '⏳ Salvestamine...' : '💾 Зберегти як PDF'}
                        </button>
                    </div>
                )}

                <button
                    onClick={handleDelete}
                    style={{
                        marginTop: '20px',
                        background: 'none',
                        border: 'none',
                        color: 'red',
                        cursor: 'pointer'
                    }}
                >
                    🗑️ Видалити файл (Kustuta)
                </button>
            </div>
        </div>
    );
};
