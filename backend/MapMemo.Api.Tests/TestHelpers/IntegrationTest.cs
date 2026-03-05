using Xunit;

namespace MapMemo.Api.Tests.TestHelpers;

[CollectionDefinition("Integration")]
public sealed class IntegrationTestCollection : ICollectionFixture<IntegrationTestFactory>;

[Collection("Integration")]
public abstract class IntegrationTest(IntegrationTestFactory factory) : IAsyncLifetime {
    protected IntegrationTestFactory Factory { get; } = factory;

    public async Task InitializeAsync() => await Factory.ResetDatabaseAsync();

    public Task DisposeAsync() => Task.CompletedTask;
}
