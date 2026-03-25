import { requestJson } from './apiClient'

export type AlgorithmWeightsDto = {
  weights: number[]
}

export async function getAlgorithmWeights(): Promise<AlgorithmWeightsDto> {
  return requestJson<AlgorithmWeightsDto>('/api/v1/study-session/algorithm-weights')
}

export async function updateAlgorithmWeights(weights: number[]): Promise<AlgorithmWeightsDto> {
  return requestJson<AlgorithmWeightsDto>('/api/v1/study-session/algorithm-weights', {
    method: 'POST',
    body: JSON.stringify({ weights }),
  })
}

export async function resetAlgorithmWeights(): Promise<AlgorithmWeightsDto> {
  return requestJson<AlgorithmWeightsDto>('/api/v1/study-session/algorithm-weights/reset', {
    method: 'POST',
  })
}
