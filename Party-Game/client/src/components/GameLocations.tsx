import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

const LOCATIONS = [
  "Airplane", "Bank", "Beach", "Casino", "Hospital", 
  "Hotel", "Movie Theater", "Pirate Ship", "Restaurant", 
  "School", "Space Station", "Submarine", "Supermarket", "Train"
];

export function GameLocations() {
  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
        <MapPin className="w-5 h-5" />
        Possible Locations
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {LOCATIONS.map((loc, idx) => (
          <motion.div
            key={loc}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="p-3 rounded-xl bg-white/50 border border-border text-center text-sm font-medium hover:bg-white hover:border-primary/50 transition-colors cursor-help"
            title="Could this be the location?"
          >
            {loc}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
