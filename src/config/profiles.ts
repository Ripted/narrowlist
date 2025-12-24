// Player profiles configuration
// Map in-game usernames to profile data

export interface PlayerProfile {
  username: string; // Must match the in-game username exactly
  displayName?: string;
  avatarUrl?: string;
  country?: string;
  bio?: string;
}

export const PLAYER_PROFILES: PlayerProfile[] = [
  {
    username: "sqm",
    displayName: "SQM",
    avatarUrl: "https://i.pravatar.cc/150?u=sqm",
    country: "US",
    bio: "World record holder",
  },
  {
    username: "kiwi",
    displayName: "Kiwi",
    avatarUrl: "https://i.pravatar.cc/150?u=kiwi",
    country: "NZ",
  },
  {
    username: "Ripted",
    displayName: "Ripted",
    avatarUrl: "https://i.pravatar.cc/150?u=ripted",
    country: "US",
  },
  {
    username: "ImBen",
    displayName: "ImBen",
    avatarUrl: "https://i.pravatar.cc/150?u=imben",
  },
  {
    username: "DRally_Slave",
    displayName: "DRally Slave",
    avatarUrl: "https://i.pravatar.cc/150?u=drally",
  },
  {
    username: "Aqprox",
    displayName: "Aqprox",
    avatarUrl: "https://i.pravatar.cc/150?u=aqprox",
  },
  {
    username: "Ch4mpY",
    displayName: "Ch4mpY",
    avatarUrl: "https://i.pravatar.cc/150?u=champy",
  },
  // Add more player profiles here
];

// Helper to get profile by username
export function getPlayerProfile(username: string): PlayerProfile | undefined {
  return PLAYER_PROFILES.find(
    (p) => p.username.toLowerCase() === username.toLowerCase()
  );
}
