import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import JsonEditor from '@/components/JsonEditor';

export const QuestionManager = () => {
  const [filters, setFilters] = useState({ subject: '', examType: '', examYear: '' });
  const [options, setOptions] = useState([]);
  const [questions, setQuestions] = useState([]); // Current state in editor
  const [originalQuestions, setOriginalQuestions] = useState([]); // Database reference state
  const [loading, setLoading] = useState(false);

  const API_URL = 'https://past-questions-api.onrender.com/api/questions';

  // 1. Fetch metadata for dropdowns
  const fetchMetadata = async () => {
    try {
      const res = await axios.get(`${API_URL}/subjects-years`);
      setOptions(res.data);
    } catch (err) {
      console.error("Error fetching metadata", err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  // 2. Filter Derivations
  const uniqueSubjects = useMemo(() => [...new Set(options.map(o => o.subject))], [options]);
  
  const availableExamTypes = useMemo(() => 
    options.filter(opt => opt.subject === filters.subject).map(opt => opt.examType),
    [options, filters.subject]
  );

  const availableYears = useMemo(() => 
    options.find(opt => opt.subject === filters.subject && opt.examType === filters.examType)?.years || [],
    [options, filters.subject, filters.examType]
  );

  // 3. Fetch specific question pack
  const fetchQuestions = async () => {
    setLoading(true);
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== '')
    );
    const params = new URLSearchParams(activeFilters).toString();
    
    try {
      const res = await axios.get(`${API_URL}?${params}`);
      const data = res.data.data;
      setQuestions(data);
      // Deep copy to prevent reference sharing
      setOriginalQuestions(JSON.parse(JSON.stringify(data)));
    } catch (err) {
      alert("Fetch error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Dirty Checking Logic: Only send what changed
  const getUpdates = () => {
    return questions.filter((current) => {
      const original = originalQuestions.find(q => q._id === current._id);
      return JSON.stringify(current) !== JSON.stringify(original);
    });
  };

  const dirtyCount = getUpdates().length;

  // 5. Save Changes
  const handleSave = async () => {
    const updates = getUpdates();
    if (updates.length === 0) return alert("No changes detected.");

    try {
      setLoading(true);
      const res = await axios.patch(`${API_URL}/bulk`, { updates });
      alert(`Success! Updated ${res.data.modified} questions.`);
      // Sync original state with new saved state
      setOriginalQuestions(JSON.parse(JSON.stringify(questions)));
    } catch (err) {
      alert("Update failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // 6. Delete Entire Pack
  const handleDeletePack = async () => {
    if (!questions.length) return;
    const confirm = window.confirm(`Delete all ${questions.length} questions in this pack forever?`);
    if (!confirm) return;

    try {
      setLoading(true);
      const ids = questions.map(q => q._id);
      await axios.delete(`${API_URL}/bulk`, { data: { ids } });
      alert("Pack deleted successfully.");
      setQuestions([]);
      setOriginalQuestions([]);
      fetchMetadata(); // Refresh dropdowns
    } catch (err) {
      alert("Delete failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Question Pack Manager</h2>
      
      {/* FILTER BAR */}
      <div className="flex flex-wrap gap-4 mb-6 bg-transparent p-4 rounded items-end shadow-sm">
        <div className="flex flex-col bg-transparent">
          <label className="text-xs font-bold uppercase text-gray-500 mb-1">Subject</label>
          <select 
            className="p-2 border rounded bg-background min-w-[150px]"
            value={filters.subject}
            onChange={(e) => setFilters({ subject: e.target.value, examType: '', examYear: '' })}
          >
            <option value="" className='bg-transparent'>All Subjects</option>
            {uniqueSubjects.map(s => <option key={s} className='bg-transparent' value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-bold uppercase text-gray-500 mb-1">Exam Type</label>
          <select 
            className="p-2 border rounded bg-background disabled:bg-gray-200 min-w-[150px]"
            disabled={!filters.subject}
            value={filters.examType}
            onChange={(e) => setFilters({ ...filters, examType: e.target.value, examYear: '' })}
          >
            <option value="">Select Type</option>
            {availableExamTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-bold uppercase text-gray-500 mb-1">Year</label>
          <select 
            className="p-2 border rounded bg-background disabled:bg-gray-200 min-w-[120px]"
            disabled={!filters.examType}
            value={filters.examYear}
            onChange={(e) => setFilters({ ...filters, examYear: e.target.value })}
          >
            <option value="">Select Year</option>
            {availableYears.sort((a,b) => b-a).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        
        <button 
          onClick={fetchQuestions}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 h-[42px] disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Search Pack'}
        </button>
      </div>

      {/* EDITOR SECTION */}
      {questions.length > 0 ? (
        <div className="mt-4 space-y-4">
          <div className="flex justify-between items-center bg-white p-4 border rounded shadow-sm">
            <div>
              <p className="text-sm text-gray-600">
                Viewing: <span className="font-bold text-black">{filters.subject} {filters.examType} {filters.examYear}</span>
              </p>
              <p className="text-xs text-blue-600 font-semibold uppercase mt-1">
                {dirtyCount} unsaved changes
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={handleDeletePack}
                className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded hover:bg-red-600 hover:text-white transition-all"
              >
                Delete Pack
              </button>
              <button 
                onClick={handleSave}
                disabled={dirtyCount === 0 || loading}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md"
              >
                Save {dirtyCount} Changes
              </button>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden bg-white shadow-lg">
            <JsonEditor 
              value={JSON.stringify(questions, null, 2)} 
              onChange={(value) => {
                try {
                  const parsed = JSON.parse(value);
                  setQuestions(parsed);
                } catch (e) {
                  // Silently handle invalid JSON while typing
                }
              }} 
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-xl text-gray-400">
          Search for a subject, type, and year to load the question pack editor.
        </div>
      )}
    </div>
  );
};