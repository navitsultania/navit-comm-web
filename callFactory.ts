
import * as Twilio from './twilioService';
import * as ACS from './acsService';
// import { callService as configCallService } from '../../../config'; 

// let callServiceImpl;

// if (configCallService !== 'twilio') {
//     callServiceImpl = ACS;
// } else {
//     callServiceImpl = Twilio;
// }

export const callService = Twilio;

