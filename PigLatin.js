/**
 * Created with JetBrains WebStorm
 * User: brandonxavier
 * Date: 7/28/13
 *

 Copyright 2013 Brandon Xavier (brandonxavier421@gmail.com)

 This file is part of PigLatin.

 PigLatin is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 PigLatin is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with PigLatin.  If not, see <http://www.gnu.org/licenses/>.

 */

var userList = [];

var bcp = {
    aqua: "#00FFFF",
    black: "#000000",
    blue: "#0000FF",
    fuchsia: "#FF00FF",
    gray: "#808080",
    grey: "#808080",
    green: "#008000",
    lime: "#00FF00",
    maroon: "#800000",
    navy: "#000080",
    olive: "#808000",
    orange: "#FFA500",
    purple: "#800080",
    red: "#FF0000",
    silver: "#C0C0C0",
    teal: "#008080",
    white: "#FFFFFF",
    yellow: "#FFFF00"
};

cb.settings_choices = [
    {name: 'pig_threshold', type: 'int',
        minValue: 1, maxValue: 99, defaultValue: 5, label: "Pig Threshold"},
    {name: 'mute_threshold', type: 'int',
        minValue: 5, maxValue: 99, defaultValue: 10, label: "Muted Threshold"},
    {name: 'increment', type: 'int',
        minValue: 0, maxValue: 99, defaultValue: 2, label: "Increment Thresholds After User Tips"},
    {name: 'mod_commands', type: 'choice',
        choice1: 'Mods CAN use commands',
        choice2: 'Mods CANNOT use commands', defaultValue: 'Mods CAN use commands'}
];

cb.onTip( function (tip) {

    // See if the user is in our list and add if not
    for ( var i = 0; i < userList.length && userList[i].name != tip['from_user']; i++ ) {
        // Do nothing
    }

    // I'm giving a user a break here and incrementing if he enters
    // the room and tips before chatting by incrementing his thresholds
    if ( i == userList.length ) { // Means it wasn't found
        i = userList.push( {'name': msg['from_user'], 'mCount': 0,
            'tPig': cb.settings.pig_threshold + cb.settings.increment,
            'tMute': cb.settings.mute_threshold + cb.settings.increment } ) - 1;
        if ( isUserSpecial( i, tip['from_user_in_fanclub'], tip['from_user_is_mod'] ) == true ) {
            userList[i].tPig = 999999;
            userList[i].tMute = 999999;
        }
    }
    // cb.log( " i = " + i + " Count = " + userList[i].mCount );

    // My original thought was to only increment the threshold if it
    // was currently met . . . but that could lead to conditions where
    // the mute threshold was LOWER than the pig threshold
    if ( userList[i].mCount >= userList[i].tPig ) {
        userList[i].tPig += cb.settings.increment;
        userList[i].tMute += cb.settings.increment;
    }

    userList[i].mCount = 0;

} );

cb.onMessage( function (msg) {

    // First check to see if we're handling a command
    if ( processCommands( msg ) == true ) {
        return msg; // This is sloppy, but I hate seeing a function being
        // one giant "If" statement
    }

    // See if the user is in our list and add if not
    for ( var i = 0; i < userList.length && userList[i].name != msg['user']; i++ ) {
        // Do nothing
    }
    if ( i == userList.length ) { // Means it wasn't found
        i = userList.push( {'name': msg['user'], 'mCount': 0,
            'tPig': cb.settings.pig_threshold, 'tMute': cb.settings.mute_threshold } ) - 1;
        if ( isUserSpecial( i, msg['in_fanclub'], msg['is_mod'] ) == true ) {
            userList[i].tPig = 999999;
            userList[i].tMute = 999999;
        }
    }


    // cb.log( " i = " + i + " Count = " + userList[i].mCount );

    // Bump the users' message count
    userList[i].mCount++;

    // If over the thresholds then do "something" to the message
    if ( userList[i].mCount > userList[i].tMute ) {
        msg['X-Spam'] = true;
        cb.chatNotice( "Try TIPPING to become unmuted", userList[i].name,
            bcp.red, bcp.black, "bolder" );
    } else {
        if ( userList[i].mCount > userList[i].tPig ) {
            msg['m'] = toPigLatin( msg['m'] );
            cb.chatNotice( "Try TIPPING to stop chatting in Pig Latin", userList[i].name,
                bcp.yellow, bcp.red, "bolder" );
        }
    }


    return msg;

} );

