import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/User.model.js";
import dotenv from "dotenv";
dotenv.config();

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const callbackURL =
  process.env.GOOGLE_CALLBACK_URL ||
  "http://localhost:8000/api/v1/auth/google/callback";

// Safety check to prevent app crashing without clear error
if (!clientID || !clientSecret) {
  console.error(
    "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env file!"
  );
}

passport.use(
  new GoogleStrategy(
    {
      clientID: clientID || "MISSING_CLIENT_ID",
      clientSecret: clientSecret || "MISSING_CLIENT_SECRET",
      callbackURL: callbackURL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0]?.value;
        const googleId = profile.id;
        const fullName = profile.displayName;
        const avatar = profile.photos[0]?.value || "";

        let user = await User.findOne({ $or: [{ googleId }, { email }] });

        if (user) {
          if (!user.googleId) user.googleId = googleId;
          if (!user.avatar) user.avatar = avatar;
          user.isVerified = true;
          await user.save();
        } else {
          user = await User.create({
            fullName,
            email,
            googleId,
            avatar,
            isVerified: true,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;