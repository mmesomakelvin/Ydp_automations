import data from '@/../product/sections/mentee-lookup/data.json'
import type { MenteeWithMatches } from '@/../product/sections/mentee-lookup/types'
import { MenteeLookup } from './components/MenteeLookup'

/**
 * Preview wrapper for Design OS. Feeds sample data into the props-based
 * MenteeLookup component. Not part of the exported package.
 */
export default function MenteeLookupPreview() {
  return (
    <MenteeLookup
      mentees={data.mentees as MenteeWithMatches[]}
      initialMenteeId={data.initialMenteeId}
      onContactMentor={(mentorId, matchId) =>
        console.log('Contact mentor:', mentorId, matchId)
      }
      onSelectMentee={(menteeId) => console.log('Select mentee:', menteeId)}
    />
  )
}
