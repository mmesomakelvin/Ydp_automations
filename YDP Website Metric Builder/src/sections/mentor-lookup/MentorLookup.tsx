import data from '@/../product/sections/mentor-lookup/data.json'
import type { MentorWithMatches } from '@/../product/sections/mentor-lookup/types'
import { MentorLookup } from './components/MentorLookup'

/**
 * Preview wrapper for Design OS. Feeds sample data into the props-based
 * MentorLookup component. Not part of the exported package.
 */
export default function MentorLookupPreview() {
  return (
    <MentorLookup
      mentors={data.mentors as MentorWithMatches[]}
      initialMentorId={data.initialMentorId}
      onContactMentee={(menteeId, matchId) =>
        console.log('Contact mentee:', menteeId, matchId)
      }
      onSelectMentor={(mentorId) => console.log('Select mentor:', mentorId)}
    />
  )
}
