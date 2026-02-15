export default () => ({
    port: parseInt(process.env.PORT as string, 10),
    database: {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT as string, 10),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        name: process.env.DB_NAME,
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN,
    },
    mesta: {
        baseUrl: process.env.MESTA_BASE_URL,
        apiKey: process.env.MESTA_API_KEY,
        apiSecret: process.env.MESTA_API_SECRET,
    },
    frontendUrl: process.env.FRONTEND_URL,
});
