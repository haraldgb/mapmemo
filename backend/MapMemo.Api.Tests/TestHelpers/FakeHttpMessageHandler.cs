using System.Net;

namespace MapMemo.Api.Tests.TestHelpers;

/// <summary>
/// Mock HTTP handler that returns preconfigured responses for Google API proxy tests.
/// </summary>
internal sealed class FakeHttpMessageHandler : HttpMessageHandler {
    private readonly Func<HttpRequestMessage, HttpResponseMessage> _handler;

    public FakeHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> handler) => _handler = handler;

    public static FakeHttpMessageHandler WithJsonResponse(string json, HttpStatusCode status = HttpStatusCode.OK) {
        return new FakeHttpMessageHandler(_ => new HttpResponseMessage(status) {
            Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json")
        });
    }

    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken) => Task.FromResult(_handler(request));
}
