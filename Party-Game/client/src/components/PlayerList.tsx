import { Player } from "@/hooks/use-game";
import { User, Crown, Eye, UserCircle } from "lucide-react";

interface PlayerListProps {
  players: Player[];
  currentPlayerId?: number;
  showRoles?: boolean;
}

export function PlayerList({ players, currentPlayerId, showRoles = false }: PlayerListProps) {
  return (
    <div className="space-y-3">
      {players.map((player) => {
        const isMe = player.id === currentPlayerId;
        
        return (
          <div 
            key={player.id}
            className={`
              flex items-center justify-between p-4 rounded-xl border-2 transition-all
              ${isMe 
                ? 'bg-primary/10 border-primary shadow-sm' 
                : 'bg-white border-transparent hover:border-border'}
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center
                ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
              `}>
                <UserCircle className="w-6 h-6" />
              </div>
              <div>
                <span className={`font-bold ${isMe ? 'text-primary' : 'text-foreground'}`}>
                  {player.name}
                </span>
                {isMe && <span className="ml-2 text-xs font-semibold bg-primary/20 text-primary px-2 py-0.5 rounded-full">YOU</span>}
              </div>
            </div>

            <div className="flex gap-2">
              {player.isHost && (
                <div title="Host" className="p-1.5 bg-yellow-100 text-yellow-600 rounded-lg">
                  <Crown className="w-4 h-4" />
                </div>
              )}
              {showRoles && isMe && player.isSpy && (
                <div title="Spy" className="p-1.5 bg-red-100 text-red-600 rounded-lg animate-pulse">
                  <Eye className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
