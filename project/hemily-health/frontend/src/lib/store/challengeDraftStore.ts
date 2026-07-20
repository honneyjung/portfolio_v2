import { create } from 'zustand'

export interface DraftProduct {
  product_id: string
  product_name: string
  plan_tier?: string   // 리포트에서 온 제품 (basic/standard/premium)
  dna_stage?: string   // 카탈로그에서 온 제품 (D/N/A)
  intake_timing?: string | null
  package_image_url?: string | null
}

interface ChallengeDraftState {
  products: DraftProduct[]
  initialized: boolean
  setProducts: (products: DraftProduct[]) => void
  removeProduct: (productId: string) => void
  reset: () => void
}

export const useChallengeDraftStore = create<ChallengeDraftState>((set) => ({
  products: [],
  initialized: false,
  setProducts: (products) => set({ products, initialized: true }),
  removeProduct: (productId) =>
    set((state) => ({
      products: state.products.filter((p) => p.product_id !== productId),
    })),
  reset: () => set({ products: [], initialized: false }),
}))
