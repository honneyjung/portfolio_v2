import { create } from 'zustand'

export type RecognitionJobEntry = {
  jobId: string
  file: File
  uploadedAt: string // YYYY.MM.DD
}

interface State {
  jobs: RecognitionJobEntry[]
  setJobs: (jobs: RecognitionJobEntry[]) => void
  clear: () => void
}

export const useRecognitionResultStore = create<State>((set) => ({
  jobs: [],
  setJobs: (jobs) => set({ jobs }),
  clear: () => set({ jobs: [] }),
}))
