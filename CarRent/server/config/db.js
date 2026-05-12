import mongoose from "mongoose";

const resolveMongoUri = () => {
    const rawUri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME || "car-rental";

    if (!rawUri) {
        throw new Error("MONGODB_URI is missing. Add it to server/.env.");
    }

    const password = process.env.MONGODB_PASSWORD;
    const uriWithPassword = rawUri.includes("<db_password>") && password
        ? rawUri.replace("<db_password>", encodeURIComponent(password))
        : rawUri;

    if (uriWithPassword.includes("<db_password>")) {
        throw new Error("MONGODB_URI still contains <db_password>. Replace it directly or set MONGODB_PASSWORD in server/.env.");
    }

    // If a database name is already included, keep the URI unchanged.
    const hasDbName = /\/[^/?]+(?:\?|$)/.test(uriWithPassword);
    if (hasDbName) {
        return uriWithPassword;
    }

    const [base, query] = uriWithPassword.split("?");
    const baseWithoutTrailingSlash = base.replace(/\/$/, "");
    return query
        ? `${baseWithoutTrailingSlash}/${dbName}?${query}`
        : `${baseWithoutTrailingSlash}/${dbName}`;
};

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => console.log('DB connected'));

        const mongoUri = resolveMongoUri();
        await mongoose.connect(mongoUri);
    } catch (error) {
        throw new Error(`Error connecting to database: ${error.message}`);
    }
};

export default connectDB;