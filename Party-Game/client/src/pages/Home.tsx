import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateRoom, useJoinRoom } from "@/hooks/use-game";
import { AnimatedCard } from "@/components/ui/card-stack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowRight, Gamepad2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  
  const createMutation = useCreateRoom();
  const joinMutation = useJoinRoom();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const data = await createMutation.mutateAsync(name);
      localStorage.setItem("playerId", data.playerId.toString());
      localStorage.setItem("playerName", name);
      setLocation(`/room/${data.roomCode}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating room",
        description: error.message
      });
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || roomCode.length !== 4) return;

    try {
      const data = await joinMutation.mutateAsync({ name, roomCode: roomCode.toUpperCase() });
      localStorage.setItem("playerId", data.playerId.toString());
      localStorage.setItem("playerName", name);
      setLocation(`/room/${data.roomCode}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error joining room",
        description: error.message
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col items-center justify-center max-w-5xl mx-auto">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        
        {/* Left Side: Hero Text */}
        <div className="text-center md:text-left space-y-6">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm mb-4">
            <span className="text-4xl">🕵️‍♀️</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-primary drop-shadow-sm">
            Secret<br/>
            <span className="text-foreground">Location</span>
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-md mx-auto md:mx-0">
            The party game of deception, deduction, and finding the spy among us.
          </p>
          
          <div className="hidden md:flex gap-4 pt-4">
            <div className="flex items-center gap-2 text-sm font-semibold bg-white/50 px-4 py-2 rounded-full border">
              <Users className="w-4 h-4 text-secondary" />
              3-10 Players
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold bg-white/50 px-4 py-2 rounded-full border">
              <Gamepad2 className="w-4 h-4 text-accent" />
              No App Needed
            </div>
          </div>
        </div>

        {/* Right Side: Action Cards */}
        <div className="space-y-6 w-full max-w-md mx-auto">
          
          {/* Join Game Card */}
          <AnimatedCard delay={0.1} className="p-6 md:p-8 bg-white/80 backdrop-blur-sm border-2 border-primary/20">
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Join Game</h2>
                <p className="text-muted-foreground text-sm">Enter a code to join your friends</p>
              </div>
              
              <div className="space-y-3">
                <Input
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 text-lg bg-white"
                  maxLength={15}
                />
                <Input
                  placeholder="Room Code (e.g. ABCD)"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="h-12 text-lg bg-white font-mono tracking-widest uppercase placeholder:font-sans placeholder:tracking-normal placeholder:normal-case"
                  maxLength={4}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-bold btn-3d"
                disabled={!name || roomCode.length !== 4 || joinMutation.isPending}
              >
                {joinMutation.isPending ? <Loader2 className="animate-spin" /> : "Join Room"}
                {!joinMutation.isPending && <ArrowRight className="ml-2 w-5 h-5" />}
              </Button>
            </form>
          </AnimatedCard>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted-foreground/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground font-semibold">Or create new</span>
            </div>
          </div>

          {/* Create Game Card */}
          <AnimatedCard delay={0.2} className="p-6 bg-primary/5 border-2 border-primary/10">
             <form onSubmit={handleCreate} className="flex gap-3">
                <Input
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 bg-white"
                  maxLength={15}
                />
                <Button 
                  type="submit" 
                  variant="secondary"
                  className="h-12 px-6 font-bold btn-3d whitespace-nowrap"
                  disabled={!name || createMutation.isPending}
                >
                  {createMutation.isPending ? <Loader2 className="animate-spin" /> : "Create"}
                </Button>
             </form>
          </AnimatedCard>

        </div>
      </div>
    </div>
  );
}
