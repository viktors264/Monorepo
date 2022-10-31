import sumBy from 'lodash/sumBy'
import { ExplorerDataBucket, ExplorerDataFacet, Dot, Key } from './types'
import {
    TOTAL_DOTS,
    PEOPLE_PER_DOTS,
    INCREMENT,
    GAP,
    GRID_WIDTH,
    MAX_DOT_PER_CELL_LINE,
    INCREMENT_Y
} from './constants'
import variables from 'Config/variables.yml'

/* 

Find bucket containing the most items

*/
export const getMaxBucketCount = (facets: ExplorerDataFacet[]) => {
    let maxBucketCount = 0
    facets.forEach(f => {
        f.buckets.forEach(b => {
            if (b.count > maxBucketCount) {
                maxBucketCount = b.count
            }
        })
    })
    return maxBucketCount
}

/*

Figure out how many column/rows should go in a cell based on max bucket count

*/
export const getCellColumnRowCounts = (maxBucketCount: number) => {
    let cellColumnCount = 10
    if (maxBucketCount > 2000) {
        cellColumnCount = 15
    }
    if (maxBucketCount > 3000) {
        cellColumnCount = 20
    }
    if (maxBucketCount > 4000) {
        cellColumnCount = 25
    }
    if (maxBucketCount > 5000) {
        cellColumnCount = 30
    }
    const cellRowCount = Math.ceil(maxBucketCount / (cellColumnCount * 10))
    return { cellColumnCount, cellRowCount }
}

/*

Get grid parameters

*/
export const getParameters = ({
    facets,
    keys1,
    keys2
}: {
    facets: ExplorerDataFacet[]
    keys1: Key[]
    keys2: Key[]
}) => {
    const maxBucketCount = getMaxBucketCount(facets)
    const { cellRowCount, cellColumnCount } = getCellColumnRowCounts(maxBucketCount)
    const columnCount = keys1.length
    const rowCount = keys2.length
    const cellWidth = Math.floor((GRID_WIDTH - (columnCount - 1) * GAP) / columnCount)
    const maxDotsPerLine = Math.floor(cellWidth / INCREMENT)
    const columnWidth = maxDotsPerLine * INCREMENT
    return {
        gap: GAP,
        columnCount,
        rowCount,
        cellWidth,
        maxDotsPerLine,
        columnWidth,
        cellColumnCount,
        cellRowCount,
        maxBucketCount
    }
}

export const getDotStyle = (dot: Dot, params) => {
    const { x, y, visible } = dot
    const { columnCount, rowCount, cellColumnCount, cellRowCount } = params
    // x
    const gapCountX = columnCount - 1
    const cellWidth = `((100% - ${gapCountX * GAP}px)/${columnCount})`
    const incrementX = `(${cellWidth}/${cellColumnCount})`
    const numberOfXGaps = Math.floor(x / cellColumnCount)
    const left = `calc(${x} * ${incrementX} + ${GAP * numberOfXGaps}px)`

    // y
    const gapCountY = rowCount - 1
    const cellHeight = `((100% - ${gapCountY * GAP}px)/${rowCount})`
    const incrementY = `(${cellHeight}/${cellRowCount})`
    const numberOfYGaps = Math.floor(y / cellRowCount)
    const top = `calc(${y} * ${incrementY} + ${GAP * numberOfYGaps}px)`
    const opacity = visible ? 0.8 : 0
    return { left, top, opacity }
}

/*

Get a dot's coordinates in pixel

Note: take into account 1-space gap in between each cell

*/
export const getPixelCoordinates = ({
    facets,
    keys1,
    keys2,
    rowIndex,
    columnIndex,
    dotIndex
}: {
    facets: ExplorerDataFacet[]
    keys1: Key[]
    keys2: Key[]
    rowIndex: number
    columnIndex: number
    dotIndex: number
}) => {
    const { cellColumnCount, cellRowCount } = getParameters({
        facets,
        keys1,
        keys2
    })

    const x = columnIndex * cellColumnCount + (dotIndex % cellColumnCount)
    const y = rowIndex * cellRowCount + Math.floor(dotIndex / cellColumnCount)
    // const xAbs = columnIndex * (columnWidth + GAP) + (dotIndex % maxDotsPerLine) * INCREMENT
    // const yAbs = rowIndex * (rowHeight + GAP) + Math.floor(dotIndex / maxDotsPerLine) * INCREMENT
    return { x, y }
}

