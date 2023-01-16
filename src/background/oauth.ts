import {createURLSearchParams, generateCodeChallenge, generateCodeVerifier} from "../utils";

const buildAuthorizationUrl = async (params: AuthInputParams, PKCECodeVerifier: string) => {
    const url = new URL(params.authorizationEndpoint)
    url.searchParams.set('client_id', params.clientId)
    url.searchParams.set('redirect_uri', params.redirectUri)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('code_challenge_method', 'S256')
    const codeChallenge = await generateCodeChallenge(PKCECodeVerifier)
    url.searchParams.set('code_challenge', codeChallenge)

    return url.toString();
}

export async function doOauth(params: AuthInputParams): Promise<void> {
    // backgroundLog(`params: ${JSON.stringify(params)}`)

    const PKCECodeVerifier = generateCodeVerifier()
    // backgroundLog(`generate code_verifier: ${PKCECodeVerifier}`)
    const authorizationUrl = await buildAuthorizationUrl(params, PKCECodeVerifier)
    // backgroundLog(`build authorizationUrl: ${authorizationUrl}`)

    chrome.identity.launchWebAuthFlow({
        url: authorizationUrl,
        interactive: true
    }, async (callbackUrlString) => {
        if (callbackUrlString === undefined) {
            // backgroundLog("[error] callbackUrlString is undefined")
            return
        } else {
            // backgroundLog(`callbacked url: ${callbackUrlString}`)
        }
        const callbackUrl = new URL(callbackUrlString);
        const code = callbackUrl.searchParams.get('code');
        if (code === null) {
            // backgroundLog("[error] code is null")
            return
        } else {
            // backgroundLog(`code: ${code}`)
        }

        const body = createURLSearchParams({
            grant_type: 'authorization_code',
            client_id: params.clientId,
            redirect_uri: params.redirectUri,
            code: code,
            code_verifier: PKCECodeVerifier,
        })

        const response = await publicClientTokenRequest(
            params.tokenEndpoint,
            body,
        );

        try {
            JSON.stringify(response)
        } catch (e) {
            // backgroundLog(`[error] got malformed json response: ${response}, error: ${e}`)
        }

        chrome.runtime.sendMessage({
            action: "result",
            value: JSON.stringify(response),
        }, () => {
        });

        // TODO: [Base Project] Implement refresh flow
        return chrome.storage.local.set({
            "ffiii_bearer_token": response.access_token,
        }, () => {
        });
    });
}

export function getBearerToken(): Promise<string> {
    return chrome.storage.local.get(["ffiii_bearer_token"]).then(r => {
        return r.ffiii_bearer_token;
    });
}

export function getApiBaseUrl(): Promise<string> {
    return chrome.storage.local.get(["ffiii_api_base_url"]).then(r => {
        return r.ffiii_api_base_url;
    });
}

const publicClientTokenRequest = async (tokenEndpoint: string, body: URLSearchParams) => {
    // backgroundLog(`token request body for public client: ${body}`)
    const data = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
        },
        body: body.toString(),
    }).then(response => response.json()).then(data => {
        return data
    })
    return data
}