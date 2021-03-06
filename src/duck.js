
const Nexmo = require('nexmo');
const config = require('config');
const ConversationClient = require('nexmo-stitch');

class Duck {
    constructor(app) {
        // Initialise NEXMO APIs for both node-nexmo and Client SDK 
        // This implementation is a DEMO case. Ideally we want to dynamically use users in Nexmo-application
        // per user. It should combine google authentication information to get the User and bind to a Nexmo user
        
        const APP_ID = config.get('Nexmo.APP_ID')
        const API_KEY = config.get('Nexmo.API_KEY');
        const API_SECRET = config.get('Nexmo.API_SECRET');
        const PRIVATE_KEY_PATH = config.get('Nexmo.PRIVATE_KEY_PATH');

        const nexmo = new Nexmo({
            apiKey: API_KEY,
            apiSecret: API_SECRET,
            applicationId: APP_ID,
            privateKey: PRIVATE_KEY_PATH,
        });

        const conversationClient = new ConversationClient();
        // create nexmo authentication JWT for our user
        const jwt = nexmo.generateJwt({
            application_id: APP_ID,
            sub: "kostas",
            exp: (new Date().getTime() + 60 * 60 * 1000) / 1000,
            acl: { "paths": { "/v1/users/**": {}, "/v1/conversations/**": {}, "/v1/sessions/**": {}, "/v1/devices/**": {}, "/v1/image/**": {}, "/v3/media/**": {}, "/v1/applications/**": {}, "/v1/push/**": {}, "/v1/knocking/**": {} } }
        });
        //console.log(jwt);
    
        // bind the intents that are setup in in google console - DialogFlow
        app.intent('Default Welcome Intent', conv => {
            // note: if the user is already created this request will fail
            nexmo.users.create(
                {
                    name: "kostas",
                    display_name: "Kostas Kapetanakis",
                    diplay_url: "https://randomuser.me/api/portraits/men/81.jpg"
                },
                () => {
                    conv.ask(`good morning Kostas!, new user is ready`);
                });
        });
        // request the client SDK to login. This will create a websocket where we can listen for incoming
        // events in our conversation
        app.intent('login', conv => {
            return conversationClient.login(jwt)
                .then((stitchApp) => {
                    console.log('logged in');
                    conv.ask(`logged in as Kostas!`);
                    return stitchApp.newConversationAndJoin({ display_name: "Stitch Duck" })
                        .then((conversation) => {
                            console.log('created conversation' + conversation.display_name);
                            conv.ask(`Welcome to the conversation ${conversation.display_name}`);
                            // keep the conversation in wider scope to use in later intents
                            this.conversation = conversation;
                        });
                }).catch(error => console.log(error));
        });
        app.intent('stitch welcome', conv => {
            // send a text in the conversation
            return this.conversation.sendText('hi')
                .then(() => {
                    // feedback for the assistant, that will be delivered to the user
                    conv.ask('message sent');
                }).catch(() => {
                    conv.ask('something went wrong, please try again');
                });
        });
    }
}

module.exports = Duck
