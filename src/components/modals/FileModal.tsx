import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
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
    const resultRef = useRef<HTMLDivElement>(null);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setAnalysisResult(null);

        try {
            const result = await analyzeDocument(file.file_url);
            setAnalysisResult(result);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Помилка з'єднання зі ШІ";
            alert('Помилка: ' + message);
        }

        setIsAnalyzing(false);
    };

    const handleSavePdf = async () => {
        if (!analysisResult || !resultRef.current) return;

        setIsSavingPdf(true);

        try {
            // 1. Capture the analysis text area as an image
            const canvas = await html2canvas(resultRef.current, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');

            // 2. Create PDF
            const pdf = new jsPDF();
            const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
            const imgProps = pdf.getImageProperties(imgData);

            const margin = 15;
            const pdfImgWidth = pageWidth - (margin * 2);
            const pdfImgHeight = (imgProps.height * pdfImgWidth) / imgProps.width;

            // Header removed as per request

            // Add the capture image (moved up slightly)
            pdf.addImage(imgData, 'PNG', margin, 20, pdfImgWidth, pdfImgHeight);

            // Add original image on next page
            try {
                const response = await fetch(file.file_url);
                const blob = await response.blob();
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });

                pdf.addPage();
                pdf.text('Original Document:', margin, 20); // English to avoid encoding issues
                const xPos = (pageWidth - 180) / 2;
                pdf.addImage(base64, 'JPEG', xPos, 30, 180, 200, undefined, 'FAST');
            } catch (e) {
                console.warn("Original image skip", e);
            }

            const pdfName = `Analiz_${file.file_name.replace(/\.[^/.]+$/, '')}_${Date.now()}.pdf`;
            pdf.save(pdfName);

        } catch (error: any) {
            alert('Помилка при створенні PDF: ' + error.message);
        }
        setIsSavingPdf(false);
    };

    const handleDelete = () => {
        if (confirm('Видалити файл?')) {
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
                    <h3>Перегляд</h3>
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
                        {isAnalyzing ? '⏳ Аналіз...' : 'Отримати огляд'}
                    </button>
                )}

                {/* Analysis result */}
                {analysisResult && (
                    <div
                        ref={resultRef}
                        style={{
                            background: '#ffffff', // White background for better print
                            padding: '20px',
                            borderRadius: '0px',
                            border: '1px solid #e0e0e0',
                            marginTop: '10px',
                            color: '#000000'
                        }}
                    >
                        <h4 style={{ marginTop: 0, color: '#0057B8', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            📄 Результат аналізу
                        </h4>

                        <div style={{ lineHeight: '1.6', fontSize: '14px', fontFamily: 'Arial, sans-serif' }}>
                            <ReactMarkdown
                                components={{
                                    h2: ({ ...props }) => <h2 style={{ fontSize: '16px', color: '#0057B8', marginTop: '15px', marginBottom: '10px' }} {...props} />,
                                    ul: ({ ...props }) => <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }} {...props} />,
                                    li: ({ ...props }) => <li style={{ marginBottom: '5px', paddingLeft: '5px' }} {...props} />
                                }}
                            >
                                {analysisResult}
                            </ReactMarkdown>
                        </div>
                    </div>
                )}

                {/* Save Button */}
                {analysisResult && (
                    <button
                        className="external-link-btn"
                        style={{ marginTop: '15px' }}
                        onClick={handleSavePdf}
                        disabled={isSavingPdf}
                    >
                        {isSavingPdf ? '⏳ Збереження...' : '💾 Зберегти як PDF'}
                    </button>
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
                    🗑️ Видалити файл
                </button>
            </div>
        </div>
    );
};
