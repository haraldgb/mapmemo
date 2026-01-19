import { Result, Typography } from 'antd'
import type { FallbackProps } from 'react-error-boundary'

const { Paragraph, Text } = Typography

/**
 * Placeholder fallback component until implementing comprehensive styling.
 */
export const ErrorFallbackAntd = ({ error }: FallbackProps) => {
  const errorMessage =
    error instanceof Error ? error.message : 'error is not an instance of Error'
  const errorStack = error instanceof Error ? error.stack : undefined

  return (
    <Result
      status='error'
      title='Something went wrong'
      subTitle={errorMessage}
    >
      {errorStack ? (
        <Paragraph>
          <Text code>{errorStack}</Text>
        </Paragraph>
      ) : null}
    </Result>
  )
}
