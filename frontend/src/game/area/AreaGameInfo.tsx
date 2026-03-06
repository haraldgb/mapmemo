import { useSelector } from 'react-redux'
import {
  GameInfo,
  GameInfoList,
  GameInfoListItem,
  GameInfoParagraph,
  GameInfoSection,
} from '../../components/GameInfo'
import type { RootState } from '../../store'

type Props = {
  onClose: () => void
}

export const AreaGameInfo = ({ onClose }: Props) => {
  const mode = useSelector(
    (state: RootState) => state.mapmemo.gameSettings.mode,
  )
  return (
    <GameInfo
      title={mode === 'click' ? 'Click mode' : 'Name mode'}
      onClose={onClose}
    >
      <GameInfoParagraph>
        {mode === 'click'
          ? 'Click on the map to identify neighborhoods and districts in the city.'
          : 'Input the name of the neighborhoods and districts of the city'}
      </GameInfoParagraph>
      <GameInfoSection
        title='How to play'
        defaultOpen
      >
        <GameInfoList>
          <GameInfoListItem>
            {mode === 'click'
              ? 'Click somewhere on the map to guess where the prompted area is.'
              : "Write the name of the blinking area. Use the input's auto-complete function to help you(auto-complete not available for harder difficulties)."}
          </GameInfoListItem>
          <GameInfoListItem>
            {mode === 'click'
              ? 'Correct guesses will paint the area green and take you to the next area'
              : 'Correct guesses will paint the area green and take you to the next area'}
            Correct guesses light up the area in green.
          </GameInfoListItem>
          {mode === 'click' ? (
            <GameInfoListItem>
              Incorrect guesses will tell you the area you actually guessed, and
              blink the correct one in red'
            </GameInfoListItem>
          ) : null}
        </GameInfoList>
      </GameInfoSection>
      <GameInfoSection
        title='Data'
        defaultOpen={false}
      >
        <GameInfoList>
          <GameInfoListItem>
            {mode === 'click' ? 'Click' : 'Name'} mode uses data from Oslo
            Kommune together with Google Maps' map. This is why Oslo, Norway is
            the only city available for this mode.
          </GameInfoListItem>
          <GameInfoListItem>
            Open Street Map have some area data, but their granularity differs
            from country to country(city/neigborhood/electoral districts). More
            cities TBD.
          </GameInfoListItem>
        </GameInfoList>
      </GameInfoSection>
      <GameInfoSection
        title='Known limitations'
        defaultOpen={false}
      >
        <GameInfoList>
          <GameInfoListItem>
            Setting a new seed only randomizes the order if using "AREAS - Full
            Pool", not what areas are included. TBD.
          </GameInfoListItem>
          <GameInfoListItem>
            In order to not make the game too easy, the mode uses a map version
            where a lot of features(roads, labels, landmarks, etc.) are hidden.
            This difference might make the map less recognizable.
          </GameInfoListItem>
          {mode === 'name' ? (
            <GameInfoListItem>
              Name mode is quite janky to play on a mobile device. TBD.
            </GameInfoListItem>
          ) : null}
        </GameInfoList>
      </GameInfoSection>
    </GameInfo>
  )
}
