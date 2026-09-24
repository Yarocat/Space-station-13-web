import React, { useState } from 'react';
import {
  Server,
  Play,
  Square,
  Globe,
  Users,
  Terminal,
  Settings,
  Wifi,
  X,
  Check,
  RefreshCw,
  Copy,
  Sliders,
  Cpu,
} from 'lucide-react';
import { DedicatedServerConfig } from '../types';

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverConfig: DedicatedServerConfig;
  onUpdateConfig: (config: DedicatedServerConfig) => void;
  onToggleServer: (running: boolean) => void;
  serverLogs: string[];
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  isOpen,
  onClose,
  serverConfig,
  onUpdateConfig,
  onToggleServer,
  serverLogs,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'config' | 'logs'>('status');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(
      `ws://${window.location.hostname}:${serverConfig.port}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl shadow-cyan-950/40 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2.5 rounded-xl text-white shadow-md ${
                serverConfig.isRunning
                  ? 'bg-emerald-600 shadow-emerald-900/40'
                  : 'bg-slate-700 shadow-slate-900/40'
              }`}
            >
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold font-mono text-slate-100">
                  Sector 13 Dedicated Server & Multiplayer Host
                </h2>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider ${
                    serverConfig.isRunning
                      ? 'bg-emerald-950 border border-emerald-500 text-emerald-400'
                      : 'bg-slate-800 border border-slate-700 text-slate-400'
                  }`}
                >
                  {serverConfig.isRunning ? 'ONLINE / LISTENING' : 'OFFLINE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Host a dedicated game server or connect directly with external clients
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`px-4 py-2 font-mono text-xs font-bold rounded-t-lg transition-all flex items-center space-x-2 ${
              activeTab === 'status'
                ? 'bg-slate-900 border-t-2 border-x border-cyan-500 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>Server Status & Lobby</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 font-mono text-xs font-bold rounded-t-lg transition-all flex items-center space-x-2 ${
              activeTab === 'config'
                ? 'bg-slate-900 border-t-2 border-x border-cyan-500 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configuration & Gamemode</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 font-mono text-xs font-bold rounded-t-lg transition-all flex items-center space-x-2 ${
              activeTab === 'logs'
                ? 'bg-slate-900 border-t-2 border-x border-cyan-500 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Server Console & Logs</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: STATUS & LOBBY */}
          {activeTab === 'status' && (
            <div className="space-y-6">
              {/* Server Host Bar */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-mono text-sm font-bold text-slate-100 flex items-center space-x-2">
                    <span>{serverConfig.serverName}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                      Map: {serverConfig.mapName}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-1 flex items-center space-x-3">
                    <span>Port: {serverConfig.port}</span>
                    <span>•</span>
                    <span>Tick Rate: {serverConfig.tickRate} TPS</span>
                    <span>•</span>
                    <span>Mode: {serverConfig.gameMode}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => onToggleServer(!serverConfig.isRunning)}
                    className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shadow-lg transition-all ${
                      serverConfig.isRunning
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                    }`}
                  >
                    {serverConfig.isRunning ? (
                      <>
                        <Square className="w-4 h-4 fill-current" />
                        <span>Halt Server</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>Launch Dedicated Server</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Connection Endpoint Box */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1 font-semibold">
                  Direct Client Connection Endpoint:
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={`ws://localhost:${serverConfig.port}`}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-cyan-300 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg font-mono text-xs text-slate-200 flex items-center space-x-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Connected Crew Members Lobby */}
              <div>
                <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold mb-3 flex items-center space-x-1.5">
                  <Users className="w-4 h-4" />
                  <span>
                    Connected Station Crew ({serverConfig.connectedPlayers.length} /{' '}
                    {serverConfig.maxPlayers})
                  </span>
                </h3>

                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Player / Character</th>
                        <th className="p-3">Assigned Role</th>
                        <th className="p-3">Species</th>
                        <th className="p-3">Ping Latency</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {serverConfig.connectedPlayers.map((player) => (
                        <tr key={player.id} className="hover:bg-slate-900/50">
                          <td className="p-3 font-bold text-slate-100 flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                            <span>{player.name}</span>
                          </td>
                          <td className="p-3 text-cyan-300">{player.job}</td>
                          <td className="p-3 text-slate-300">{player.species}</td>
                          <td className="p-3 text-slate-400">{player.ping} ms</td>
                          <td className="p-3">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONFIGURATION & GAMEMODE */}
          {activeTab === 'config' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                    Station Host Server Name
                  </label>
                  <input
                    type="text"
                    value={serverConfig.serverName}
                    onChange={(e) =>
                      onUpdateConfig({ ...serverConfig, serverName: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                      Active Station Map
                    </label>
                    <select
                      value={serverConfig.mapName}
                      onChange={(e) =>
                        onUpdateConfig({ ...serverConfig, mapName: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="BoxStation">BoxStation (TGStation Classic)</option>
                      <option value="MetaStation">MetaStation (Expanded)</option>
                      <option value="DeltaStation">DeltaStation (4-Quadrant)</option>
                      <option value="KiloStation">KiloStation (Asteroid)</option>
                      <option value="Sector 13">Sector 13 (Griefly)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                      Game Mode
                    </label>
                    <select
                      value={serverConfig.gameMode}
                      onChange={(e) =>
                        onUpdateConfig({ ...serverConfig, gameMode: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="Extended">Extended (Peaceful Sandbox)</option>
                      <option value="Secret">Secret (Random Hazard)</option>
                      <option value="Traitor">Traitor (Syndicate Infiltrators)</option>
                      <option value="Atmospheric Disaster">Atmospheric Disaster</option>
                      <option value="Revolution">Revolution</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                      Port
                    </label>
                    <input
                      type="number"
                      value={serverConfig.port}
                      onChange={(e) =>
                        onUpdateConfig({
                          ...serverConfig,
                          port: parseInt(e.target.value, 10) || 3000,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                      Tick Rate (TPS)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={60}
                      value={serverConfig.tickRate}
                      onChange={(e) =>
                        onUpdateConfig({
                          ...serverConfig,
                          tickRate: parseInt(e.target.value, 10) || 20,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                      Max Players
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={64}
                      value={serverConfig.maxPlayers}
                      onChange={(e) =>
                        onUpdateConfig({
                          ...serverConfig,
                          maxPlayers: parseInt(e.target.value, 10) || 32,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SERVER LOGS */}
          {activeTab === 'logs' && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs flex flex-col h-[380px]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
                <span>Real-Time Host Daemon Standard Output</span>
                <span>{serverLogs.length} events logged</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 text-slate-300 font-mono">
                {serverLogs.map((log, i) => (
                  <div key={i} className="flex items-start space-x-2">
                    <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span>
                    <span
                      className={
                        log.includes('ERROR')
                          ? 'text-rose-400'
                          : log.includes('WARN')
                          ? 'text-amber-400'
                          : log.includes('CONNECTED')
                          ? 'text-emerald-400'
                          : 'text-slate-300'
                      }
                    >
                      {log}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold rounded-lg transition-colors"
          >
            Close Dialog
          </button>
        </div>
      </div>
    </div>
  );
};