// get data attr for debugging
export const getDataAttr = (o: any) => {
    const attr: any = {}
    Object.keys(o).forEach(k => {
        attr[`data-${k}`] = o[k]
    })
    return attr
}

// const getValues = ({facets, keys1, keys2}) => {

//   const totalRespondents = sumBy(facets, f => f.completion.count)
//   const cutoffCount = totalRespondents/PEOPLE_PER_DOTS
// }

export const addExtraCounts = (facets: ExplorerDataFacet[]) => {
    let facetRunningCount = 0,
        bucketRunningCount = 0
    const facetsWithCounts = facets.map((f: ExplorerDataFacet, i: number) => {
        f.fromCount = facetRunningCount
        facetRunningCount += f.completion.count
        f.toCount = facetRunningCount
        f.rowIndex = i
        f.buckets.forEach((b: ExplorerDataBucket, j: number) => {
            b.fromCount = bucketRunningCount
            bucketRunningCount += b.count
            b.toCount = bucketRunningCount
            b.columnIndex = j
        })
        return f
    })
    return facetsWithCounts
}

export const isBetween = (i: number, lowerBound = 0, upperBound = 0) => {
    return lowerBound <= i && i <= upperBound
}

// get all dots
export const getDots = ({
    facets,
    keys1,
    keys2
}: {
    facets: ExplorerDataFacet[]
    keys1: Key[]
    keys2: Key[]
}): Dot[] => {
    const totalRespondents = sumBy(facets, f => f.completion.count)

    const dots = [...Array(TOTAL_DOTS)].map((x, i: number) => {
        const peopleCount = i * PEOPLE_PER_DOTS
        if (peopleCount < totalRespondents) {
            // find facet containing current dot
            const facet = facets.find((f: ExplorerDataFacet) =>
                isBetween(peopleCount, f.fromCount, f.toCount)
            )
            if (!facet || typeof facet.rowIndex === 'undefined') {
                throw new Error(`No valid facet found for dot ${peopleCount}`)
            }

            // find bucket containing current dot
            const bucket = facet.buckets.find((b: ExplorerDataBucket) =>
                isBetween(peopleCount, b.fromCount, b.toCount)
            )
            if (
                !bucket ||
                typeof bucket.columnIndex === 'undefined' ||
                typeof bucket.fromCount === 'undefined'
            ) {
                throw new Error(`No valid bucket found for dot ${peopleCount}`)
            }

            const { rowIndex } = facet
            const { columnIndex } = bucket
            const dotIndex = Math.floor((peopleCount - bucket.fromCount) / INCREMENT)
            const { x, y } = getPixelCoordinates({
                facets,
                keys1,
                keys2,
                rowIndex,
                columnIndex,
                dotIndex
            })
            return { i, visible: true, x, y, rowIndex, columnIndex, dotIndex }
        } else {
            return { i, visible: false, x: 0, y: 0 }
        }
    })
    return dots
}

const getOptGroups = (categories: any) => {
    return Object.keys(categories).map(id => {
        return { id, fields: categories[id] }
    })
}

export const getSelectorItems = () => {
    const selectorItems = [
        {
            id: 'demographics',
            optGroups: [
                {
                    id: 'all_fields',
                    fields: [
                        'age',
                        'years_of_experience',
                        'company_size',
                        'higher_education_degree',
                        'yearly_salary',
                        'gender',
                        'race_ethnicity',
                        'disability_status'
                    ]
                }
            ]
        },
        { id: 'features', optGroups: getOptGroups(variables.featuresCategories) },
        { id: 'tools', optGroups: getOptGroups(variables.toolsCategories) }
    ]
    return selectorItems
}