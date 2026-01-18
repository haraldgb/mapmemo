import { SecretManagerServiceClient } from '@google-cloud/secret-manager'
import { ExternalAccountClient } from 'google-auth-library'
import { getVercelOidcToken } from '@vercel/oidc'

type ApiResponse = {
  statusCode: number
  setHeader: (name: string, value: string) => void
  end: (data?: string) => void
}

let cachedClientPromise: Promise<SecretManagerServiceClient> | null = null
let cachedKeyPromise: Promise<string> | null = null

const createSecretManagerClient = async () => {
  const productionMode = process.env.PRODUCTION_MODE === 'production'
  if (!productionMode) {
    return new SecretManagerServiceClient()
  }

  const projectId = process.env.GCP_PROJECT_ID
  const projectNumber = process.env.GCP_PROJECT_NUMBER
  const serviceAccountEmail = process.env.GCP_SERVICE_ACCOUNT_EMAIL
  const workloadIdentityPoolId = process.env.GCP_WORKLOAD_IDENTITY_POOL_ID
  const workloadIdentityPoolProviderId = process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID

  if (
    !projectId ||
    !projectNumber ||
    !serviceAccountEmail ||
    !workloadIdentityPoolId ||
    !workloadIdentityPoolProviderId
  ) {
    throw new Error('Missing GCP workload identity environment variables for production mode')
  }

  const authClient = ExternalAccountClient.fromJSON({
    type: 'external_account',
    audience: `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${workloadIdentityPoolId}/providers/${workloadIdentityPoolProviderId}`,
    subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
    token_url: 'https://sts.googleapis.com/v1/token',
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccountEmail}:generateAccessToken`,
    subject_token_supplier: {
      getSubjectToken: getVercelOidcToken,
    },
  })
  if (!authClient) {
    throw new Error('Failed to initialize external account auth client')
  }

  return new SecretManagerServiceClient({
    authClient,
    projectId,
  })
}

const getSecretManagerClient = async () => {
  if (!cachedClientPromise) {
    cachedClientPromise = createSecretManagerClient().catch((error) => {
      cachedClientPromise = null
      throw error
    })
  }
  return cachedClientPromise
}

const loadApiKey = async () => {
  if (cachedKeyPromise) {
    return cachedKeyPromise
  }

  const googleMapsSecretName = process.env.GOOGLE_MAPS_API_KEY_SECRET
  if (!googleMapsSecretName) {
    throw new Error('GOOGLE_MAPS_API_KEY_SECRET environment variable is not set')
  }

  cachedKeyPromise = getSecretManagerClient()
    .then((client) =>
      client.accessSecretVersion({ name: googleMapsSecretName }).then(([version]) => {
        const payload = version.payload?.data?.toString()
        if (!payload) {
          throw new Error('Google Maps API key secret payload is empty')
        }
        return payload
      }),
    )
    .catch((error) => {
      cachedKeyPromise = null
      throw error
    })

  return cachedKeyPromise
}

const sendJson = (res: ApiResponse, statusCode: number, body: unknown) => {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

// eslint-disable-next-line import/no-default-export
export default async function handler(req: { method?: string }, res: ApiResponse) {
  if (req.method && req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  try {
    const apiKey = await loadApiKey()
    sendJson(res, 200, { apiKey })
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Failed to load API key',
    })
  }
}
