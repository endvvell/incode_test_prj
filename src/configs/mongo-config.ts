export const {
    // the defaults here are the same as in node.dockerfile only to make sure all fields have a value assigned to them
    MONGODB_USERNAME = 'devuser',
    MONGODB_PASSWORD = 'devpassword',
    MONGODB_HOST = '127.0.0.1',
    MONGODB_PORT = '27017',
    MONGODB_DATABASE = 'amazingnewdb-dev',
} = process.env;

export const MONGODB_URI = `mongodb://${encodeURIComponent(MONGODB_USERNAME)}:${encodeURIComponent(
    MONGODB_PASSWORD,
)}@${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}?authSource=admin`;

// Dev connection string:
// mongosh mongodb://devuser:devpassword@127.0.0.1:27017/amazingnewdb-dev?authSource=admin
