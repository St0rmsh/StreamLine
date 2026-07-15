import React from 'react'
import {useParams} from "react-router-dom"
const SearchPage = () => {
    const {query} = useParams()
  return (
    <div>{query}</div>
  )
}

export default SearchPage