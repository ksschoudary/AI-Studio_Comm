/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Info, 
  Globe, 
  MapPin, 
  ChevronRight, 
  Loader2,
  ArrowLeft,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { SentimentMeter } from './components/SentimentMeter';
import { getCommoditySentiment, SentimentData } from './services/gemini';
import ReactMarkdown from 'react-markdown';

const COMMODITIES = ['Wheat', 'Cashew', 'Maize', 'Chana', 'Sugar'];

export default function App() {
  const [context, setContext] = useState<'India' | 'Global'>('India');
  const [selectedCommodity, setSelectedCommodity] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [sentimentData, setSentimentData] = useState<Record<string, SentimentData>>({});
  const [error, setError] = useState<string | null>(null);
  const [expandedDriver, setExpandedDriver] = useState<number | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const fetchSentiment = async (commodity: string, ctx: 'India' | 'Global', isPrefetch = false) => {
    if (!isPrefetch) setLoading(true);
    setError(null);
    try {
      const data = await getCommoditySentiment(commodity, ctx);
      setSentimentData(prev => ({ ...prev, [`${commodity}-${ctx}`]: data }));
    } catch (err: any) {
      if (!isPrefetch) {
        console.error(err);
        let message = "An unexpected error occurred while analyzing market sentiment.";
        if (err.message?.includes("API_KEY")) {
          message = "Gemini API Key is missing or invalid.";
        } else if (err.message?.includes("network") || err.message?.includes("fetch")) {
          message = "Network error: Unable to reach the AI service.";
        } else if (err.message?.includes("429")) {
          message = "Rate limit exceeded. Please wait.";
        } else {
          message = `Error: ${err.message}`;
        }
        setError(message);
      }
    } finally {
      if (!isPrefetch) setLoading(false);
    }
  };

  // Pre-fetch all commodities on load and then start a background refresh cycle
  useEffect(() => {
    const initialFetch = async () => {
      for (const commodity of COMMODITIES) {
        await fetchSentiment(commodity, context, true);
      }
    };
    initialFetch();
  }, [context]);

  // Background refresh cycle: updates one commodity every 45 seconds to stay within rate limits
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (refreshIndex + 1) % COMMODITIES.length;
      setRefreshIndex(nextIndex);
      fetchSentiment(COMMODITIES[nextIndex], context, true);
    }, 45000); 

    return () => clearInterval(interval);
  }, [refreshIndex, context]);

  const handleCommodityClick = (commodity: string) => {
    setSelectedCommodity(commodity);
    setExpandedDriver(null);
    if (!sentimentData[`${commodity}-${context}`]) {
      fetchSentiment(commodity, context);
    }
  };

  const currentData = selectedCommodity ? sentimentData[`${selectedCommodity}-${context}`] : null;

  return (
    <div className="min-h-screen bg-[#0F172A] font-sans text-slate-200">
      {/* Market Ticker */}
      <div className="bg-[#1E293B] text-emerald-400 py-2.5 overflow-hidden whitespace-nowrap border-b border-white/5 shadow-2xl relative z-40">
        <div className="flex animate-marquee gap-16 items-center">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-16 items-center">
              {COMMODITIES.map(name => {
                const data = sentimentData[`${name}-${context}`];
                const score = data?.current.score ?? (name === 'Wheat' ? 72 : name === 'Sugar' ? 12 : name === 'Chana' ? -45 : name === 'Maize' ? 58 : 0);
                const label = data?.current.label ?? (score > 20 ? 'Bullish' : score < -20 ? 'Bearish' : 'Neutral');
                const colorClass = score > 20 ? 'bg-emerald-500' : score < -20 ? 'bg-red-500' : 'bg-amber-500';
                const glowClass = score > 20 ? 'shadow-[0_0_8px_rgba(16,185,129,0.8)]' : score < -20 ? 'shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'shadow-[0_0_8px_rgba(245,158,11,0.8)]';
                
                return (
                  <span key={name} className="text-[10px] font-mono uppercase tracking-[0.2em] flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${colorClass} animate-pulse ${glowClass}`}></span>
                    {name}: <span className="text-white font-bold">{score > 0 ? '+' : ''}{score}</span> ({label})
                  </span>
                );
              })}
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400 italic">
                Sources: Hindu Business Line • Economic Times • Financial Express • Krishi Jagran • iGrain
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0F172A]/80 backdrop-blur-xl border-b border-white/10 px-8 py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <TrendingUp size={24} strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl font-bold tracking-tight text-white">Commodity <span className="text-emerald-400 italic">Intelligence</span></h1>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[8px] font-bold text-emerald-500 uppercase tracking-widest animate-pulse">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                  Live
                </div>
              </div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-bold">Strategic Multi-Horizon Analysis</p>
            </div>
          </div>

          <div className="flex bg-slate-800 p-1 rounded-full border border-white/10">
            <button
              onClick={() => setContext('India')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold transition-all ${
                context === 'India' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapPin size={14} />
              India
            </button>
            <button
              onClick={() => setContext('Global')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold transition-all ${
                context === 'Global' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe size={14} />
              Global
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-16">
        <AnimatePresence mode="wait">
          {!selectedCommodity ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-16"
            >
              {/* Hero Section */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h2 className="text-6xl font-serif font-bold leading-[1.1] tracking-tight text-white">
                    Strategic <br />
                    <span className="italic text-emerald-400">Market Pulse.</span>
                  </h2>
                  <p className="text-xl text-slate-400 leading-relaxed max-w-xl">
                    High-fidelity sentiment analysis across three horizons. We scan policy, weather, and trade data to deliver executive-grade market intelligence.
                  </p>
                  <div className="flex gap-4 pt-4">
                    <div className="px-5 py-3 bg-slate-800/50 rounded-2xl border border-white/5 flex flex-col backdrop-blur-sm">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 mb-1">Search Universe</span>
                      <span className="text-sm font-bold text-white">Policy, Weather, Trade</span>
                    </div>
                    <div className="px-5 py-3 bg-slate-800/50 rounded-2xl border border-white/5 flex flex-col backdrop-blur-sm">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 mb-1">Horizons</span>
                      <span className="text-sm font-bold text-white">Historical, Current, Long-term</span>
                    </div>
                  </div>
                </div>
                <div className="hidden lg:block relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-[40px] -z-10 transform rotate-3 blur-2xl"></div>
                  <div className="bg-slate-800/50 backdrop-blur-xl p-8 border border-white/10 rounded-[40px] shadow-2xl">
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Market Trend Index</span>
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        Live Analysis
                      </span>
                    </div>
                    <div className="space-y-6">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${30 + i * 20}%` }}
                              transition={{ duration: 1, delay: i * 0.2 }}
                              className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            ></motion.div>
                          </div>
                          <div className="flex-1 h-4 bg-slate-700/50 rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {COMMODITIES.map((commodity) => (
                  <CommodityCard
                    key={commodity}
                    name={commodity}
                    score={sentimentData[`${commodity}-${context}`]?.current.score}
                    onClick={() => handleCommodityClick(commodity)}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="max-w-6xl mx-auto"
            >
              <button
                onClick={() => setSelectedCommodity(null)}
                className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors mb-12 group font-bold text-sm uppercase tracking-widest"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
              </button>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-6">
                  <div className="relative">
                    <Loader2 className="animate-spin text-emerald-500" size={64} strokeWidth={1} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-xl font-serif italic text-white">Synthesizing Market Intelligence...</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Multi-Horizon Analysis for {selectedCommodity}</p>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 p-12 rounded-[40px] flex flex-col items-center text-center shadow-2xl">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6">
                    <AlertCircle size={32} />
                  </div>
                  <h3 className="text-white font-serif text-2xl font-bold mb-3">Analysis Interrupted</h3>
                  <p className="text-slate-400 mb-8 max-w-md">{error}</p>
                  <button 
                    onClick={() => fetchSentiment(selectedCommodity, context)}
                    className="bg-emerald-500 text-white px-8 py-3 rounded-full font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Retry Analysis
                  </button>
                </div>
              ) : currentData ? (
                <div className="space-y-12">
                  <div className="flex flex-col lg:flex-row gap-12 items-start">
                    <div className="flex-1 space-y-12">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <span className="px-3 py-1 bg-slate-800 border border-white/10 rounded text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                            {context} Market
                          </span>
                          <span className="px-3 py-1 bg-slate-800 border border-white/10 rounded text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Executive Report
                          </span>
                        </div>
                        <h2 className="text-7xl font-serif font-bold tracking-tighter text-white">{selectedCommodity}</h2>
                      </div>

                      {/* Multi-Horizon Timeline */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                          { label: 'Historical', data: currentData.historical, period: 'Last 6 Months' },
                          { label: 'Current', data: currentData.current, period: 'Immediate' },
                          { label: 'Long-term', data: currentData.longTerm, period: '1-6 Months' }
                        ].map((horizon, idx) => (
                          <div key={idx} className="bg-slate-800/30 border border-white/5 p-6 rounded-3xl space-y-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">{horizon.label}</h4>
                                <p className="text-[10px] text-emerald-400 font-bold">{horizon.period}</p>
                              </div>
                              <div className={`text-xs font-bold px-2 py-1 rounded ${
                                horizon.data.score > 0 ? 'text-emerald-400 bg-emerald-400/10' : 
                                horizon.data.score < 0 ? 'text-red-400 bg-red-400/10' : 'text-slate-400 bg-slate-400/10'
                              }`}>
                                {horizon.data.score > 0 ? '+' : ''}{horizon.data.score}
                              </div>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed font-medium italic">"{horizon.data.summary}"</p>
                            <div className="h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${horizon.data.score > 0 ? 'bg-emerald-500' : horizon.data.score < 0 ? 'bg-red-500' : 'bg-slate-500'}`}
                                style={{ width: `${Math.abs(horizon.data.score)}%`, marginLeft: horizon.data.score < 0 ? '0' : 'auto' }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-8">
                        <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Intelligence Drivers & Evidence</h3>
                        <div className="space-y-4">
                          {currentData.drivers.map((driver, idx) => (
                            <div key={idx} className="bg-slate-800/50 border border-white/5 rounded-[32px] overflow-hidden transition-all hover:border-emerald-500/30">
                              <button 
                                onClick={() => setExpandedDriver(expandedDriver === idx ? null : idx)}
                                className="w-full p-8 text-left flex items-center justify-between group"
                              >
                                <div className="flex items-center gap-6">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                    driver.impact === 'positive' ? 'bg-emerald-500/10 text-emerald-500' : 
                                    driver.impact === 'negative' ? 'bg-red-500/10 text-red-500' : 'bg-slate-500/10 text-slate-500'
                                  }`}>
                                    {driver.impact === 'positive' ? <TrendingUp size={24} /> : driver.impact === 'negative' ? <TrendingDown size={24} /> : <Info size={24} />}
                                  </div>
                                  <div>
                                    <h4 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{driver.factor}</h4>
                                    <p className="text-sm text-slate-400">{driver.description}</p>
                                  </div>
                                </div>
                                <div className={`w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-slate-500 transition-transform ${expandedDriver === idx ? 'rotate-180 bg-emerald-500 text-white border-emerald-500' : ''}`}>
                                  <ChevronRight size={16} className="rotate-90" />
                                </div>
                              </button>
                              <AnimatePresence>
                                {expandedDriver === idx && (
                                  <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="px-8 pb-8"
                                  >
                                    <div className="pt-4 border-t border-white/5">
                                      <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
                                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-2">
                                          <AlertCircle size={12} />
                                          Supporting Evidence & News Factors
                                        </h5>
                                        <p className="text-slate-300 text-sm leading-relaxed font-mono">
                                          {driver.evidence}
                                        </p>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="w-full lg:w-96 shrink-0 space-y-8">
                      <div className="bg-slate-800/50 backdrop-blur-xl p-10 border border-white/10 rounded-[40px] flex flex-col items-center shadow-2xl">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-8">Current Sentiment Index</h3>
                        <SentimentMeter score={currentData.current.score} size={280} />
                        
                        <div className="w-full mt-10 space-y-6">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            <span>Bearish</span>
                            <span>Bullish</span>
                          </div>
                          <div className="h-1 w-full bg-slate-700 rounded-full overflow-hidden flex">
                            <div className="h-full bg-red-500" style={{ width: '33%' }}></div>
                            <div className="h-full bg-slate-600" style={{ width: '34%' }}></div>
                            <div className="h-full bg-emerald-500" style={{ width: '33%' }}></div>
                          </div>
                          <p className="text-center text-[10px] text-slate-500 font-medium italic">
                            Real-time index based on current market grounding.
                          </p>
                        </div>
                      </div>

                      {currentData.sources.length > 0 && (
                        <div className="bg-slate-800/50 backdrop-blur-xl p-8 border border-white/10 rounded-[40px]">
                          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                            <Info size={14} />
                            Verified Intelligence
                          </h3>
                          <div className="space-y-3">
                            {currentData.sources.slice(0, 4).map((source, idx) => (
                              <a 
                                key={idx}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-slate-900/30 hover:border-emerald-500/50 hover:bg-slate-800 transition-all group"
                              >
                                <span className="text-xs font-bold text-slate-300 truncate pr-4">{source.title}</span>
                                <ExternalLink size={12} className="text-slate-500 group-hover:text-emerald-400 shrink-0" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-7xl mx-auto px-8 py-20 border-t border-white/5 text-center space-y-6">
        <div className="flex justify-center gap-12 items-center opacity-20 grayscale hover:grayscale-0 transition-all duration-700">
          <span className="font-serif italic font-bold text-2xl text-white">Policy</span>
          <span className="font-serif italic font-bold text-2xl text-white">Weather</span>
          <span className="font-serif italic font-bold text-2xl text-white">Trade</span>
          <span className="font-serif italic font-bold text-2xl text-white">Logistics</span>
        </div>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">
          Executive Commodity Intelligence Dashboard • Powered by Gemini AI
        </p>
      </footer>
    </div>
  );
}

function CommodityCard({ name, score, onClick }: { name: string; score?: number; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ y: -12, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-slate-800/40 backdrop-blur-xl p-10 text-left group transition-all hover:shadow-[0_20px_50px_rgba(16,185,129,0.1)] hover:border-emerald-500/30 border border-white/10 rounded-[40px] relative overflow-hidden"
    >
      {score !== undefined && (
        <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl font-mono font-bold text-xs ${
          score > 20 ? 'bg-emerald-500 text-white' : score < -20 ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
        }`}>
          {score > 0 ? '+' : ''}{score}
        </div>
      )}
      <div className="flex justify-between items-start mb-12">
        <div className="space-y-2">
          <h3 className="text-4xl font-serif font-bold text-white group-hover:text-emerald-400 transition-all">{name}</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Market Intelligence</p>
        </div>
        <div className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center text-slate-500 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-all shadow-lg">
          <ChevronRight size={24} strokeWidth={2} />
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="flex -space-x-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border-2 border-[#0F172A]"></div>
            <div className="w-6 h-6 rounded-full bg-teal-500/20 border-2 border-[#0F172A]"></div>
            <div className="w-6 h-6 rounded-full bg-slate-700 border-2 border-[#0F172A]"></div>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Multi-Horizon Analysis</span>
        </div>
        <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            whileHover={{ width: '100%' }}
            transition={{ duration: 0.5 }}
            className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
          ></motion.div>
        </div>
      </div>
    </motion.button>
  );
}
