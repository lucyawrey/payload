'use client'

import React, { Fragment, useEffect, useState } from 'react'
import Link from 'next/link'

import { useAuth } from '../_components/Auth'
import { Gutter } from '../_components/Gutter'
import classes from './index.module.css'

const Logout: React.FC = () => {
  const { logout } = useAuth()
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout()
        setSuccess('Logged out successfully.')
      } catch (err: any) {
        setError(err?.message || 'An error occurred while attempting to logout.')
      }
    }

    performLogout()
  }, [logout])

  return (
    <Gutter>
      {success && <h1>{success}</h1>}
      {error && <div className={classes.error}>{error}</div>}
      <p>
        {'What would you like to do next? '}
        <Fragment>
          {' To log back in, '}
          <Link href={`/login`}>click here</Link>
          {'.'}
        </Fragment>
      </p>
    </Gutter>
  )
}

export default Logout