function toPigLatin(txt) {

    var doubles = ["al", "an", "bl", "br", "ch", "cl", "dr", "fr", "gr",
        "or", "pl", "pr", "ps",
        "sh", "sl", "st", "th", "tr", "wh", "wr"];
    var vowelSounds = ["ea", "ei", "oa", "ou"];
    var vowels = ["a", "e", "i", "o", "u"];

    var punct = [ ",", ".", "/", "<", ">", "?", ";", "'", '"', ":", "[", "]", "{", "}",
        "\\", "|", "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "-", "=", "+", "_",
        "~", "`", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

    var words = txt.split( " " );
    var puncPart = "";


    for ( var i = 0; i < words.length; i++ ) {

        // Skip short words
        if ( words[i].length <= 2 ) {
            continue;
        }

        // Need to do something with punctuation
        puncPart = "";
        for ( var j = words[i].length - 1; j >= 0; j-- ) {
            if ( punct.indexOf( words[i].substr( j, 1 ) ) != -1 ) {
                puncPart = words[i].substr( j );
            } else {
                break;
            }
        }

        // Need to check again for "short" words after non-alpha
        // parsed out
        if ( j > 1 ) {
            words[i] = words[i].substr( 0, j + 1 );

            //
            if ( doubles.indexOf( words[i].substr( 0, 2 ).toLowerCase() ) != -1 ) {
                words[i] = words[i].substr( 2 ) + words[i].substr( 0, 2 ) + "ay" + puncPart;
            } else {
                if ( vowelSounds.indexOf( words[i].substr( 0, 2 ) ) != -1 ) {
                    words[i] = words[i].substr( 2 ) + "way" + puncPart;
                } else {
                    if ( vowels.indexOf( words[i].substr( 0, 1 ) ) == -1 ) {
                        words[i] = words[i].substr( 1 ) + words[i].substr( 0, 1 ) + "ay" + puncPart;
                    } else {
                        words[i] = words[i].substr( 1 ) + "way" + puncPart;
                    }
                }
            }
        }


    }

    return words.join( " " );

}
function processCommands(msg) {

    /**
     *
     * Available commands:
     *
     * /pigreset        - Restarts app all over
     * /pig user        - Puts username in the pig list
     * /pigmute user    - Puts user on the mute list
     * /unpig user      - Removes user from pig/mute lists
     * /notpig user     - Prevents user from being put on a list
     * /help            - Shows commands
     *
     */

    var idx = 0;

    if ( msg['m'].substr( 0, 1 ) != "/" ) {
        return false;
    }

    msg['X-Spam'] = true;
    if ( !(msg['user'] == cb.room_slug ||
        (cb.settings.mod_commands == "Mods CAN use commands" &&
            msg['is_mod'] == true )) ) {
        return true;
    }

    var txt = msg['m']; // convenience
    if ( txt.match( /^\/pigreset/i ) ) {
        userList = [];
        return true;
    }

    if ( txt.match( /^\/pig /i ) ) {
        if ( txt.length > 5 ) {
            if ( txt.substr( 5 ).toLowerCase() == cb.room_slug ) {
                return true;
            }
            idx = findUser( txt.substr( 5 ).toLowerCase() );
            userList[idx].mCount = userList[idx].tPig;
            return true;
        } else {
            cb.chatNotice( "Missing username in command", msg['user'] );
        }
    }

    if ( txt.match( /^\/pigmute /i ) ) {
        if ( txt.length > 9 ) {
            if ( txt.substr( 9 ).toLowerCase() == cb.room_slug ) {
                return true;
            }
            idx = findUser( txt.substr( 9 ).toLowerCase() );
            userList[idx].mCount = userList[idx].tMute;
            return true;
        } else {
            cb.chatNotice( "Missing username in command", msg['user'] );
        }
    }

    if ( txt.match( /^\/unpig /i ) ) {
        if ( txt.length > 7 ) {
            idx = findUser( txt.substr( 7 ).toLowerCase() );
            userList[idx].mCount = 0;
            return true;
        } else {
            cb.chatNotice( "Missing username in command", msg['user'] );
        }
    }

    if ( txt.match( /^\/notpig /i ) ) {
        if ( txt.length > 8 ) {
            idx = findUser( txt.substr( 8 ).toLowerCase() );
            userList[idx].tPig = 999999;
            userList[idx].tMute = 999999;
            return true;
        } else {
            cb.chatNotice( "Missing username in command", msg['user'] );
        }
    }

    if ( txt.match( /^\/help/i ) ) {
        showHelp( msg['user'] );
        return true;
    }

    return true;

}


function isUserSpecial(idx, fanclub, mod) {

    return (userList[idx].name == cb.room_slug) || fanclub == true || mod == true;

}

function findUser(tgt) {

    // I CAN'T assume the user already exists in the list
    for ( var i = 0; i < userList.length && userList[i].name != tgt; i++ ) {
        // Do nothing
    }
    if ( i == userList.length ) { // Means it wasn't found
        i = userList.push( {'name': tgt, 'mCount': 0,
            'tPig': cb.settings.pig_threshold, 'tMute': cb.settings.mute_threshold } ) - 1;
    }
    return i;
}

function showHelp(tgt) {

    cb.chatNotice(
        "Available commands: \n\n" +
            "/pigreset - Restarts app all over\n" +
            "/pig 'user' - Puts username in the pig list\n" +
            "/pigmute 'user' - Puts user on the mute list\n" +
            "/unpig 'user' - Removes user from pig/mute lists\n" +
            "/notpig 'user' - Prevents user from being put on a list\n" +
            "/help - Shows commands\n", tgt
    );

}
function init() {

    showHelp( cb.room_slug );

}

init();
