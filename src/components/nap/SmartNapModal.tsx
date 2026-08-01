'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, Mic, Sun, Moon, Settings, AlertCircle, X, Check, Eye, EyeOff } from 'lucide-react';
import { whiteNoisePlayer } from '@/lib/audio/whiteNoisePlayer';
import { cryDetector, SensitivityLevel } from '@/lib/audio/cryDetector';
import { SoundType } from '@/lib/audio/audioSynth';

interface SmartNapModalProps {
  isOpen: boolean;
  onClose: () => void;
  babyId?: string;
}

export default function SmartNapModal({ isOpen, onClose, babyId }: SmartNapModalProps) {
  const [isPlayingNoise, setIsPlayingNoise] = useState(true);
  const [selectedSound, setSelectedSound] = useState<SoundType>('white_noise');
  const [volume, setVolume] = useState(0.7);
  const [micSensitivity, setMicSensitivity] = useState<SensitivityLevel>('medium');
  const [showSettings, setShowSettings] = useState(false);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [isDimmed, setIsDimmed] = useState(false); // Modo Tela Apagada/Ultra Escura
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);

  const wakeLockRef = useRef<any>(null);

  // Timer states
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const startTimeRef = useRef<Date | null>(null);

  // Mic/Monitor states
  const [isMicActive, setIsMicActive] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [dbLevel, setDbLevel] = useState(-100);
  const [rmsLevel, setRmsLevel] = useState(0);

  // End Alert State
  const [endAlert, setEndAlert] = useState<{ show: boolean; reason: string; duration: number } | null>(null);

  // Carregar configurações
  useEffect(() => {
    if (isOpen) {
      fetch('/api/nap/settings')
        .then((res) => res.json())
        .then((data) => {
          if (data.micSensitivity) setMicSensitivity(data.micSensitivity);
          if (data.defaultWhiteNoise) setSelectedSound(data.defaultWhiteNoise as SoundType);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Ativar Screen Wake Lock (Impedir que a tela do tablet/celular apague)
  useEffect(() => {
    if (!isOpen) return;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          setIsWakeLockActive(true);
        }
      } catch (err) {
        console.log('Wake Lock error:', err);
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
        setIsWakeLockActive(false);
      }
    };
  }, [isOpen]);

  // Inicializar Soneca (Timer, Player e Monitor de Choro)
  useEffect(() => {
    if (!isOpen) return;

    startTimeRef.current = new Date();
    setSecondsElapsed(0);
    setEndAlert(null);
    setMicError(null);

    // 1. Iniciar Player de Áudio
    whiteNoisePlayer.play(selectedSound, volume, 2);
    setIsPlayingNoise(true);

    // 2. Iniciar Cronômetro
    const timerInterval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);

    // 3. Iniciar Monitor de Choro
    cryDetector.start(micSensitivity, {
      onCryDetected: () => {
        handleCryDetected();
      },
      onVolumeChange: (db, rms) => {
        setDbLevel(db);
        setRmsLevel(rms);
      },
      onError: (err) => {
        setMicError('Não foi possível acessar o microfone para monitorar o choro.');
        setIsMicActive(false);
      },
    });
    setIsMicActive(true);

    return () => {
      clearInterval(timerInterval);
      whiteNoisePlayer.stop(0);
      cryDetector.stop();
    };
  }, [isOpen]);

  // Atualizar volume quando alterado na UI
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    whiteNoisePlayer.setVolume(newVol);
  };

  // Trocar ruído branco
  const handleSoundChange = (sound: SoundType) => {
    setSelectedSound(sound);
    whiteNoisePlayer.setSound(sound);
  };

  // Play / Pause manual do som
  const togglePlayNoise = () => {
    if (isPlayingNoise) {
      whiteNoisePlayer.stop(0.5);
      setIsPlayingNoise(false);
    } else {
      whiteNoisePlayer.play(selectedSound, volume, 0.5);
      setIsPlayingNoise(true);
    }
  };

  // Salvar configurações de sensibilidade
  const saveSensitivity = async (newSens: SensitivityLevel) => {
    setMicSensitivity(newSens);
    try {
      await fetch('/api/nap/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ babyId, micSensitivity: newSens, defaultWhiteNoise: selectedSound }),
      });
      // Reiniciar monitor com nova sensibilidade
      cryDetector.start(newSens, {
        onCryDetected: handleCryDetected,
        onVolumeChange: (db, rms) => {
          setDbLevel(db);
          setRmsLevel(rms);
        },
      });
    } catch {}
  };

  // Finalização Automática por Detecção de Choro
  const handleCryDetected = async () => {
    cryDetector.stop();
    setIsMicActive(false);

    // Fade-out em 3 segundos
    await whiteNoisePlayer.stop(3);
    setIsPlayingNoise(false);

    const endedAt = new Date();
    const durationMin = Math.max(1, Math.round(secondsElapsed / 60));

    // Salvar no Banco
    try {
      await fetch('/api/nap/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          babyId,
          startedAt: startTimeRef.current?.toISOString(),
          endedAt: endedAt.toISOString(),
          durationMinutes: durationMin,
          endReason: 'cry_detected',
          whiteNoiseUsed: selectedSound,
        }),
      });
    } catch {}

    setEndAlert({
      show: true,
      reason: 'cry_detected',
      duration: durationMin,
    });
  };

  // Encerramento Manual pelo Usuário
  const handleManualEnd = async () => {
    cryDetector.stop();
    setIsMicActive(false);

    await whiteNoisePlayer.stop(1);
    setIsPlayingNoise(false);

    const endedAt = new Date();
    const durationMin = Math.round(secondsElapsed / 60);

    try {
      await fetch('/api/nap/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          babyId,
          startedAt: startTimeRef.current?.toISOString(),
          endedAt: endedAt.toISOString(),
          durationMinutes: durationMin,
          endReason: 'manual',
          whiteNoiseUsed: selectedSound,
        }),
      });
    } catch {}

    onClose();
  };

  // Formatação de Tempo HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const isDark = themeMode === 'dark';

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between p-6 transition-colors duration-500 overflow-y-auto ${
        isDark ? 'bg-[#05070B] text-slate-100' : 'bg-gradient-to-b from-rose-50/90 via-pink-50/80 to-amber-50/90 text-slate-800 backdrop-blur-md'
      }`}
    >
      {/* Top Header Controls */}
      <div className="flex items-center justify-between max-w-md w-full mx-auto">
        <div className="flex items-center space-x-2">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${isDark ? 'bg-indigo-500' : 'bg-rose-400'} animate-pulse`} />
          <span className={`text-xs tracking-wider uppercase font-semibold ${isDark ? 'text-indigo-400' : 'text-rose-500'}`}>
            Modo Soneca Ativo
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Botão Dimmer / Modo Luz de Presença (Blackout) */}
          <button
            onClick={() => setIsDimmed(!isDimmed)}
            className={`p-2 rounded-full transition ${
              isDimmed
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg ring-2 ring-amber-400'
                : isDark
                ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-300'
                : 'bg-white/80 hover:bg-white text-slate-700 shadow-xs border border-rose-200/60'
            }`}
            title={isDimmed ? 'Restaurar Brilho Normal' : 'Modo Penumbra (Manter tela ligada com luz ultra reduzida)'}
          >
            {isDimmed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Alternar Tema Escuro / Claro */}
          <button
            onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
            className={`p-2 rounded-full transition ${
              isDark
                ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-300'
                : 'bg-white/80 hover:bg-white text-rose-500 shadow-xs border border-rose-200/60'
            }`}
            title={isDark ? 'Mudar para Modo Claro Soft' : 'Mudar para Modo Noturno'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 fill-indigo-400 text-indigo-500" />}
          </button>

          {/* Botão de Configurações */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-full transition ${
              isDark
                ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                : 'bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 shadow-xs border border-rose-200/60'
            }`}
            title="Configurações do Monitor"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Camada de Filtro de Luz Ultra Escuro (Dimmer / Blackout 90%) */}
      {isDimmed && (
        <div
          onClick={() => setIsDimmed(false)}
          className="fixed inset-0 z-55 bg-black/92 cursor-pointer flex flex-col items-center justify-center p-6 space-y-4 animate-in fade-in transition-all"
        >
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Eye className="w-6 h-6 animate-pulse" />
          </div>
          <p className="text-xs text-slate-400 font-mono tracking-widest uppercase font-bold text-center">
            Modo Penumbra Ativo • Brilho Reduzido
          </p>
          <div className="text-4xl font-extrabold font-mono text-slate-600">
            {formatTime(secondsElapsed)}
          </div>
          <span className="text-[11px] text-slate-500 bg-slate-900 px-4 py-2 rounded-full border border-slate-800">
            💡 Toque em qualquer lugar da tela para restaurar os controles
          </span>
        </div>
      )}

      {/* Painel de Configurações (Modal Sobreposto) */}
      {showSettings && (
        <div
          className={`max-w-md w-full mx-auto my-2 p-4 rounded-2xl shadow-xl space-y-4 border ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white/95 border-rose-100 text-slate-800'
          }`}
        >
          <div className={`flex justify-between items-center pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <h3 className="text-sm font-bold">Sensibilidade do Monitor de Choro</h3>
            <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['low', 'medium', 'high'] as SensitivityLevel[]).map((sens) => (
              <button
                key={sens}
                onClick={() => saveSensitivity(sens)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize flex items-center justify-center space-x-1 border transition ${
                  micSensitivity === sens
                    ? isDark
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-rose-500 border-rose-400 text-white'
                    : isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {micSensitivity === sens && <Check className="w-3 h-3 mr-1" />}
                <span>{sens === 'low' ? 'Baixa' : sens === 'medium' ? 'Média' : 'Alta'}</span>
              </button>
            ))}
          </div>
          <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            * Se definir para 'Alta', ruídos leves acionam o aviso. Para evitar alardes falsos em ambientes barulhentos, escolha 'Baixa'.
          </p>
        </div>
      )}

      {/* Main Display: Cronômetro & Monitor Visual com Layout Responsivo para Landscape/Portrait */}
      <div className="flex flex-col landscape:flex-row items-center justify-center gap-6 landscape:gap-8 my-auto max-w-md landscape:max-w-4xl w-full mx-auto py-2">
        {/* Lado Esquerdo / Topo: Lua Glow & Cronômetro + Status do Monitor */}
        <div className="flex flex-col items-center justify-center space-y-6 w-full landscape:w-1/2">
          {/* Glow & Cronômetro */}
          <div className="relative flex flex-col items-center justify-center">
            <div
              className={`absolute -inset-8 rounded-full blur-2xl animate-pulse ${
                isDark ? 'bg-indigo-500/10' : 'bg-rose-300/20'
              }`}
            />
            <div
              className={`text-5xl sm:text-7xl font-extrabold tracking-tight font-mono drop-shadow-sm ${
                isDark ? 'text-white' : 'text-slate-800'
              }`}
            >
              {formatTime(secondsElapsed)}
            </div>
            <p className={`text-xs mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tempo total de sono</p>
          </div>

          {/* Status do Monitor de Choro */}
          <div
            className={`w-full border rounded-2xl p-4 flex flex-col items-center space-y-2 ${
              isDark
                ? 'bg-slate-900/60 border-slate-800/80'
                : 'bg-white/80 border-rose-100/80 shadow-xs'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Mic className={`w-4 h-4 ${isMicActive ? (isDark ? 'text-emerald-400' : 'text-emerald-600') + ' animate-bounce' : 'text-slate-400'}`} />
              <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {isMicActive ? '🎙️ Monitor de Choro Ativo' : 'Microfone Inativo'}
              </span>
            </div>
            {/* Visualizador de Decibéis */}
            {isMicActive && (
              <div className="w-full space-y-1">
                <div className={`flex justify-between text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span>Nível de Som</span>
                  <span>{dbLevel} dB</span>
                </div>
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-rose-500 transition-all duration-100"
                    style={{ width: `${Math.min(100, Math.max(0, (dbLevel + 100) * 1.25))}%` }}
                  />
                </div>
              </div>
            )}
            {micError && (
              <div className="flex items-center space-x-1 text-rose-500 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{micError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Lado Direito: Player de Ruído Branco */}
        <div className="w-full landscape:w-1/2">
          <div
            className={`w-full border rounded-2xl p-5 space-y-4 ${
              isDark
                ? 'bg-slate-900/40 border-slate-800/50'
                : 'bg-white/80 border-rose-100/80 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Ruído Branco Relaxante
              </span>
              <button
                onClick={togglePlayNoise}
                className={`p-2.5 rounded-full text-white transition shadow-md ${
                  isDark ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-rose-500 hover:bg-rose-600'
                }`}
              >
                {isPlayingNoise ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              </button>
            </div>

            {/* Seleção de Sons */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'white_noise', label: 'Clássico' },
                { id: 'rain', label: 'Chuva' },
                { id: 'womb', label: 'Útero' },
              ].map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => handleSoundChange(sound.id as SoundType)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold transition border ${
                    selectedSound === sound.id
                      ? isDark
                        ? 'bg-indigo-950 border-indigo-700/80 text-indigo-200'
                        : 'bg-rose-100 border-rose-300 text-rose-700'
                      : isDark
                      ? 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-slate-200'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {sound.label}
                </button>
              ))}
            </div>

            {/* Controle de Volume */}
            <div className="flex items-center space-x-3 pt-1">
              <Volume2 className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                  isDark ? 'bg-slate-800 accent-indigo-500' : 'bg-slate-200 accent-rose-500'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Button: Bebê Acordou */}
      <div className="max-w-md w-full mx-auto pt-4">
        <button
          onClick={handleManualEnd}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center space-x-2 shadow-xl transition transform active:scale-98 ${
            isDark
              ? 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 shadow-amber-500/10'
              : 'bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950 shadow-amber-400/20'
          }`}
        >
          <Sun className="w-5 h-5 fill-slate-950" />
          <span>Bebê Acordou</span>
        </button>
      </div>

      {/* Popup de Alerta de Choro Detectado */}
      {endAlert && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`border rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in fade-in zoom-in ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-rose-100 text-slate-800'
            }`}
          >
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
                isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-rose-100 text-rose-500'
              }`}
            >
              <Mic className="w-7 h-7 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">Soneca Encerrada!</h3>
              <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                O monitor detectou o choro do bebê. O ruído branco foi reduzido e a soneca salva.
              </p>
            </div>
            <div className={`p-3 rounded-xl text-xs font-medium ${isDark ? 'bg-slate-800/60 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
              ⏱️ Duração total: <span className="text-amber-500 font-bold">{endAlert.duration} minuto(s)</span>
            </div>
            <button
              onClick={() => {
                setEndAlert(null);
                onClose();
              }}
              className={`w-full py-3 text-white font-bold rounded-xl transition ${
                isDark ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-rose-500 hover:bg-rose-600'
              }`}
            >
              OK, Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
