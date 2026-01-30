
import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Upload, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Play, 
  Download, 
  Trash2,
  Plus,
  Loader2,
  Info,
  ChevronRight,
  Filter,
  Globe,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { LiteratureEntry, Criterion, ModelType } from './types';
import { parsePubMedTxt } from './services/pubmedParser';
import { screenLiterature } from './services/geminiService';

export default function App() {
  const [entries, setEntries] = useState<LiteratureEntry[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([
    { id: '1', text: 'Study focus on deep learning application in ECG', type: 'Inclusion' },
    { id: '2', text: 'Published after 2015', type: 'Inclusion' },
    { id: '3', text: 'Case reports or small studies with n < 10', type: 'Exclusion' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentModel, setCurrentModel] = useState<ModelType>(ModelType.GEMINI_FLASH);
  const [useSearch, setUseSearch] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<LiteratureEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parsePubMedTxt(text);
        
        if (parsed.length === 0) {
          setError("未能在文件中找到有效的文献记录。请确保从 PubMed 导出时选择 'Format: Abstract' 或 'Format: PubMed' 的 .txt 文件。");
          setEntries([]);
        } else {
          setEntries(parsed);
          setSelectedEntry(parsed[0]);
        }
      } catch (err) {
        setError("解析文件时出错，请检查文件格式。");
        console.error(err);
      }
    };
    reader.readAsText(file);
    // Reset file input so same file can be uploaded again
    e.target.value = '';
  };

  const addCriterion = (type: 'Inclusion' | 'Exclusion') => {
    const newCriterion: Criterion = {
      id: Math.random().toString(36).substr(2, 9),
      text: '',
      type
    };
    setCriteria([...criteria, newCriterion]);
  };

  const updateCriterion = (id: string, text: string) => {
    setCriteria(criteria.map(c => c.id === id ? { ...c, text } : c));
  };

  const removeCriterion = (id: string) => {
    setCriteria(criteria.filter(c => c.id !== id));
  };

  const runScreening = async () => {
    if (entries.length === 0) return;
    setIsProcessing(true);
    setProgress(0);

    const updatedEntries = [...entries];
    
    for (let i = 0; i < updatedEntries.length; i++) {
      try {
        const result = await screenLiterature(
          updatedEntries[i], 
          criteria, 
          currentModel, 
          useSearch
        );
        updatedEntries[i] = { ...updatedEntries[i], screeningResult: result };
        setEntries([...updatedEntries]);
        setProgress(Math.round(((i + 1) / updatedEntries.length) * 100));
      } catch (error) {
        console.error(`Failed to screen entry ${i}:`, error);
      }
    }
    
    setIsProcessing(false);
  };

  const exportToCSV = () => {
    const headers = ['PMID', 'DOI', 'Title', 'Journal', 'Year', 'Decision', 'Reasoning'];
    const rows = entries.map(e => [
      e.pmid,
      e.doi,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.journal}"`,
      e.year,
      e.screeningResult?.decision || 'Not Screened',
      `"${e.screeningResult?.reasoning.replace(/"/g, '""') || ''}"`
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `screening_results_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const stats = useMemo(() => {
    const total = entries.length;
    const included = entries.filter(e => e.screeningResult?.decision === 'Include').length;
    const excluded = entries.filter(e => e.screeningResult?.decision === 'Exclude').length;
    const unsure = entries.filter(e => e.screeningResult?.decision === 'Unsure').length;
    const pending = entries.filter(e => !e.screeningResult).length;
    return { total, included, excluded, unsure, pending };
  }, [entries]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-teal-600 p-2 rounded-lg text-white">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">PubMed AI Screener</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Automated Systematic Review</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
             <button 
                onClick={() => setUseSearch(!useSearch)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${useSearch ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                title="Use Google Search to fetch missing information (Pro model only)"
             >
                <Globe size={14} /> Enhanced Web Search
             </button>
             <div className="w-px h-4 bg-slate-300 mx-1"></div>
             <select 
              className="bg-transparent border-none text-xs font-bold text-slate-600 focus:ring-0 cursor-pointer pr-8"
              value={currentModel}
              onChange={(e) => setCurrentModel(e.target.value as ModelType)}
            >
              <option value={ModelType.GEMINI_FLASH}>Gemini 3 Flash</option>
              <option value={ModelType.GEMINI_PRO}>Gemini 3 Pro</option>
            </select>
          </div>

          <button
            onClick={runScreening}
            disabled={isProcessing || entries.length === 0}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white px-5 py-2 rounded-md font-semibold transition-all shadow-sm"
          >
            {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} fill="currentColor" />}
            {isProcessing ? `${progress}%` : 'Start Screening'}
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-rose-50 border-b border-rose-100 px-6 py-3 flex items-center gap-3 text-rose-700 text-sm animate-in fade-in slide-in-from-top-2">
          <AlertTriangle size={18} className="shrink-0" />
          <p className="font-medium">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-600">
            <XCircle size={18} />
          </button>
        </div>
      )}

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">1. Import Data</h2>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-teal-400 transition-all group">
              <Upload className="text-slate-400 group-hover:text-teal-500 mb-2" size={32} />
              <span className="text-xs font-medium text-slate-500">Upload PubMed .txt</span>
              <p className="text-[10px] text-slate-400 mt-1">Format: Abstract or PubMed</p>
              <input type="file" className="hidden" accept=".txt" onChange={handleFileUpload} />
            </label>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">2. Screening Rules</h2>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded">INCLUSION</span>
                  <button onClick={() => addCriterion('Inclusion')} className="text-teal-600 hover:text-teal-700"><Plus size={16} /></button>
                </div>
                <div className="space-y-2">
                  {criteria.filter(c => c.type === 'Inclusion').map(c => (
                    <div key={c.id} className="group relative">
                      <textarea
                        value={c.text}
                        onChange={(e) => updateCriterion(c.id, e.target.value)}
                        className="w-full text-sm border-slate-200 rounded-md p-2 focus:ring-1 focus:ring-teal-500 min-h-[50px] pr-8"
                        placeholder="e.g. Focus on deep learning..."
                      />
                      <button onClick={() => removeCriterion(c.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">EXCLUSION</span>
                  <button onClick={() => addCriterion('Exclusion')} className="text-rose-600 hover:text-rose-700"><Plus size={16} /></button>
                </div>
                <div className="space-y-2">
                  {criteria.filter(c => c.type === 'Exclusion').map(c => (
                    <div key={c.id} className="group relative">
                      <textarea
                        value={c.text}
                        onChange={(e) => updateCriterion(c.id, e.target.value)}
                        className="w-full text-sm border-slate-200 rounded-md p-2 focus:ring-1 focus:ring-rose-500 min-h-[50px] pr-8"
                        placeholder="e.g. Case reports..."
                      />
                      <button onClick={() => removeCriterion(c.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-slate-50 border-t border-slate-200">
             <button 
               onClick={exportToCSV}
               disabled={entries.length === 0}
               className="w-full flex items-center justify-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 px-4 py-2 rounded-lg font-medium transition-all"
             >
               <Download size={18} /> Export CSV
             </button>
          </div>
        </aside>

        {/* Main Section */}
        <section className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
          {/* Stats Bar */}
          <div className="grid grid-cols-5 gap-px bg-slate-200 border-b border-slate-200 shrink-0">
            {Object.entries(stats).map(([key, val]) => (
              <div key={key} className="bg-white p-4 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{key}</p>
                <p className={`text-xl font-bold ${
                  key === 'included' ? 'text-teal-600' : 
                  key === 'excluded' ? 'text-rose-600' : 
                  key === 'unsure' ? 'text-amber-500' : 'text-slate-900'
                }`}>{val}</p>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {entries.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-6">
                <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center max-w-md text-center">
                  <div className="bg-slate-100 p-6 rounded-full mb-6">
                    <Upload size={48} className="text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700 mb-2">Ready for Screening</h3>
                  <p className="text-sm text-slate-500 mb-6">Please upload a <strong>.txt</strong> file exported from PubMed. For best results, use the <strong>Abstract</strong> or <strong>PubMed</strong> format.</p>
                  
                  <div className="bg-slate-50 rounded-xl p-4 w-full text-left border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Quick Steps:</p>
                    <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside">
                      <li>Search on PubMed.gov</li>
                      <li>Click <strong>Save</strong> button</li>
                      <li>Selection: <strong>All results</strong> (or as needed)</li>
                      <li>Format: <strong>Abstract</strong> or <strong>PubMed</strong></li>
                      <li>Click <strong>Create file</strong> and upload here.</li>
                    </ol>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase w-16">ID</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Title</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase w-32 text-center">Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr 
                        key={entry.id} 
                        className={`border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${selectedEntry?.id === entry.id ? 'bg-teal-50/50' : ''}`}
                        onClick={() => setSelectedEntry(entry)}
                      >
                        <td className="px-4 py-4 text-sm text-slate-400 font-mono">{entry.index}</td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">{entry.title}</p>
                          <p className="text-[11px] text-slate-500 mt-1">{entry.journal} • {entry.year}</p>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {entry.screeningResult ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight shadow-sm" style={{
                              backgroundColor: entry.screeningResult.decision === 'Include' ? '#f0fdf4' : entry.screeningResult.decision === 'Exclude' ? '#fef2f2' : '#fffbeb',
                              color: entry.screeningResult.decision === 'Include' ? '#166534' : entry.screeningResult.decision === 'Exclude' ? '#991b1b' : '#92400e'
                            }}>
                              {entry.screeningResult.decision}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-tight">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Detail Panel */}
        {selectedEntry && (
          <aside className="w-[480px] bg-white border-l border-slate-200 flex flex-col shrink-0">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Study Information</h2>
              <button onClick={() => setSelectedEntry(null)} className="text-slate-400 hover:text-slate-600"><XCircle size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <section>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Info size={14} /> Full Title
                  </h3>
                  {selectedEntry.doi && (
                    <a href={`https://doi.org/${selectedEntry.doi}`} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 flex items-center gap-1 text-[10px] font-bold">
                      DOI <ExternalLink size={10} />
                    </a>
                  )}
                </div>
                <p className="text-base font-semibold text-slate-900 leading-tight">{selectedEntry.title}</p>
                <p className="text-xs text-slate-500 mt-2 font-medium">{selectedEntry.authors}</p>
              </section>

              {selectedEntry.screeningResult && (
                <section className="bg-slate-50 rounded-xl p-5 border border-slate-100 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">AI Screening Result</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${
                        selectedEntry.screeningResult.decision === 'Include' ? 'bg-teal-600 text-white' : 
                        selectedEntry.screeningResult.decision === 'Exclude' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                      }`}>
                        {selectedEntry.screeningResult.decision === 'Include' ? <CheckCircle2 size={18} /> : 
                         selectedEntry.screeningResult.decision === 'Exclude' ? <XCircle size={18} /> : <AlertCircle size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-none">{selectedEntry.screeningResult.decision.toUpperCase()}</p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">Automatic Decision</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                       <p className="text-xs text-slate-700 italic leading-relaxed">
                        &quot;{selectedEntry.screeningResult.reasoning}&quot;
                      </p>
                    </div>

                    <div className="space-y-2 pt-2">
                      {selectedEntry.screeningResult.criteriaScores.map((score, i) => (
                        <div key={i} className="flex items-start justify-between gap-3 text-xs p-2 rounded hover:bg-slate-100 transition-colors">
                          <div className="flex-1">
                            <span className="font-bold text-slate-800">{score.criterion}</span>
                            <p className="text-[10px] text-slate-500 mt-0.5">{score.reason}</p>
                          </div>
                          {score.passed ? <CheckCircle2 size={14} className="text-teal-500 shrink-0" /> : <XCircle size={14} className="text-rose-500 shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Abstract</h3>
                {selectedEntry.abstract ? (
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedEntry.abstract}</p>
                ) : (
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-center">
                    <AlertCircle size={24} className="text-amber-500 mx-auto mb-2 opacity-50" />
                    <p className="text-xs text-amber-700 font-medium">No abstract found in text record. Enable Enhanced Search to let AI find it online.</p>
                  </div>
                )}
              </section>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PMID</h4>
                  <p className="text-xs font-mono text-slate-600">{selectedEntry.pmid || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">DOI</h4>
                  <p className="text-xs font-mono text-slate-600 truncate">{selectedEntry.doi || 'N/A'}</p>
                </div>
              </div>
            </div>
          </aside>
        )}
      </main>

      {/* Progress */}
      {isProcessing && (
        <div className="fixed bottom-8 right-8 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-6 min-w-[320px]">
          <div className="relative">
            <svg className="w-10 h-10">
              <circle className="text-slate-700" strokeWidth="3" stroke="currentColor" fill="transparent" r="18" cx="20" cy="20" />
              <circle className="text-teal-500 transition-all duration-300" strokeWidth="3" strokeDasharray={2 * Math.PI * 18} strokeDashoffset={2 * Math.PI * 18 * (1 - progress / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="18" cx="20" cy="20" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{progress}%</span>
          </div>
          <div>
            <h4 className="text-sm font-bold leading-none">Screening in progress</h4>
            <p className="text-[10px] text-slate-400 mt-1">Analyzing criteria with AI...</p>
          </div>
          <Loader2 className="animate-spin text-teal-500 ml-auto" size={20} />
        </div>
      )}
    </div>
  );
}
