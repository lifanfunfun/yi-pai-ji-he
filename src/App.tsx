/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Laptop, 
  Terminal, 
  Copy, 
  Check, 
  Code2, 
  FolderGit2, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  FileCode,
  ArrowRight,
  ShieldCheck,
  Zap,
  Play
} from 'lucide-react';

export default function App() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [isCopiedTemplate, setIsCopiedTemplate] = useState(false);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyTemplate = () => {
    const template = `【项目介绍】
我想做的应用是：${projectDesc || '（请简述应用名称或目标）'}

【已完成部分】
已完成的功能：
1. 
2. 

【未完成/卡住的部分】
接下来需要实现：
1. 
2. 

【核心代码（如 App.tsx）】
\`\`\`tsx
${codeSnippet || '// 在这里粘贴代码'}
\`\`\``;
    navigator.clipboard.writeText(template);
    setIsCopiedTemplate(true);
    setTimeout(() => setIsCopiedTemplate(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="font-semibold text-base text-white tracking-wide">项目接力与开发中心</h1>
              <p className="text-xs text-slate-400">Codex / 本地半成品项目无缝迁移与继续开发</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Zap className="w-3.5 h-3.5" />
              随时接手 · 额度充足
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 space-y-8">
        
        {/* Reassurance Banner */}
        <section className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                请放心：您的项目代码完全没有丢失！
              </h2>
              <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                既然刚才可以在本地 <code className="text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded font-mono">127.0.0.1:5178</code> 运行，说明 Codex 之前帮您生成的所有代码<strong>都完整保存在您电脑上的项目文件夹中</strong>。Codex 额度用完只是代表它的对话功能暂停，不会影响您电脑本地的文件。
              </p>
              <p className="text-slate-400 text-xs md:text-sm">
                因为我是云端 AI 助手，出于网络安全限制无法主动读取您电脑的私人磁盘；但只要您把代码或需求发在对话框，我立刻为您接着完成！
              </p>
            </div>
          </div>
        </section>

        {/* 3 Steps Guide */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            三步让我接手并继续完成：
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Step 1 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-sm">
                1
              </div>
              <h4 className="font-semibold text-white">找到您电脑上的项目文件夹</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                在您电脑中打开刚才运行 <code className="text-slate-200 font-mono">5178</code> 端口的文件夹（在 VS Code、WebStorm 或文件夹资源管理器中），找到 <code className="text-indigo-300 font-mono">src/App.tsx</code>（或 <code className="text-indigo-300 font-mono">App.vue / main.js</code>）。
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-sm">
                2
              </div>
              <h4 className="font-semibold text-white">复制代码或直接描述需求</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                直接把文件内容复制发送到对话中；或者直接告诉我：“这个项目是做什么的，已经实现了哪些，接下来需要做哪些功能”。
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-sm">
                3
              </div>
              <h4 className="font-semibold text-white">云端实时构建与上线</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                我会在当前工作区直接替您完成剩余功能，编写完整逻辑，修复错误，并在此处实时预览和运行！
              </p>
            </div>
          </div>
        </section>

        {/* Quick Paste & Format Helper */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-400" />
                快速整理信息（直接发送在对话框）：
              </h3>
              <p className="text-xs text-slate-400">您可以告诉我以下内容，我立即开始编写代码：</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                1. 您的项目是做什么的？（例如：外卖点餐、个人博客、数据报表、AI 工具等）
              </label>
              <input
                type="text"
                placeholder="例如：我做的是一个客户管理 CRM 系统，有客户列表和跟进记录..."
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                2. 已经写好的核心代码（例如 App.tsx 内容，可选）
              </label>
              <textarea
                rows={5}
                placeholder="可以直接把代码粘贴在这里或者直接贴在左下方的对话框里..."
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder:text-slate-600 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-400">
                准备好后，点击右侧复制，直接贴到对话框发给我即可！
              </span>
              <button
                onClick={copyTemplate}
                className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-sm"
              >
                {isCopiedTemplate ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>已复制模版，可直接发在对话框</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>一键打包并复制</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500">
        AI Studio 开发环境 · 全力为您完成项目开发
      </footer>
    </div>
  );
}
