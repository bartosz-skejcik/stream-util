import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Song = {
  title: string;
  artist: string;
  duration: string;
  url: string;
  thumbnail: string;
};

interface SongRequestState {
  currentSong: Song | null;
  playedSongs: Song[];
  unplayedSongs: Song[];
}

interface SongRequestActions {
  playNextSong: () => void;
  addSong: (song: Song) => void;
}

type SongRequestStore = SongRequestState & SongRequestActions;

const useSongRequestStore = create<SongRequestStore>()(
  persist(
    (set) => ({
      currentSong: null,
      playedSongs: [],
      unplayedSongs: [],
      playNextSong: () => {
        set((state) => {
          const [nextSong, ...rest] = state.unplayedSongs;
          return {
            currentSong: nextSong,
            playedSongs: [...state.playedSongs, nextSong],
            unplayedSongs: rest,
          };
        });
      },
      addSong: (song) => {
        set((state) => ({
          unplayedSongs: [...state.unplayedSongs, song],
        }));
      },
    }),
    {
      name: "song-request-storage",
      storage: createJSONStorage<SongRequestStore>(() => sessionStorage),
    },
  ),
);

export { useSongRequestStore };
