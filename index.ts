import { Command } from './phidget';

// Command.start()
//     .subscribe(it => {
//         console.log('start next', it);
//     }, it => {
//         console.log('start error', it);
//     }, () => {
//         console.log('start completed');
//     });


setTimeout(() => {
    Command.checkLeds()
        .subscribe(it => {
            console.log('checkLeds next', it);
        }, it => {
            console.log('checkLeds error', it);
        }, () => {
            console.log('checkLeds completed');
        });
}, 2000);
