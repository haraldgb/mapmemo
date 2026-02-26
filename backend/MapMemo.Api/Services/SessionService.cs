using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace MapMemo.Api.Services;

public sealed class MapMemoSessionOptions {
    public string CookieName { get; set; } = "mapmemo_session_id";
    public TimeSpan Ttl { get; set; } = TimeSpan.FromHours(8); // default, overridden by appsettings.json
}

public interface ISessionService {
    string GetOrCreateSessionId(HttpContext context);
    bool HasValidSession(HttpContext context);
}

public sealed class SessionService : ISessionService {
    private readonly IMemoryCache _cache;
    private readonly MapMemoSessionOptions _options;

    public SessionService(IMemoryCache cache, IOptions<MapMemoSessionOptions> options) {
        _cache = cache;
        _options = options.Value;
    }

    public string GetOrCreateSessionId(HttpContext context) {
        if (context.Request.Cookies.TryGetValue(_options.CookieName, out var existingId) &&
            !string.IsNullOrWhiteSpace(existingId) &&
            _cache.TryGetValue(existingId, out _)) {
            _cache.Set(existingId, true, _options.Ttl);
            return existingId;
        }

        var sessionId = Guid.NewGuid().ToString("N");
        var cookieOptions = new CookieOptions {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Secure = context.Request.IsHttps,
            Expires = DateTimeOffset.UtcNow.Add(_options.Ttl),
            Path = "/"
        };

        context.Response.Cookies.Append(_options.CookieName, sessionId, cookieOptions);
        _cache.Set(sessionId, true, _options.Ttl);
        return sessionId;
    }

    public bool HasValidSession(HttpContext context) {
        if (!context.Request.Cookies.TryGetValue(_options.CookieName, out var existingId) ||
            string.IsNullOrWhiteSpace(existingId)) {
            // keep until cookies stop misbehaving
            Console.WriteLine("No session id found in cookies");
            return false;
        }

        return _cache.TryGetValue(existingId, out _);
    }
}
