
import { connect, createLocalTracks } from 'twilio-video';
import { getTwilioToken } from './api_utils';

export const setupTwilio = (ROOM_ID) => {
    createLocalTracks({
        audio: true,
        video: { width: 640 }
    }).then(async (localTracks) => {
        const token = await getTwilioToken(ROOM_ID);
        return connect(token, {
        name: `${ROOM_ID}`,
        tracks: localTracks
        });
    }).then(room => {
        console.log(`Connected to Room: ${room.name}`);
    
        const addParticipant = participant => {
        participant.tracks.forEach(publication => {
            if (publication.isSubscribed) {
            const track = publication.track;
            const elem = track.attach();
            elem.setAttribute('participantidentity', participant.identity);
            document.getElementById('remote-media-div').appendChild(elem);
            }
        });
    
        participant.on('trackSubscribed', track => {
            const elem = track.attach();
            elem.setAttribute('participantidentity', participant.identity);
            document.getElementById('remote-media-div').appendChild(elem);
        });
        }
    
        const trackUnsubscribed = track => {
        // track.detach().forEach(element => element.remove());
        }
    
        const removeParticipant = participant => {
        participant.tracks.forEach(trackUnsubscribed);
        const container = document.getElementById('remote-media-div');
        for (const elem of container.children) {
            console.log(elem)
            if (elem.getAttribute('participantidentity') === participant.identity) {
            console.log('removing', elem);
            elem.pause();
            elem.removeAttribute('src');
            elem.load();
            container.removeChild(elem);
            }
        }
        }
    
        room.participants.forEach(participant => {
        console.log(`Participant "${participant.identity}" is connected to the Room`);
    
        addParticipant(participant);
        });
    
    
        // Attach the Participant's Media to a <div> element.
        room.on('participantConnected', participant => {
        console.log(`Participant "${participant.identity}" connected`);
    
        addParticipant(participant);
        });
    
        room.on('participantDisconnected', participant => {
        console.log(`Participant disconnected: '${participant.identity}'`);
        removeParticipant(participant);
        });
    
        room.on('disconnected', room => {
        // Detach the local media elements
        room.localParticipant.tracks.forEach(publication => {
            const attachedElements = publication.track.detach();
            attachedElements.forEach(element => element.remove());
        });
        });
    
        window.addEventListener('unload', () => {
        room.disconnect();
        });
    });
};