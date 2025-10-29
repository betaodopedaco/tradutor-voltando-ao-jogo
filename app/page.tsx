"use client";

import { useState, useRef } from "react";
import { 
  Upload, 
  FileText, 
  Languages, 
  Download,
  ArrowLeft,
  ArrowRight
} from "lucide-react";

interface PageData {
  page_number: number;
  original: string;
  translated: string;
}

interface TranslationResult {
  filename: string;
  total_pages: number;
  pages: PageData[];
  source_lang: string;
  target_lang: string;
}

export default function TradutorIA() {
  const [file, setFile] = useState<File | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("pt");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const languages = [
    { code: "en", name: "Inglês" },
    { code: "es", name: "Espanhol" },
    { code: "fr", name: "Francês" },
    { code: "de", name: "Alemão" },
    { code: "it", name: "Italiano" },
    { code: "pt", name: "Português" },
    { code: "ja", name: "Japonês" },
    { code: "ko", name: "Coreano" },
    { code: "zh", name: "Chinês" },
    { code: "ru", name: "Russo" }
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleTranslate = async () => {
    if (!file) {
      alert("Por favor, selecione um arquivo");
      return;
    }

    setIsTranslating(true);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("source_lang", sourceLang);
    formData.append("target_lang", targetLang);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Erro na tradução");
      }

      const data: TranslationResult = await response.json();
      setResult(data);
      setCurrentPage(1);
    } catch (error: any) {
      alert("Erro ao traduzir documento: " + error.message);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    
    const content = result.pages.map(page => 
      `PÁGINA ${page.page_number}\n\nORIGINAL (${result.source_lang}):\n${page.original}\n\nTRADUZIDO (${result.target_lang}):\n${page.translated}\n\n${"=".repeat(50)}\n`
    ).join('\n');
    
    const blob = new Blob([content], { type: "text/plain; charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `traduzido_${result.filename}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentPageData = result?.pages.find(p => p.page_number === currentPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🚀 Tradutor IA
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Traduza documentos com IA contextual
          </p>
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <FileText className="w-5 h-5" />
            <span>Suporte: PDF, DOCX, TXT</span>
            <Languages className="w-5 h-5 ml-4" />
            <span>10 idiomas disponíveis</span>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Languages className="w-4 h-4 inline mr-2" />
                Idioma de Origem
              </label>
              <select 
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Languages className="w-4 h-4 inline mr-2" />
                Idioma de Destino
              </label>
              <select 
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center mb-6 hover:border-gray-400 transition-colors">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.docx,.txt"
              className="hidden"
            />
            
            <div className="text-gray-400 mb-4">
              <Upload className="w-16 h-16 mx-auto" />
            </div>
            
            <p className="text-lg font-medium text-gray-700 mb-2">
              {file ? (
                <span className="text-green-600">✓ {file.name}</span>
              ) : (
                "Arraste ou clique para selecionar arquivo"
              )}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              PDF, Word (.docx) ou Texto (.txt) • Máx. 10MB
            </p>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
            >
              <Upload className="w-4 h-4" />
              Selecionar Arquivo
            </button>
          </div>

          <button
            onClick={handleTranslate}
            disabled={!file || isTranslating}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isTranslating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Traduzindo com IA...
              </>
            ) : (
              <>
                🚀 Traduzir Documento
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Tradução Concluída 🎉
                </h2>
                <p className="text-gray-600">
                  {result.filename} • {languages.find(l => l.code === result.source_lang)?.name} → {languages.find(l => l.code === result.target_lang)?.name} • {result.total_pages} páginas
                </p>
              </div>
              
              <button
                onClick={handleDownload}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Completo
              </button>
            </div>

            {/* Page Navigation */}
            <div className="flex justify-between items-center mb-6 bg-gray-50 p-4 rounded-lg">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="bg-white border border-gray-300 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Anterior
              </button>
              
              <span className="font-medium text-gray-700">
                Página {currentPage} de {result.total_pages}
              </span>
              
              <button
                onClick={() => setCurrentPage(Math.min(result.total_pages, currentPage + 1))}
                disabled={currentPage === result.total_pages}
                className="bg-white border border-gray-300 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-2"
              >
                Próxima
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Texto Original ({languages.find(l => l.code === result.source_lang)?.name})
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-gray-800 text-sm leading-relaxed">
                    {currentPageData?.original}
                  </pre>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Texto Traduzido ({languages.find(l => l.code === result.target_lang)?.name})
                </h3>
                <div className="bg-blue-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-gray-800 text-sm leading-relaxed">
                    {currentPageData?.translated}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
