import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useRoom, useStartGame, useResetGame, useJoinRoom } from "@/hooks/use-game";
import { PlayerList } from "@/components/PlayerList";
import { GameLocations } from "@/components/GameLocations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Check, Info, AlertTriangle, Play, RotateCcw, Users } from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

export default function Room() {
  const [, params] = useRoute("/room/:code");
  const roomCode = params?.code || "";
  const { toast } = useToast();
  
  const [playerId, setPlayerId] = useState<number | null>(() => {
    const stored = localStorage.getItem("playerId");
    return stored ? parseInt(stored) : null;
  });

  // Local state for joining if no ID
  const [joinName, setJoinName] = useState(localStorage.getItem("playerName") || "");
  const [copied, setCopied] = useState(false);

  // Queries & Mutations
  const { data, isLoading, error } = useRoom(roomCode);
  const startMutation = useStartGame();
  const resetMutation = useResetGame();
  const joinMutation = useJoinRoom();

  const currentPlayer = data?.players.find(p => p.id === playerId);
  const isHost = currentPlayer?.isHost;

  // Handle game start confetti
  useEffect(() => {
    if (data?.room.status === 'playing') {
      // Small burst to indicate change
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#8b5cf6', '#f97316', '#14b8a6']
      });
    }
  }, [data?.room.status]);

  // If no player ID, show join form
  if (!playerId) {
    const handleInlineJoin = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!joinName.trim()) return;
      try {
        const res = await joinMutation.mutateAsync({ name: joinName, roomCode });
        setPlayerId(res.playerId);
        localStorage.setItem("playerId", res.playerId.toString());
        localStorage.setItem("playerName", joinName);
      } catch (err: any) {
        toast({ variant: "destructive", title: "Failed to join", description: err.message });
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border-2 border-primary/20 text-center space-y-6">
          <h2 className="text-3xl font-bold text-primary">Join Room {roomCode}</h2>
          <p className="text-muted-foreground">Enter your name to join the lobby.</p>
          <form onSubmit={handleInlineJoin} className="space-y-4">
            <Input
              placeholder="Your Name"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              className="text-lg h-12 text-center"
              maxLength={15}
            />
            <Button type="submit" className="w-full h-12 font-bold text-lg btn-3d" disabled={!joinName || joinMutation.isPending}>
              {joinMutation.isPending ? <Loader2 className="animate-spin" /> : "Enter Lobby"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  if (error || !data) return <div className="min-h-screen flex items-center justify-center text-red-500 font-bold">Room not found</div>;

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Room code copied to clipboard." });
  };

  // --- LOBBY VIEW ---
  if (data.room.status === 'waiting') {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 max-w-2xl mx-auto flex flex-col">
        <header className="mb-8 text-center space-y-4">
          <div className="inline-block relative group cursor-pointer" onClick={copyCode}>
            <div className="text-6xl md:text-8xl font-black text-primary tracking-widest bg-white px-8 py-4 rounded-3xl shadow-sm border-2 border-primary/10 select-all group-hover:scale-105 transition-transform">
              {roomCode}
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded-full flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy"}
            </div>
          </div>
          <p className="text-muted-foreground font-medium">Share this code with friends to join!</p>
        </header>

        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-secondary" />
                Players ({data.players.length})
              </h2>
              {data.players.length < 3 && (
                <span className="text-xs text-orange-500 font-bold bg-orange-50 px-2 py-1 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Need 3+ to start
                </span>
              )}
            </div>
            <PlayerList players={data.players} currentPlayerId={playerId} />
          </div>
        </div>

        <footer className="mt-8 sticky bottom-4">
          {isHost ? (
            <Button 
              size="lg" 
              className="w-full h-16 text-xl font-bold shadow-xl shadow-primary/20 btn-3d rounded-2xl"
              disabled={data.players.length < 3 || startMutation.isPending}
              onClick={() => startMutation.mutate({ code: roomCode, playerId })}
            >
              {startMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <Play className="mr-2 fill-current" />}
              Start Game
            </Button>
          ) : (
            <div className="text-center p-4 bg-primary/10 text-primary rounded-xl font-medium animate-pulse">
              Waiting for host to start...
            </div>
          )}
        </footer>
      </div>
    );
  }

  // --- PLAYING VIEW ---
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Role Card */}
          <div className={`
            relative overflow-hidden rounded-3xl p-8 text-center shadow-2xl transition-all
            ${currentPlayer?.isSpy 
              ? "bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-red-500/30" 
              : "bg-gradient-to-br from-primary to-violet-600 text-white shadow-primary/30"}
          `}>
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
            
            <div className="relative z-10 space-y-4">
              <h2 className="text-lg font-medium opacity-90 uppercase tracking-widest">Your Role</h2>
              
              {currentPlayer?.isSpy ? (
                <div className="space-y-4">
                  <div className="text-6xl font-black tracking-tight drop-shadow-md">YOU ARE THE SPY</div>
                  <div className="inline-block bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">
                    🤫 Shhh... Don't let them know!
                  </div>
                  <p className="opacity-90 max-w-md mx-auto">
                    Try to figure out the location by listening to other players' questions and answers.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm font-semibold opacity-75">LOCATION:</div>
                  <div className="text-5xl md:text-7xl font-black tracking-tight drop-shadow-md">
                    {data.room.location}
                  </div>
                  <div className="inline-block bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
                    🔎 Find the Spy!
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column: Players */}
            <div>
              <div className="bg-white rounded-3xl p-6 border border-border h-full">
                 <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                   <Users className="w-5 h-5" /> Players
                 </h3>
                 <PlayerList players={data.players} currentPlayerId={playerId} showRoles={false} />
              </div>
            </div>

            {/* Right Column: Game Info & Controls */}
            <div className="space-y-6">
              <div className="bg-blue-50 text-blue-800 p-6 rounded-3xl border border-blue-100 flex gap-4">
                <Info className="w-6 h-6 shrink-0" />
                <div className="text-sm space-y-2">
                  <p className="font-bold">How to play:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Ask each other questions about the location.</li>
                    <li>The Spy doesn't know where we are.</li>
                    <li>If you're the Spy, try to guess the location!</li>
                  </ul>
                </div>
              </div>

              {isHost && (
                <Button 
                  variant="destructive" 
                  size="lg"
                  className="w-full h-16 text-lg font-bold rounded-2xl shadow-lg shadow-red-500/20 btn-3d"
                  onClick={() => {
                    if (confirm("End the game and return to lobby?")) {
                      resetMutation.mutate({ code: roomCode, playerId });
                    }
                  }}
                  disabled={resetMutation.isPending}
                >
                  {resetMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <RotateCcw className="mr-2" />}
                  End Game
                </Button>
              )}
            </div>
          </div>

          <GameLocations />

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
