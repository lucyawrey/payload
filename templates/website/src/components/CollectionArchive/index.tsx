'use client'

import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { Cell, Grid } from '@faceless-ui/css-grid'
import { useSearchParams } from 'next/navigation'
import qs from 'qs'

import type { ArchiveBlockProps } from '../../app/_blocks/ArchiveBlock/types'
import { Page, Post, Project } from '../../payload-types'
import { Card } from '../Card'
import { Gutter } from '../Gutter'
import { PageRange } from '../PageRange'

import classes from './index.module.scss'

type Result = {
  totalDocs: number
  docs: Page[] | Post[]
  page: number
  totalPages: number
  hasPrevPage: boolean
  hasNextPage: boolean
  nextPage: number
  prevPage: number
}

export type Props = {
  className?: string
  relationTo?: 'pages' | 'posts' | 'projects'
  populateBy?: 'collection' | 'selection'
  showPageRange?: boolean
  onResultChange?: (result: Result) => void // eslint-disable-line no-unused-vars
  sort?: string
  limit?: number
  populatedDocs?: ArchiveBlockProps['populatedDocs']
  populatedDocsTotal?: ArchiveBlockProps['populatedDocsTotal']
  categories?: ArchiveBlockProps['categories']
}

export const CollectionArchive: React.FC<Props> = props => {
  const {
    className,
    relationTo,
    showPageRange,
    onResultChange,
    sort = '-createdAt',
    limit = 10,
    populatedDocs,
    populatedDocsTotal,
    categories: catsFromProps,
  } = props

  const [results, setResults] = useState<Result>({
    totalDocs: typeof populatedDocsTotal === 'number' ? populatedDocsTotal : 0,
    docs: populatedDocs?.map(doc => doc.value) || [],
    page: 1,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
    prevPage: 1,
    nextPage: 1,
  })

  const searchParams = useSearchParams()
  const page = searchParams.get('page')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasHydrated = useRef(false)

  const scrollToRef = useCallback(() => {
    const { current } = scrollRef
    if (current) {
      current.scrollIntoView({
        behavior: 'smooth',
      })
    }
  }, [])

  useEffect(() => {
    if (typeof page !== 'undefined') {
      scrollToRef()
    }
  }, [isLoading, scrollToRef, page])

  useEffect(() => {
    // hydrate the block with fresh content after first render
    // don't show loader unless the request takes longer than x ms
    // and don't show it during initial hydration
    const timer: NodeJS.Timeout = setTimeout(() => {
      if (hasHydrated) {
        setIsLoading(true)
      }
    }, 500)

    const catsFromQuery = searchParams.getAll('categories')

    const searchQuery = qs.stringify(
      {
        sort,
        where: {
          ...(catsFromProps?.length > 0
            ? {
                categories: {
                  in:
                    typeof catsFromProps === 'string'
                      ? [catsFromProps]
                      : catsFromProps.map(cat => cat.id).join(','),
                },
              }
            : {}),
          ...(catsFromQuery?.length > 0
            ? {
                categories: {
                  in:
                    typeof catsFromQuery === 'string'
                      ? [catsFromQuery]
                      : catsFromQuery.map(cat => cat).join(','),
                },
              }
            : {}),
        },
        limit,
        page,
        depth: 1,
      },
      { encode: false },
    )

    const makeRequest = async () => {
      try {
        const req = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/api/${relationTo}?${searchQuery}`,
        )
        const json = await req.json()
        clearTimeout(timer)
        hasHydrated.current = true

        const { docs } = json as { docs: Page[] | Post[] | Project[] }

        if (docs && Array.isArray(docs)) {
          setResults(json)
          setIsLoading(false)
          if (typeof onResultChange === 'function') {
            onResultChange(json)
          }
        }
      } catch (err) {
        console.warn(err) // eslint-disable-line no-console
        setIsLoading(false)
        setError(`Unable to load "${relationTo} archive" data at this time.`)
      }
    }

    makeRequest()

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [catsFromProps, searchParams, page, limit, onResultChange, relationTo, sort])

  return (
    <div className={[classes.collectionArchive, className].filter(Boolean).join(' ')}>
      <div ref={scrollRef} className={classes.scrollRef} />
      {isLoading && <Gutter>Loading, please wait...</Gutter>}
      {!isLoading && error && <Gutter>{error}</Gutter>}
      {!isLoading && (
        <Fragment>
          {showPageRange !== false && (
            <Gutter>
              <Grid>
                <Cell cols={6} colsM={4}>
                  <div className={classes.pageRange}>
                    <PageRange
                      totalDocs={results.totalDocs}
                      currentPage={results.page}
                      collection={relationTo}
                      limit={limit}
                    />
                  </div>
                </Cell>
              </Grid>
            </Gutter>
          )}
          <Gutter>
            <Grid className={classes.grid}>
              {results.docs?.map((result, index) => {
                return (
                  <Cell key={index} className={classes.row} cols={4} colsM={8}>
                    <Card relationTo={relationTo} doc={result} />
                  </Cell>
                )
              })}
            </Grid>
          </Gutter>
        </Fragment>
      )}
    </div>
  )
}
