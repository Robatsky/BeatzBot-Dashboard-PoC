const passport = require('passport');
const DiscordStrategy = require('passport-discord');
const User = require('../database/schemas/User');

passport.serializeUser((user, done) => done(null, user.discordId));
passport.deserializeUser( async (discordId, done) => {
    try {
        const user = await User.findOne({discordId});
        return user ? done(null, user) : done(null, null);
    } catch (err) {
        console.log(err);
        done(err, null);
    }
});

passport.use(
    new DiscordStrategy( {
        clientID: process.env.AUTH_CLIENT_ID,
        clientSecret: process.env.AUTH_CLIENT_SECRET,
        callbackURL: process.env.AUTH_CALLBACK_URL,
        passReqToCallback: true,
        scope: ['identify', 'guilds']
    }, async (req, accessToken, refreshToken, profile, done) => {
        const { id, username, discriminator, avatar, guilds} = profile;
        const findUser = await User.findOneAndUpdate( 
            { 
                discordId: id
            }, 
            {
                discordTag: `${username}#${discriminator}`,
                avatar,
                guilds
            },
            {
                new: true
            }
        );
        
        try {
            if(findUser) {
                console.log("User was found");
                return done(null, findUser);
            } else {
                const newUser = await User.create( {
                    discordId: id,
                    discordTag: `${username}#${discriminator}`,
                    avatar,
                    guilds
                });
                return done(null, newUser);
            }
        } catch (err ){
            console.log(err);
            return done(err, null);
        }
    })
);