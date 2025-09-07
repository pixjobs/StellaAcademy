// src/components/MissionStandby.tsx

import React from 'react';

type MissionStandbyProps = {
  missionName: string;
};

/**
 * A user-friendly placeholder screen displayed when mission data is loading
 * or has failed to load. It provides clear feedback to the user.
 */
export default function MissionStandby({ missionName }: MissionStandbyProps) {
  return (
    <div className="rounded-2xl bg-slate-900/60 p-4 shadow-pixel border border-white/10 backdrop-blur-md text-center">
      <div className="font-pixel text-sm text-sky mb-2">
        {missionName} - Mission Standby
      </div>
      <div className="text-slate-300">
        <p className="animate-pulse">
          Contacting NASA Deep Space Network...
        </p>
        <p className="text-xs text-slate-400 mt-2">
          (Waiting for mission data. This can happen if the NASA API or AI model is unavailable.)
        </p>
      </div>
    </div>
  );
}