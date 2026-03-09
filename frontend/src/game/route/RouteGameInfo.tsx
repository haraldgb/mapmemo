import {
  Bold,
  GameInfo,
  GameInfoList,
  GameInfoListItem,
  GameInfoParagraph,
  GameInfoSection,
} from '../../components/GameInfo'

type Props = {
  onClose: () => void
}

export const RouteGameInfo = ({ onClose }: Props) => {
  return (
    <GameInfo
      title='Route Game'
      onClose={onClose}
    >
      <GameInfoParagraph>
        As a car, navigate from <Bold>A to B</Bold> through the city's junctions
        and roads.
      </GameInfoParagraph>
      <GameInfoSection
        title='How to play'
        defaultOpen
      >
        <GameInfoList>
          <GameInfoListItem>
            Your goal is to find the quickest route possible between two
            addresses. Click a available junction(purple dot) to select it.
          </GameInfoListItem>
          <GameInfoListItem>
            That junction connects you to new road(s). A new set of junctions
            should be available.
          </GameInfoListItem>
          <GameInfoListItem>
            Keep adding junctions to your route until you are connected to the
            road of your end goal(road name must match address).
          </GameInfoListItem>
          <GameInfoListItem>
            Click <Bold>B</Bold> to complete the route and end the game.
          </GameInfoListItem>
        </GameInfoList>
      </GameInfoSection>
      <GameInfoSection
        title='Data'
        defaultOpen={false}
      >
        <GameInfoList>
          <GameInfoListItem>
            Route mode uses a mix of data from Google Maps and Open Street Maps.
            OSM data is used to bridge the gaps between Google Maps' available
            and unavailable data - e.g. their junction data is not readily
            available.
          </GameInfoListItem>
          <GameInfoListItem>
            OSM data is crowd sourced, which has its limitations. It is for
            instance often diverging a bit from Google Maps' data. If junctions
            seem mis-positioned, or some addresses don't work, this is likely
            the cause.
          </GameInfoListItem>
          <GameInfoListItem>
            Maps' data is live from their APIs - OSM data is snapshotted in
            time. Contributing and fixing OSM data will not update the game
            straight away, but let me know and I can make a new snapshot.
          </GameInfoListItem>
        </GameInfoList>
      </GameInfoSection>
      <GameInfoSection
        title='Known limitations'
        defaultOpen={false}
      >
        <GameInfoList>
          <GameInfoListItem>
            You would expect all the junctions of a straight road to be
            available. However, the game counts only junctions reachable through
            the included roads of your current junction available. This means
            that if a named road takes a turn at a junction, junctions down that
            turn are available, not ones going straight from the junction.
          </GameInfoListItem>
          <GameInfoListItem>
            Available junctions are only partly decided by traffic rules. This
            might lead you to pick an "illegal" junction, which Google Maps'
            route calculation still has to pass through, taking a detour. As
            long as you know your way around, this shouldn't be a problem! ;-)
          </GameInfoListItem>
          <GameInfoListItem>
            The game uses the end address' road name to determine if it can be
            reached from current position. The address does not always
            correspond with the actual entrance/exit. This might make getting to
            the end point a bit awkward. As Google Maps has additional
            entrance/exit info this also makes the calculated routes a bit
            different. TBD.
          </GameInfoListItem>
          <GameInfoListItem>
            The address auto-complete is set with a south-west and north-east
            bound. These are not calculated correctly for all cities. This
            causes some addresses to not be searchable. TBD.
          </GameInfoListItem>
          <GameInfoListItem>
            Some roads in the same city share name. All these roads' junctions
            are available if your current junction's address share their road
            name. TBD.
          </GameInfoListItem>
        </GameInfoList>
      </GameInfoSection>
      <GameInfoSection
        title='Features to come'
        defaultOpen={false}
      >
        <GameInfoList>
          <GameInfoListItem>Versus mode</GameInfoListItem>
          <GameInfoListItem>
            Play multiple routes in a row, accumulate score / route diff
          </GameInfoListItem>
          <GameInfoListItem>Traffic settings</GameInfoListItem>
          <GameInfoListItem>Pedestrian routes</GameInfoListItem>
          <GameInfoListItem>Public transport routes</GameInfoListItem>
        </GameInfoList>
      </GameInfoSection>
    </GameInfo>
  )
}
