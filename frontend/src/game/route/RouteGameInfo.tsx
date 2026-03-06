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
        Navigate from <Bold>A to B</Bold> through the cities' junctions and
        roads.
      </GameInfoParagraph>
      <GameInfoSection
        title='How to play'
        defaultOpen
      >
        <GameInfoList>
          <GameInfoListItem>
            Your goal is to find the quickest route possible between two
            addresses. Click an available junction(purple dot) to select it.
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
            Selectable junctions are only partly decided by traffic rules. This
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
            different.
          </GameInfoListItem>
        </GameInfoList>
      </GameInfoSection>
    </GameInfo>
  )
}
