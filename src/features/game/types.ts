export type GamePhase = 'idle' | 'ready' | 'exploring' | 'dialogue' | 'completing' | 'completed'
export type MapAsset =
  | { format: 'pending' }
  | { format: 'gltf'; url: string }
  | { format: 'obj'; url: string; textureUrl: string }
  | { format: 'splat'; url: string }
export interface Place { id: string; regionId: string; name: string; map: MapAsset }
export interface Quest { id: string; placeId: string; title: string; order: number; rewardCoins: number }
export interface QuestCompletion { questId: string; completedAt: string }
