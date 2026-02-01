import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import type { UserFile } from '../../types';
import { analyzeDocument } from '../../utils/api';
import { renderPdf } from '../../services/pdf/pdfRenderer';
import { printCss } from '../../components/pdf/printCss';
import { supabase } from '../../supabaseClient';

interface FileModalProps {
    file: UserFile;
    onClose: () => void;
    onDelete: (fileId: number) => void;
    onSave: (file: UserFile) => void;
}

export const FileModal = ({ file, onClose, onDelete, onSave }: FileModalProps) => {
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

    const handleSaveToCloud = async () => {
        if (!analysisResult) return;

        setIsSavingPdf(true);

        try {
            const contentHtml = resultRef.current?.innerHTML || '';

            let imageHtml = '';
            try {
                const response = await fetch(file.file_url);
                const blob = await response.blob();
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
                imageHtml = `<img src="${base64}" class="original-document-img" alt="Original Document" style="max-width: 100%; height: auto; display: block; margin: 20px auto;" />`;
            } catch (e) {
                console.warn("Failed to load original image for PDF", e);
            }

            const fullHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>${printCss}</style>
                </head>
                <body>
                    <div class="analysis-container">
                        ${contentHtml}
                    </div>
                    ${imageHtml}
                </body>
                </html>
            `;

            const pdfBlob = await renderPdf(fullHtml);

            // New naming convention: Jobcenter_YYYY-MM-DD
            const dateStr = new Date().toISOString().split('T')[0];
            const timestamp = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
            const fileName = `Jobcenter_${dateStr}_${timestamp}.pdf`;
            const filePath = `${file.user_id}/${fileName}`;

            // 1. Trigger Download immediately
            const url = window.URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            // 2. Upload to Cloud
            const { error: uploadError } = await supabase.storage
                .from("documents")
                .upload(filePath, pdfBlob);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(filePath);

            const { data: dbData, error: dbError } = await supabase
                .from("user_files")
                .insert({
                    user_id: file.user_id,
                    file_name: fileName,
                    file_url: publicUrl,
                    file_type: "pdf",
                })
                .select()
                .single();

            if (dbError) throw dbError;

            if (dbData) {
                onSave(dbData);
                alert("Аналіз збережено та завантажено!");
                onClose();
            }

        } catch (error: any) {
            console.error(error);
            alert('PDF Save Failed: ' + error.message);
        } finally {
            setIsSavingPdf(false);
        }
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                            <h4 style={{ margin: 0, color: '#0057B8' }}>
                                📄 Результат аналізу
                            </h4>
                            <span style={{ fontSize: '12px', color: '#666' }}>
                                {new Date().toLocaleDateString('uk-UA')}
                            </span>
                        </div>

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
                        onClick={handleSaveToCloud}
                        disabled={isSavingPdf}
                    >
                        {isSavingPdf ? '⏳ Збереження...' : '💾 Зберегти в Аналізовані'}
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
