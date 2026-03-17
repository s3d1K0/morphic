import { SearchResults } from '@/lib/types'

import { BaseSearchProvider } from './base'

export class ExaSearchProvider extends BaseSearchProvider {
  async search(
    query: string,
    maxResults: number = 10,
    _searchDepth: 'basic' | 'advanced' = 'basic',
    includeDomains: string[] = [],
    excludeDomains: string[] = []
  ): Promise<SearchResults> {
    // Exa provider removed (exa-js dependency removed)
    // Return empty results
    return {
      results: [],
      query,
      images: [],
      number_of_results: 0
    }
  }
}
