import { ResolverDynamicConfig, RequestContext } from '../types'
import {
    computeTermAggregationAllYearsWithCache,
    computeTermAggregationSingleYearWithCache
} from '../compute'
import { getFacetPath } from '../helpers'

interface ExplorerResolverDynamicConfig extends ResolverDynamicConfig {
    facet1: string
    facet2: string
}


export default {
    ExplorerExperience: {
        all_years: async (
            { survey, id, filters, options, facet1, facet2 }: ExplorerResolverDynamicConfig,
            args: any,
            context: RequestContext
        ) =>
            computeTermAggregationAllYearsWithCache({
                context,
                survey,
                key: getFacetPath(facet1),
                options: {
                    ...options,
                    filters,
                    facet: facet2
                }
            }),
        year: async (
            { survey, id, filters, options, facet1, facet2 }: ExplorerResolverDynamicConfig,
            { year }: { year: number },
            context: RequestContext
        ) => {
            console.log(`// explorer/year `)
            console.log(facet1)
            console.log(facet2)
            return computeTermAggregationSingleYearWithCache({
                context,
                survey,
                key: getFacetPath(facet1),
                options: {
                    ...options,
                    filters,
                    facet: facet2,
                    year
                }
            })
        }
    }
}