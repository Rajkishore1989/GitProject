using StackExchange.Redis;

namespace Blue.Glaucous.Client
{
    public sealed class RedisConnection
    {
        private static readonly ConnectionMultiplexer RedisConnector;
        private const string HostName = "localhost:6379";

        static RedisConnection()
        {
            RedisConnector = ConnectionMultiplexer.Connect(HostName);
        }

        public static IDatabase Database()
        {
            return RedisConnector.GetDatabase();
        }

        public static IServer Server()
        {
            return RedisConnector.GetServer(HostName);
        }
    }
}