import { computeHappinessByYear } from '../compute'
import { useCache } from '../caching'
import { RequestContext, SurveyConfig } from '../types'
import { Filters } from '../filters'
import { YearAggregations } from '../compute/generic'
import keys from '../data/keys.yml'

interface HappinessConfig {
    survey: SurveyConfig
    id: string
    filters?: Filters
}

export default {
    Happiness: {
        keys: () => keys.happiness,
        all_years: async (
            { survey, id, filters }: HappinessConfig,
            args: any,
            context: RequestContext
        ) =>
            useCache({
                func: computeHappinessByYear,
                context,
                funcOptions: { survey, id, filters }
            }),
        year: async (
            { survey, id, filters }: HappinessConfig,
            { year }: { year: number },
            context: RequestContext
        ) => {
            const allYears = await useCache({
                func: computeHappinessByYear,
                context,
                funcOptions: { survey, id, filters }
            })
            return allYears.find((yearItem: YearAggregations) => yearItem.year === year)
        }
    }
}
