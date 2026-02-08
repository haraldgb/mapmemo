using System.Net;

using Microsoft.AspNetCore.Mvc.Testing;

namespace MapMemo.Api.Tests.TestHelpers;

internal static class TestHttpClientFactory {
    public static HttpClient CreateClientWithCookies(
        WebApplicationFactory<Program> factory,
        CookieContainer cookies) {
        factory.ClientOptions.AllowAutoRedirect = false;
        return factory.CreateDefaultClient(new CookieContainerHandler(cookies));
    }

    private sealed class CookieContainerHandler : DelegatingHandler {
        private readonly CookieContainer _cookies;

        public CookieContainerHandler(CookieContainer cookies) => _cookies = cookies;

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) {
            Uri? uri = request.RequestUri;
            if (uri is not null) {
                var cookieHeader = _cookies.GetCookieHeader(uri);
                if (!string.IsNullOrWhiteSpace(cookieHeader)) {
                    request.Headers.TryAddWithoutValidation("Cookie", cookieHeader);
                }
            }

            HttpResponseMessage response = await base.SendAsync(request, cancellationToken);

            if (uri is not null &&
                response.Headers.TryGetValues("Set-Cookie", out IEnumerable<string>? setCookies)) {
                foreach (var setCookie in setCookies) {
                    _cookies.SetCookies(uri, setCookie);
                }
            }

            return response;
        }
    }
}
