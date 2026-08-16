import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, X, Send, Trash2, Plus, HelpCircle, ShieldAlert, Cpu } from 'lucide-react';

const RulesChatbot = () => {
  const { user, token } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'rules'
  
  // Rules database list
  const [rules, setRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  
  // Chatbot states
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', text: 'Hello! I am your AI Draft Analyst. Ask me anything about the draft rules, budgets, or roster targets!' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Admin Create Rule states
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  // Load chat history from localStorage on load or when user changes
  useEffect(() => {
    if (user) {
      const userId = user.id || user._id;
      try {
        const stored = localStorage.getItem(`chatbot_history_${userId}`);
        if (stored) {
          setChatHistory(JSON.parse(stored));
        } else {
          setChatHistory([
            { role: 'assistant', text: `Hello ${user.username || 'user'}! I am your AI Draft Analyst. Ask me anything about the draft rules, budgets, or roster targets!` }
          ]);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [user?.id, user?._id]);

  useEffect(() => {
    if (token && isOpen) {
      fetchRules();
    }
  }, [token, isOpen]);

  const fetchRules = async () => {
    setRulesLoading(true);
    try {
      const response = await fetch('/api/rules', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      }
    } catch (err) {
      console.error('Error fetching rules:', err);
    } finally {
      setRulesLoading(false);
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!query.trim() || chatLoading || !user) return;

    const userText = query.trim();
    const userId = user.id || user._id;
    
    const updatedHistoryWithUser = [...chatHistory, { role: 'user', text: userText }];
    setChatHistory(updatedHistoryWithUser);
    localStorage.setItem(`chatbot_history_${userId}`, JSON.stringify(updatedHistoryWithUser));

    setQuery('');
    setChatLoading(true);

    try {
      const response = await fetch('/api/ai/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: userText })
      });

      const data = await response.json();
      if (response.ok) {
        setChatHistory(prev => {
          const finalHistory = [...prev, { role: 'assistant', text: data.reply }];
          localStorage.setItem(`chatbot_history_${userId}`, JSON.stringify(finalHistory));
          return finalHistory;
        });
      } else {
        throw new Error(data.message || 'Chatbot failure.');
      }
    } catch (err) {
      setChatHistory(prev => {
        const finalHistory = [...prev, { role: 'assistant', text: `⚠️ Error: ${err.message}` }];
        localStorage.setItem(`chatbot_history_${userId}`, JSON.stringify(finalHistory));
        return finalHistory;
      });
    } finally {
      setChatLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (!user) return;
    const userId = user.id || user._id;
    if (window.confirm('Are you sure you want to clear your chat history?')) {
      const defaultHistory = [
        { role: 'assistant', text: `Hello ${user.username || 'user'}! I am your AI Draft Analyst. Ask me anything about the draft rules, budgets, or roster targets!` }
      ];
      setChatHistory(defaultHistory);
      localStorage.setItem(`chatbot_history_${userId}`, JSON.stringify(defaultHistory));
    }
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || adminLoading) return;

    setAdminLoading(true);
    try {
      const response = await fetch('/api/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: newTitle, content: newContent })
      });

      if (response.ok) {
        const saved = await response.json();
        setRules(prev => [...prev, saved]);
        setNewTitle('');
        setNewContent('');
        setActiveTab('rules');
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to create rule.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;
    try {
      const response = await fetch(`/api/rules/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setRules(prev => prev.filter(r => r._id !== id));
      } else {
        alert('Deletion failed.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-glow hover:scale-110 transition-all flex items-center justify-center border border-indigo-400"
        title="Open Draft Rule Book & AI Chatbot"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {/* Slide-in Assistant Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] z-40 rounded-2xl border border-white/10 glass-card flex flex-col overflow-hidden animate-fadeIn shadow-2xl">
          {/* Drawer Header */}
          <div className="bg-indigo-950/70 border-b border-white/5 p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <span className="font-extrabold text-sm text-white font-outfit">AUCTION-PRO Analyst</span>
              {activeTab === 'chat' && chatHistory.length > 1 && (
                <button
                  onClick={handleClearHistory}
                  className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-red-400 transition-colors"
                  title="Clear Chat History"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  activeTab === 'chat' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                AI Coach
              </button>
              <button
                onClick={() => setActiveTab('rules')}
                className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  activeTab === 'rules' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Rules ({rules.length})
              </button>
              {user.role === 'Admin' && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    activeTab === 'admin' ? 'bg-red-900/40 text-red-300 border border-red-500/20' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Manage
                </button>
              )}
            </div>
          </div>

          {/* Tab Content Panels */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 ">
            
            {/* Panel 1: Ask Assistant Chatbot */}
            {activeTab === 'chat' && (
              <div className="h-full flex flex-col justify-between">
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[350px]">
                  {chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl max-w-[85%] text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-indigo-600/90 text-white ml-auto rounded-tr-none'
                          : 'bg-white border border-gray-200 text-gray-900 mr-auto rounded-tl-none font-sans shadow-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                  {chatLoading && (
                    <p className="text-gray-500 text-[10px] animate-pulse">Analyst is writing a reply...</p>
                  )}
                </div>

                <form onSubmit={handleSendChat} className="border-t border-gray-150 pt-3 mt-3 flex gap-2">
                  <input
                    type="text"
                    required
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about draft limits, 11s, timers..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-900 text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* Panel 2: Rules Manual */}
            {activeTab === 'rules' && (
              <div className="space-y-4 h-full">
                {rulesLoading ? (
                  <p className="text-center text-xs text-gray-500">Loading rule book...</p>
                ) : rules.length === 0 ? (
                  <p className="text-center text-xs text-gray-500">No league rules configured yet.</p>
                ) : (
                  rules.map((rule) => (
                    <div key={rule._id} className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-1.5 relative group shadow-sm">
                      <h4 className="font-bold text-gray-950 text-xs font-outfit">{rule.title}</h4>
                      <p className="text-[11px] text-gray-600 leading-relaxed font-sans">{rule.content}</p>
                      
                      {user.role === 'Admin' && (
                        <button
                          onClick={() => handleDeleteRule(rule._id)}
                          className="absolute top-2 right-2 p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-650 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Panel 3: Admin Management Rules Add */}
            {activeTab === 'admin' && user.role === 'Admin' && (
              <form onSubmit={handleAddRule} className="space-y-4">
                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Publish League Rule</h3>
                
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase">Rule Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Budget Enforcements / Match Duration"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase">Rule Content</label>
                  <textarea
                    required
                    rows={4}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Provide detailed description of the draft rule logic..."
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 focus:outline-none text-xs resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={adminLoading}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded transition-all flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Publish to Database
                </button>
              </form>
            )}

          </div>
        </div>
      )}
    </>
  );
};

export default RulesChatbot;
